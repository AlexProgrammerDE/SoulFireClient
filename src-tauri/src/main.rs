// Prevents an additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{env, thread};
use std::net::TcpListener;
use std::str::FromStr;
use std::sync::atomic::AtomicBool;
use std::sync::mpsc::{channel, Sender};
use discord_presence::{Client, Event};
use discord_presence::models::ActivityButton;
use mdns_sd::{ServiceDaemon, ServiceEvent};
use rust_cast::{CastDevice, ChannelMessage};
use rust_cast::channels::heartbeat::HeartbeatResponse;
use rust_cast::channels::receiver::{CastDeviceApp};
use serde::Serialize;
use serde_json::{json, Map, Value};
use tauri::{AppHandle, async_runtime, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};
use tauri::api::process::Command;
use tauri::api::process::CommandEvent::Stdout;
use log::{error, info};
use rust_cast::ChannelMessage::Connection;
use rust_cast::channels::connection::ConnectionResponse;
use rust_cast::message_manager::CastMessagePayload;

fn extract_tar_gz(data: &[u8], target_dir: &std::path::Path, strip_prefix: &str) {
  let decompressed = flate2::read::GzDecoder::new(data);
  let mut archive = tar::Archive::new(decompressed);
  for entry in archive.entries().unwrap() {
    let mut entry = entry.unwrap();
    let path = entry.path().unwrap();
    let path = path.strip_prefix(&strip_prefix).unwrap();
    let path = target_dir.join(path);
    entry.unpack(path).unwrap();
  }
}

fn extract_zip(data: &[u8], target_dir: &std::path::Path, strip_prefix: &str) {
  let mut archive = zip::ZipArchive::new(std::io::Cursor::new(data)).unwrap();
  for i in 0..archive.len() {
    let mut file_data = archive.by_index(i).unwrap();
    let path = file_data.enclosed_name().unwrap();
    let path = path.strip_prefix(&strip_prefix).unwrap();
    let path = target_dir.join(path);
    if file_data.is_dir() {
      std::fs::create_dir_all(&path).unwrap();
    } else {
      let mut file = std::fs::File::create(&path).unwrap();
      std::io::copy(&mut file_data, &mut file).unwrap();
    }
  }
}

