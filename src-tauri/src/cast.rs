use std::str::FromStr;
use std::sync::atomic::AtomicBool;
use std::sync::mpsc::{channel, Sender};
use std::thread;
use log::{error, info};
use mdns_sd::{ServiceDaemon, ServiceEvent};
use rust_cast::{CastDevice, ChannelMessage};
use rust_cast::ChannelMessage::Connection;
use rust_cast::channels::connection::ConnectionResponse;
use rust_cast::channels::heartbeat::HeartbeatResponse;
use rust_cast::channels::receiver::CastDeviceApp;
use rust_cast::message_manager::CastMessagePayload;
use serde_json::{json, Map, Value};
use tauri::{AppHandle, async_runtime, Manager};

const SERVICE_TYPE: &str = "_googlecast._tcp.local.";
const DEFAULT_DESTINATION_ID: &str = "receiver-0";
const CAST_SCREEN_MODEL_NAME: &str = "Chromecast";
const CAST_MODEL_NAME: &str = "md";
const CAST_FRIENDLY_NAME: &str = "fn";
const CAST_ID: &str = "id";
const CAST_APP_ID: &str = "3F768D1D";
const CAST_APP_NAMESPACE: &str = "urn:x-cast:com.soulfiremc";

pub struct CastRunningState {
  pub running: AtomicBool,
}

#[tauri::command]
pub fn discover_casts(app_handle: AppHandle, cast_running_state: tauri::State<'_, CastRunningState>) {
  if cast_running_state.running.load(std::sync::atomic::Ordering::Relaxed) {
    return;
  }

  cast_running_state.running.store(true, std::sync::atomic::Ordering::Relaxed);

  async_runtime::spawn(discover_casts_async(app_handle));
}

#[tauri::command]
pub async fn connect_cast(address: String, port: u16, app_handle: AppHandle) -> String {
  let (tx, rx) = channel();

  thread::spawn(move || {
    create_cast_connection(address, port, app_handle, tx);
  });

  rx.recv().unwrap()
}

async fn discover_casts_async(app_handle: AppHandle) {
  info!("Discovering Cast Devices...");
  let mdns = ServiceDaemon::new().expect("Failed to create mDNS daemon.");

  let receiver = mdns
    .browse(SERVICE_TYPE)
    .expect("Failed to browse mDNS services.");

  let mut announced_full_names = vec![];
  while let Ok(event) = receiver.recv() {
    match event {
      ServiceEvent::ServiceResolved(info) => {
        if info.get_properties().get_property_val_str(CAST_MODEL_NAME).unwrap() != CAST_SCREEN_MODEL_NAME {
          continue;
        }

        let full_name = info.get_fullname();
        let id = info.get_properties().get_property_val_str(CAST_ID).unwrap();
        let name = info.get_properties().get_property_val_str(CAST_FRIENDLY_NAME).unwrap();
        let address = info.get_hostname();
        let port = info.get_port();

        if announced_full_names.contains(&full_name.to_string()) {
          continue;
        }

        announced_full_names.push(full_name.to_string());

        info!("Discovered cast device: {} at {}", name, address);
        app_handle.emit_all("cast-device-discovered",
                            json!({
                                        "id": id,
                                        "full_name": full_name,
                                        "name": name,
                                        "address": address,
                                        "port": port
                                    }),
        ).unwrap();
      }
      ServiceEvent::ServiceRemoved(_, full_name) => {
        if announced_full_names.contains(&full_name) {
          announced_full_names.retain(|x| x != &full_name);

          info!("Removed cast device: {}", full_name);
          app_handle.emit_all("cast-device-removed",
                              json!({
                                            "full_name": full_name
                                        }),
          ).unwrap();
        }
      }
      _ => {}
    }
  }
}

fn create_cast_connection(address: String, port: u16, app_handle: AppHandle, channel: Sender<String>) {
  let cast_device = match CastDevice::connect_without_host_verification(&address, port) {
    Ok(cast_device) => cast_device,
    Err(err) => panic!("Could not establish connection with Cast Device: {:?}", err),
  };

  info!("Connected to Cast Device: {:?} {:?}", address, port);
  cast_device
    .connection
    .connect(DEFAULT_DESTINATION_ID.to_string())
    .unwrap();

  let app_to_run = CastDeviceApp::from_str(CAST_APP_ID).unwrap();
  let application = cast_device.receiver.launch_app(&app_to_run).unwrap();

  cast_device.connection.disconnect(DEFAULT_DESTINATION_ID).unwrap();

  cast_device
    .connection
    .connect(&application.transport_id)
    .unwrap();

  info!("Connected to application: {:?}", application);

  cast_device.receiver.broadcast_message(CAST_APP_NAMESPACE, &json!({
        "type": "INITIAL_HELLO"
    })).unwrap();

  let mut sent_success = false;
  let (tx, rx) = std::sync::mpsc::sync_channel(64);
  loop {
    if let Ok(message) = rx.try_recv() {
      cast_device.receiver.broadcast_message(CAST_APP_NAMESPACE, &message).unwrap();
      info!("Sent message: {:?}", message);
    }

    match cast_device.receive() {
      Ok(ChannelMessage::Heartbeat(response)) => {
        if let HeartbeatResponse::Ping = response {
          cast_device.heartbeat.pong().unwrap();
        }
      }
      Ok(ChannelMessage::Raw(response)) => {
        if response.namespace == CAST_APP_NAMESPACE {
          let CastMessagePayload::String(message) = response.payload else {
            continue;
          };

          let json_message: Map<String, Value> = serde_json::from_str(&message).unwrap();
          info!("Received message: {:?}", json_message);
          let message_type = json_message.get("type").unwrap().as_str().unwrap();
          if message_type == "CHALLENGE_REQUEST" {
            let challenge = json_message.get("challenge").unwrap().as_str().unwrap();
            let response = json!({
                            "type": "CHALLENGE_RESPONSE",
                            "challenge": challenge
                        });
            cast_device.receiver.broadcast_message(CAST_APP_NAMESPACE, &response).unwrap();
          } else if message_type == "LOGIN_SUCCESS" {
            info!("Successfully logged in to Cast Device");

            let tx = tx.clone();
            app_handle.listen_global("cast-global-message", move |event| {
              let message = event.payload().unwrap();
              let message_json: Map<String, Value> = serde_json::from_str(&message).unwrap();

              tx.send(message_json).unwrap();
            });

            if !sent_success {
              channel.send(application.transport_id.to_owned()).unwrap();
              sent_success = true;
            }
          }
        }
      }
      Ok(Connection(connection)) => {
        if let ConnectionResponse::Close = connection {
          info!("Connection closed");
          app_handle.emit_all("cast-device-disconnected", json!({
                        "transport_id": application.transport_id
                    })).unwrap();
          break;
        }
      }
      Err(error) => error!("Error occurred while receiving message {}", error),
      _ => {}
    }
  }
}
