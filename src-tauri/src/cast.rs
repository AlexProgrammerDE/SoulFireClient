use crate::utils::{SFAnyError, SFError};
use async_std::task::sleep;
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
use std::sync::atomic::AtomicBool;
use std::sync::mpsc::{channel, Sender};
use std::sync::Arc;
use std::thread;
use tauri::async_runtime::Mutex;
use tauri::{AppHandle, Emitter, Listener, Manager};

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

async fn discover_casts_async(app_handle: AppHandle) -> Result<(), SFAnyError> {
  info!("Discovering Cast Devices...");
  let mdns = ServiceDaemon::new()?;

  let receiver = mdns.browse(SERVICE_TYPE)?;

  let cast_running_state = app_handle.state::<CastRunningState>();
  while let Ok(event) = receiver.recv() {
    match event {
      ServiceEvent::ServiceResolved(info) => {
        if let Some(model_name) = info
          .get_properties()
          .get_property_val_str(CAST_MODEL_NAME)
          && model_name != CAST_SCREEN_MODEL_NAME
        {
          continue;
        }

        let full_name = info.get_fullname();
        let id = info.get_properties().get_property_val_str(CAST_ID);
        let Some(id) = id else { continue; };

        let name = info
          .get_properties()
          .get_property_val_str(CAST_FRIENDLY_NAME);
        let Some(name) = name else { continue; };

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
          )?;
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
            )?;
        }
      }
      _ => {}
    }
  }

  Ok(())
}

#[tauri::command]
pub async fn get_casts(
  cast_running_state: tauri::State<'_, CastRunningState>,
) -> Result<Value, SFAnyError> {
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
pub async fn connect_cast(address: String, port: u16, app_handle: AppHandle) -> Result<String, SFAnyError> {
  let (tx, rx) = channel();

  thread::spawn(move || {
    if let Err(error) = create_cast_connection(address, port, app_handle, tx) {
      error!("Error during cast connection! {error}")
    }
  });

  Ok(rx.recv()?)
}

fn create_cast_connection(
  address: String,
  port: u16,
  app_handle: AppHandle,
  channel: Sender<String>,
) -> Result<(), SFAnyError> {
  let cast_device = CastDevice::connect_without_host_verification(&address, port)?;

  info!("Connected to Cast Device: {:?} {:?}", address, port);

  // Switch to messages with the device system
  cast_device
    .connection
    .connect(DEFAULT_DESTINATION_ID.to_string())?;

  let app_to_run = CastDeviceApp::from_str(CAST_APP_ID).unwrap();
  let application = cast_device.receiver.launch_app(&app_to_run)?;

  // Switch from device system to messages with the application
  cast_device
    .connection
    .disconnect(DEFAULT_DESTINATION_ID)?;
  cast_device
    .connection
    .connect(&application.transport_id)?;

  info!("Connected to application: {:?}", application);

  // Start health check with the application
  cast_device
    .receiver
    .broadcast_message(
      CAST_APP_NAMESPACE,
      &json!({
                "type": "INITIAL_HELLO"
            }),
    )?;

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
        .broadcast_message(CAST_APP_NAMESPACE, &message)?;
      info!("Sent message: {:?}", message);
    }

    if should_send_healthcheck.load(std::sync::atomic::Ordering::Relaxed) {
      cast_device.heartbeat.ping()?;
      should_send_healthcheck.store(false, std::sync::atomic::Ordering::Relaxed);
    }

    match cast_device.receive() {
      Ok(ChannelMessage::Heartbeat(response)) => {
        match response {
          HeartbeatResponse::Ping => {
            debug!("Received Ping from Cast Device, sending Pong");
            cast_device.heartbeat.pong()?;
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

          let json_message: Map<String, Value> = serde_json::from_str(&message)?;
          info!("Received message: {:?}", json_message);
          let message_type = json_message.get("type").ok_or(SFError::JsonFieldInvalid("type".to_string()))?.as_str().ok_or(SFError::JsonFieldInvalid("type".to_string()))?;
          if message_type == "CHALLENGE_REQUEST" {
            let challenge = json_message.get("challenge").ok_or(SFError::JsonFieldInvalid("challenge".to_string()))?.as_str().ok_or(SFError::JsonFieldInvalid("challenge".to_string()))?;
            let response = json!({
                            "type": "CHALLENGE_RESPONSE",
                            "challenge": challenge
                        });
            cast_device
              .receiver
              .broadcast_message(CAST_APP_NAMESPACE, &response)?;
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
              channel.send(application.transport_id.to_owned())?;
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
              )?;
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

  Ok(())
}