#[tauri::command]
async fn run_integrated_server(app_handle: AppHandle) -> String {
  let soul_fire_version = "1.9.0";

  fn send_log<S: Serialize + Clone>(app_handle: &AppHandle, payload: S) {
    app_handle.emit_all("integrated-server-start-log", payload).unwrap();
  }

  let app_local_data_dir = app_handle.path_resolver().app_local_data_dir().unwrap();
  let jvm_dir = app_local_data_dir.join("jvm-21");
  if !jvm_dir.exists() {
    let adoptium_os = detect_os();
    let adoptium_arch = detect_architecture();
    let jvm_url = format!("https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture={}&image_type=jdk&os={}&vendor=eclipse", adoptium_arch, adoptium_os);
    info!("JVM URL: {}", jvm_url);

    send_log(&app_handle, "Fetching JVM data...");
    let response = reqwest::get(&jvm_url).await.unwrap();
    let jvm_json: serde_json::Value = response.json().await.unwrap();
    let download_url = jvm_json[0]["binary"]["package"]["link"].as_str().unwrap();
    let major_version = jvm_json[0]["version"]["major"].as_u64().unwrap();
    let minor_version = jvm_json[0]["version"]["minor"].as_u64().unwrap();
    let security_version = jvm_json[0]["version"]["security"].as_u64().unwrap();
    let build_version = jvm_json[0]["version"]["build"].as_u64().unwrap();
    info!("Download URL: {}", download_url);
    let jdk_archive_dir_name = format!("jdk-{}.{}.{}+{}", major_version, minor_version, security_version, build_version);

    fn send_download_progress(app_handle: &AppHandle, progress: u64, total: u64) {
      send_log(app_handle, format!("Downloading JVM... {}%", progress * 100 / total));
    }

    send_download_progress(&app_handle, 0, 1);
    let mut response = reqwest::get(download_url).await.unwrap();
    let total_size = response.content_length().unwrap();
    let mut downloaded_size = 0;
    let mut content = Vec::new();
    while let Some(chunk) = response.chunk().await.unwrap() {
      downloaded_size += chunk.len() as u64;
      content.extend_from_slice(&chunk);
      send_download_progress(&app_handle, downloaded_size, total_size);
    }

    send_log(&app_handle, "Extracting JVM...");
    if download_url.ends_with(".tar.gz") {
      extract_tar_gz(&content[..], &jvm_dir, &jdk_archive_dir_name);
    } else if download_url.ends_with(".zip") {
      extract_zip(&content[..], &jvm_dir, &jdk_archive_dir_name);
    } else {
      panic!("Unsupported JVM archive format");
    }

    send_log(&app_handle, "Downloaded JVM");
  } else {
    send_log(&app_handle, "JVM already downloaded");
  }

  let jars_dir = app_local_data_dir.join("jars");
  if !jars_dir.exists() {
    std::fs::create_dir(&jars_dir).unwrap();
  }

  let soul_fire_version_file = jars_dir.join(format!("SoulFireDedicated-{}.jar", soul_fire_version));
  if !soul_fire_version_file.exists() {
    send_log(&app_handle, "Fetching SoulFire data...");
    let soul_fire_url = format!("https://github.com/AlexProgrammerDE/SoulFire/releases/download/{}/SoulFireDedicated-{}.jar", soul_fire_version, soul_fire_version);
    info!("SoulFire URL: {}", soul_fire_url);

    fn send_download_progress(app_handle: &AppHandle, progress: u64, total: u64) {
      send_log(app_handle, format!("Downloading SoulFire... {}%", progress * 100 / total));
    }

    send_download_progress(&app_handle, 0, 1);
    let mut response = reqwest::get(&soul_fire_url).await.unwrap();
    let mut content = Vec::new();
    let total_size = response.content_length().unwrap();
    let mut downloaded_size = 0;
    while let Some(chunk) = response.chunk().await.unwrap() {
      downloaded_size += chunk.len() as u64;
      content.extend_from_slice(&chunk);
      send_download_progress(&app_handle, downloaded_size, total_size);
    }

    send_log(&app_handle, "Saving SoulFire...");
    std::fs::write(&soul_fire_version_file, &content).unwrap();
    send_log(&app_handle, "Downloaded SoulFire");
  } else {
    send_log(&app_handle, "SoulFire already downloaded");
  }

  let soul_fire_rundir = app_local_data_dir.join("soulfire");
  if !soul_fire_rundir.exists() {
    std::fs::create_dir(&soul_fire_rundir).unwrap();
  }

  send_log(&app_handle, "Starting SoulFire server...");

  let java_exec_name = get_java_exec_name();
  let java_bin_dir = jvm_dir.join("bin");
  let java_exec_path = java_bin_dir.join(java_exec_name);
  let java_exec_path = java_exec_path.to_str().unwrap();

  let available_port = find_next_available_port(38765).unwrap();

  info!("Java Executable: {}", java_exec_path);
  let command = Command::new(java_exec_path)
    .current_dir(soul_fire_rundir)
    .args(&[
      format!("-Dsf.grpc.port={}", available_port).as_str(),
      "-jar",
      soul_fire_version_file.to_str().unwrap()
    ]);

  let (mut rx, mut child) = command.spawn().expect("Failed to spawn sidecar");

  // Print all rx messages
  while let Some(message) = rx.recv().await {
    if let Stdout(line) = message {
      let line = strip_ansi_escapes::strip_str(line);
      if line.contains("Finished loading!") {
        send_log(&app_handle, "SoulFire server started");
        break;
      } else {
        send_log(&app_handle, line);
      }
    }
  }

  child.write("generate-token\n".as_bytes()).expect("Failed to write to dedicated server");

  let token: String = loop {
    if let Some(message) = rx.recv().await {
      if let Stdout(line) = message {
        if line.contains("JWT") {
          break line.split_whitespace().last().unwrap().to_string();
        }
      }
    }
  };

  let url = format!("http://127.0.0.1:{}", available_port);
  return format!("{}\n{}", url, token);
}

fn get_java_exec_name() -> &'static str {
  if cfg!(target_os = "windows") {
    "javaw.exe"
  } else {
    "java"
  }
}


fn find_next_available_port(start_port: u16) -> Option<u16> {
  for port in start_port..=u16::MAX {
    if is_port_available(port) {
      return Some(port);
    }
  }
  None
}

fn is_port_available(port: u16) -> bool {
  match TcpListener::bind(("127.0.0.1", port)) {
    Ok(listener) => {
      drop(listener);
      true
    }
    Err(_) => false,
  }
}

fn detect_architecture() -> &'static str {
  if cfg!(target_arch = "x86_64") {
    "x64"
  } else if cfg!(target_arch = "x86") {
    "x32"
  } else if cfg!(target_arch = "powerpc64") {
    "ppc64"
  } else if cfg!(target_arch = "powerpc64le") {
    "ppc64le"
  } else if cfg!(target_arch = "s390x") {
    "s390x"
  } else if cfg!(target_arch = "aarch64") {
    "aarch64"
  } else if cfg!(target_arch = "arm") {
    "arm"
  } else if cfg!(target_arch = "sparc64") {
    "sparcv9"
  } else if cfg!(target_arch = "riscv64") {
    "riscv64"
  } else {
    "unknown"
  }
}

