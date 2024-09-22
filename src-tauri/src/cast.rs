use log::{debug, error, info};
use mdns_sd::{ServiceDaemon, ServiceEvent};
use rust_cast::channels::connection::ConnectionResponse;
use rust_cast::channels::heartbeat::HeartbeatResponse;
use rust_cast::channels::receiver::CastDeviceApp;
use rust_cast::message_manager::CastMessagePayload;
use rust_cast::ChannelMessage::Connection;
use rust_cast::{CastDevice, ChannelMessage};
use serde_json::{json, Map, Value};
use std::str::FromStr;
use std::sync::{Arc};
use std::sync::atomic::AtomicBool;
use std::sync::mpsc::{channel, Sender};
use std::thread;
use async_std::task::sleep;
use tauri::{AppHandle, Emitter, Listener, Manager};
use tauri::async_runtime::Mutex;

const SERVICE_TYPE: &str = "_googlecast._tcp.local.";
const DEFAULT_DESTINATION_ID: &str = "receiver-0";
const CAST_SCREEN_MODEL_NAME: &str = "Chromecast";
const CAST_MODEL_NAME: &str = "md";
const CAST_FRIENDLY_NAME: &str = "fn";
const CAST_ID: &str = "id";
const CAST_APP_ID: &str = "3F768D1D";
const CAST_APP_NAMESPACE: &str = "urn:x-cast:com.soulfiremc";

pub struct DiscoveredCast {
  pub id: String,
  pub full_name: String,
  pub name: String,
  pub address: String,
  pub port: u16,
}

pub struct CastRunningState {
  pub running: AtomicBool,
  pub announced_devices: Mutex<Vec<DiscoveredCast>>,
}

impl CastRunningState {
  pub async fn add_discovered_device(&self, device: DiscoveredCast) {
    self.announced_devices.lock().await.push(device);
  }

  pub async fn contains_discovered_device(&self, full_name: String) -> bool {
    self.announced_devices.lock().await.iter().any(|x| x.full_name == full_name)
  }

  pub async fn remove_discovered_device(&self, full_name: String) {
    self.announced_devices.lock().await.retain(|x| x.full_name != full_name);
  }
}

#[tauri::command]
pub fn discover_casts(
  app_handle: AppHandle,
  cast_running_state: tauri::State<'_, CastRunningState>,
) {
  if cast_running_state
    .running
    .load(std::sync::atomic::Ordering::Relaxed)
  {
    return;
  }

  cast_running_state
    .running
    .store(true, std::sync::atomic::Ordering::Relaxed);

  tauri::async_runtime::spawn(discover_casts_async(app_handle));
}

async fn discover_casts_async(app_handle: AppHandle) {
  info!("Discovering Cast Devices...");
  let mdns = ServiceDaemon::new().expect("Failed to create mDNS daemon.");

  let receiver = mdns
    .browse(SERVICE_TYPE)
    .expect("Failed to browse mDNS services.");

  let cast_running_state = app_handle.state::<CastRunningState>();
  while let Ok(event) = receiver.recv() {
    match event {
      ServiceEvent::ServiceResolved(info) => {
        if info
          .get_properties()
          .get_property_val_str(CAST_MODEL_NAME)
          .unwrap()
          != CAST_SCREEN_MODEL_NAME
        {
          continue;
        }

        let full_name = info.get_fullname();
        let id = info.get_properties().get_property_val_str(CAST_ID).unwrap();
        let name = info
          .get_properties()
          .get_property_val_str(CAST_FRIENDLY_NAME)
          .unwrap();
        let address = info.get_hostname();
        let port = info.get_port();

        if cast_running_state.contains_discovered_device(full_name.to_string()).await {
          continue;
        }

        cast_running_state.add_discovered_device(DiscoveredCast {
          id: id.to_string(),
          full_name: full_name.to_string(),
          name: name.to_string(),
          address: address.to_string(),
          port,
        }).await;

        info!("Discovered cast device: {} at {}", name, address);
        app_handle
          .emit(
            "cast-device-discovered",
            json!({
                            "id": id,
                            "full_name": full_name,
                            "name": name,
                            "address": address,
                            "port": port
                        }),
          )
          .unwrap();
      }
      ServiceEvent::ServiceRemoved(_, full_name) => {
        if cast_running_state.contains_discovered_device(full_name.to_string()).await {
          cast_running_state.remove_discovered_device(full_name.to_string()).await;

          info!("Removed cast device: {}", full_name);
          app_handle
            .emit(
              "cast-device-removed",
              json!({
                                "full_name": full_name
                            }),
            )
            .unwrap();
        }
      }
      _ => {}
    }
  }
}

#[tauri::command]
pub async fn get_casts(
  cast_running_state: tauri::State<'_, CastRunningState>,
) -> Result<Value, ()> {
  let devices = cast_running_state.announced_devices.lock().await;
  let devices_json: Vec<Value> = devices
    .iter()
    .map(|device| {
      json!({
                "id": device.id,
                "full_name": device.full_name,
                "name": device.name,
                "address": device.address,
                "port": device.port
            })
    })
    .collect();

  Ok(json!(devices_json))
}

#[tauri::command]
pub async fn connect_cast(address: String, port: u16, app_handle: AppHandle) -> String {
  let (tx, rx) = channel();

  thread::spawn(move || {
    create_cast_connection(address, port, app_handle, tx);
  });

  rx.recv().unwrap()
}

fn create_cast_connection(
  address: String,
  port: u16,
  app_handle: AppHandle,
  channel: Sender<String>,
) {
  let cast_device = match CastDevice::connect_without_host_verification(&address, port) {
    Ok(cast_device) => cast_device,
    Err(err) => panic!("Could not establish connection with Cast Device: {:?}", err),
  };

  info!("Connected to Cast Device: {:?} {:?}", address, port);

  // Switch to messages with the device system
  cast_device
    .connection
    .connect(DEFAULT_DESTINATION_ID.to_string())
    .unwrap();

  let app_to_run = CastDeviceApp::from_str(CAST_APP_ID).unwrap();
  let application = cast_device.receiver.launch_app(&app_to_run).unwrap();

  // Switch from device system to messages with the application
  cast_device
    .connection
    .disconnect(DEFAULT_DESTINATION_ID)
    .unwrap();
  cast_device
    .connection
    .connect(&application.transport_id)
    .unwrap();

  info!("Connected to application: {:?}", application);

  // Start health check with the application
  cast_device
    .receiver
    .broadcast_message(
      CAST_APP_NAMESPACE,
      &json!({
                "type": "INITIAL_HELLO"
            }),
    )
    .unwrap();

  let mut sent_success = false;
  let (send_frontend, read_frontend) = std::sync::mpsc::sync_channel(64);
  let should_send_healthcheck = Arc::new(AtomicBool::new(true));

  let should_send_healthcheck_clone = should_send_healthcheck.clone();
  tauri::async_runtime::spawn(async move {
    loop {
      sleep(std::time::Duration::from_secs(5)).await;
      should_send_healthcheck_clone.store(true, std::sync::atomic::Ordering::Relaxed);
    }
  });

  loop {
    while let Ok(message) = read_frontend.try_recv() {
      cast_device
        .receiver
        .broadcast_message(CAST_APP_NAMESPACE, &message)
        .unwrap();
      info!("Sent message: {:?}", message);
    }

    if should_send_healthcheck.load(std::sync::atomic::Ordering::Relaxed) {
      cast_device.heartbeat.ping().unwrap();
      should_send_healthcheck.store(false, std::sync::atomic::Ordering::Relaxed);
    }

    match cast_device.receive() {
      Ok(ChannelMessage::Heartbeat(response)) => {
        match response {
          HeartbeatResponse::Ping => {
            debug!("Received Ping from Cast Device, sending Pong");
            cast_device.heartbeat.pong().unwrap();
          }
          HeartbeatResponse::Pong => {
            debug!("Received Pong from Cast Device");
          }
          HeartbeatResponse::NotImplemented(message_type, _) => {
            error!("Received unknown message type: {}", message_type);
          }
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
            cast_device
              .receiver
              .broadcast_message(CAST_APP_NAMESPACE, &response)
              .unwrap();
          } else if message_type == "LOGIN_SUCCESS" {
            info!("Successfully logged in to Cast Device");

            let send_frontend_clone = send_frontend.clone();
            app_handle.listen("cast-global-message", move |event| {
              let message = event.payload();
              let message_json: Map<String, Value> =
                serde_json::from_str(&message).unwrap();

              send_frontend_clone.send(message_json).unwrap();
            });

            if !sent_success {
              channel.send(application.transport_id.to_owned()).unwrap();
              sent_success = true;
            }
          }
        }
      }
      Ok(Connection(connection)) => {
        match connection {
          ConnectionResponse::Connect => {
            info!("Connected to Cast Device");
          }
          ConnectionResponse::Close => {
            info!("Connection closed");
            app_handle
              .emit(
                "cast-device-disconnected",
                json!({
                                "transport_id": application.transport_id
                            }),
              )
              .unwrap();
            break;
          }
          ConnectionResponse::NotImplemented(message_type, _) => {
            error!("Received unknown message type: {}", message_type);
          }
        }
      }
      Ok(ChannelMessage::Media(response)) => {
        debug!("Received Media message: {:?}", response);
      }
      Ok(ChannelMessage::Receiver(response)) => {
        debug!("Received Receiver message: {:?}", response);
      }
      Err(error) => error!("Error occurred while receiving message {}", error),
    }
  }
}