fn detect_os() -> &'static str {
  if cfg!(target_os = "linux") && cfg!(target_env = "musl") {
    "alpine-linux"
  } else if cfg!(target_os = "linux") {
    "linux"
  } else if cfg!(target_os = "windows") {
    "windows"
  } else if cfg!(target_os = "macos") {
    "mac"
  } else if cfg!(target_os = "solaris") {
    "solaris"
  } else if cfg!(target_os = "aix") {
    "aix"
  } else {
    "unknown"
  }
}

const SERVICE_TYPE: &str = "_googlecast._tcp.local.";
const DEFAULT_DESTINATION_ID: &str = "receiver-0";
const CAST_SCREEN_MODEL_NAME: &str = "Chromecast";
const CAST_MODEL_NAME: &str = "md";
const CAST_FRIENDLY_NAME: &str = "fn";
const CAST_ID: &str = "id";
const CAST_APP_ID: &str = "3F768D1D";
const CAST_APP_NAMESPACE: &str = "urn:x-cast:com.soulfiremc";

struct CastRunningState {
  running: AtomicBool,
}

#[tauri::command]
fn discover_casts(app_handle: AppHandle, cast_running_state: tauri::State<'_, CastRunningState>) {
  if cast_running_state.running.load(std::sync::atomic::Ordering::Relaxed) {
    return;
  }

  cast_running_state.running.store(true, std::sync::atomic::Ordering::Relaxed);

  async_runtime::spawn(discover_casts_async(app_handle));
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

#[tauri::command]
async fn connect_cast(address: String, port: u16, app_handle: AppHandle) -> String {
  let (tx, rx) = channel();

  thread::spawn(move || {
    create_cast_connection(address, port, app_handle, tx);
  });

  rx.recv().unwrap()
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
      info!("Sending message to Cast Device: {:?}", message);
      cast_device.receiver.broadcast_message(CAST_APP_NAMESPACE, &message).unwrap();
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
              let message_json: Value = serde_json::from_str(&message).unwrap();

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

fn load_discord_rpc() {
  let mut drpc = Client::new(1248603974475583608);

  let _ready = drpc.on_ready(|_ctx| {
    println!("ready?");
    ;
  });

  let _activity_join_request = drpc.on_activity_join_request(|ctx| {
    println!("Join request: {:?}", ctx.event);
  });

  let _activity_join = drpc.on_activity_join(|ctx| {
    println!("Joined: {:?}", ctx.event);
  });

  let _activity_spectate = drpc.on_activity_spectate(|ctx| {
    println!("Spectate: {:?}", ctx.event);
  });

  drpc.start();

  drpc.block_until_event(Event::Ready).unwrap();
  if let Err(why) = drpc.set_activity(|a| {
    a.state("Idling")
      .assets(|ass| {
        ass.large_image("logo")
          .large_text("SoulFire logo")
      })
      .append_buttons(|button|
        button
          .label("Learn more")
          .url("https://soulfiremc.com")
      )
  }) {
    println!("Failed to set presence: {}", why);
  }

  drpc.block_on().unwrap();
}

fn main() {
  env_logger::init();

  thread::spawn(|| {
    load_discord_rpc()
  });

  let open = CustomMenuItem::new("open".to_string(), "Open SoulFire");
  let quit = CustomMenuItem::new("quit".to_string(), "Quit SoulFire");
  let tray_menu = SystemTrayMenu::new()
    .add_item(open)
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(quit);
  tauri::Builder::default()
    .manage(CastRunningState {
      running: AtomicBool::new(false),
    })
    .invoke_handler(tauri::generate_handler![run_integrated_server, discover_casts, connect_cast])
    .system_tray(SystemTray::new().with_menu(tray_menu))
    .on_system_tray_event(|app, event| match event {
      SystemTrayEvent::MenuItemClick { id, .. } => {
        match id.as_str() {
          "open" => {
            app.get_window("main").unwrap().show().unwrap();
          }
          "quit" => {
            app.exit(0);
          }
          _ => {}
        }
      }
      _ => {}
    })
    .setup(|app| {
      let main_window = app.get_window("main").unwrap();
      let app_version = &app.package_info().version;
      let _ = main_window.set_title(format!("SoulFireClient {app_version}").as_str());
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
