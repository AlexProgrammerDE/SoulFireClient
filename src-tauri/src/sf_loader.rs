use crate::utils::{
  detect_architecture, detect_os, extract_tar_gz, extract_zip, find_next_available_port,
  get_java_exec_name,
};
use log::info;
use serde::Serialize;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use sha2::Digest;
use tauri::async_runtime::Mutex;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_shell::process::CommandEvent::Stdout;
use tauri_plugin_shell::process::CommandChild;
use tauri_plugin_shell::ShellExt;
use tempfile::tempdir;

pub struct IntegratedServerState {
  pub starting: Arc<AtomicBool>,
  pub child_process: Arc<Mutex<Option<Box<CommandChild>>>>,
}

#[tauri::command]
pub async fn run_integrated_server(
  app_handle: AppHandle,
  integrated_server_state: tauri::State<'_, IntegratedServerState>,
) -> Result<String, ()> {
  if integrated_server_state
    .starting
    .load(std::sync::atomic::Ordering::Relaxed)
  {
    return Ok("Server already starting".to_string());
  }

  integrated_server_state
    .starting
    .store(true, std::sync::atomic::Ordering::Relaxed);

  let soul_fire_version = "1.13.1";

  fn send_log<S: Serialize + Clone>(app_handle: &AppHandle, payload: S) {
    app_handle
      .emit("integrated-server-start-log", payload)
      .unwrap();
  }

  let app_local_data_dir = app_handle.path().app_local_data_dir().unwrap();
  let jvm_dir = app_local_data_dir.join("jvm-21");
  if !jvm_dir.exists() {
    let adoptium_os = detect_os();
    let adoptium_arch = detect_architecture();
    let jvm_url = format!("https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture={}&image_type=jdk&os={}&vendor=eclipse", adoptium_arch, adoptium_os);
    info!("JVM URL: {}", jvm_url);

    send_log(&app_handle, "Fetching JVM data...");
    let response = reqwest::get(&jvm_url).await.unwrap();
    let jvm_json: serde_json::Value = response.json().await.unwrap();
    let checksum = jvm_json[0]["binary"]["package"]["checksum"].as_str().unwrap();
    let download_url = jvm_json[0]["binary"]["package"]["link"].as_str().unwrap();
    let major_version = jvm_json[0]["version"]["major"].as_u64().unwrap();
    let minor_version = jvm_json[0]["version"]["minor"].as_u64().unwrap();
    let security_version = jvm_json[0]["version"]["security"].as_u64().unwrap();
    let build_version = jvm_json[0]["version"]["build"].as_u64().unwrap();
    info!("Download URL: {}", download_url);
    let jdk_archive_dir_name = format!(
      "jdk-{}.{}.{}+{}",
      major_version, minor_version, security_version, build_version
    );

    fn send_download_progress(app_handle: &AppHandle, progress: u64, total: u64) {
      send_log(
        app_handle,
        format!("Downloading JVM... {}%", progress * 100 / total),
      );
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

    send_log(&app_handle, "Verifying sha256 checksum...");
    let mut hasher = sha2::Sha256::new();
    hasher.update(&content);
    let hash = hasher.finalize();
    let hash = format!("{:x}", hash);
    if hash != checksum {
      send_log(&app_handle, "Checksum verification failed");
      return Err(());
    }

    send_log(&app_handle, "Extracting JVM...");

    let jvm_tmp_dir = tempdir().unwrap();
    if download_url.ends_with(".tar.gz") {
      extract_tar_gz(&content[..], jvm_tmp_dir.path());
    } else if download_url.ends_with(".zip") {
      extract_zip(&content[..], jvm_tmp_dir.path());
    } else {
      panic!("Unsupported JVM archive format");
    }

    std::fs::rename(jvm_tmp_dir.path().join(jdk_archive_dir_name), &jvm_dir).unwrap();

    jvm_tmp_dir.close().unwrap();
    send_log(&app_handle, "Downloaded JVM");
  } else {
    send_log(&app_handle, "JVM already downloaded");
  }

  let jars_dir = app_local_data_dir.join("jars");
  if !jars_dir.exists() {
    std::fs::create_dir(&jars_dir).unwrap();
  }

  let soul_fire_version_file =
    jars_dir.join(format!("SoulFireDedicated-{}.jar", soul_fire_version));
  if !soul_fire_version_file.exists() {
    send_log(&app_handle, "Fetching SoulFire data...");
    let soul_fire_url = format!("https://github.com/AlexProgrammerDE/SoulFire/releases/download/{}/SoulFireDedicated-{}.jar", soul_fire_version, soul_fire_version);
    info!("SoulFire URL: {}", soul_fire_url);

    fn send_download_progress(app_handle: &AppHandle, progress: u64, total: u64) {
      send_log(
        app_handle,
        format!("Downloading SoulFire... {}%", progress * 100 / total),
      );
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
  let command = app_handle.shell().command(java_exec_path)
    .current_dir(soul_fire_rundir)
    .args(&[
      format!("-Dsf.grpc.port={}", available_port).as_str(),
      "-XX:+EnableDynamicAgentLoading",
      "-XX:+UnlockExperimentalVMOptions",
      "-XX:+UseZGC",
      "-XX:+ZGenerational",
      "-XX:+AlwaysActAsServerClassMachine",
      "-XX:+UseNUMA",
      "-XX:+UseFastUnorderedTimeStamps",
      "-XX:+UseVectorCmov",
      "-XX:+UseCriticalJavaThreadPriority",
      "-Dsf.flags.v1=true",
      "-jar",
      soul_fire_version_file.to_str().unwrap(),
    ]);

  let (mut rx, mut child) = command.spawn().expect("Failed to spawn sidecar");

  // Print all rx messages
  while let Some(message) = rx.recv().await {
    if let Stdout(line) = message {
      let line = String::from_utf8(line).unwrap();
      let line = strip_ansi_escapes::strip_str(line);
      if line.contains("Finished loading!") {
        send_log(&app_handle, "Generating token...");
        break;
      } else {
        send_log(&app_handle, line);
      }
    }
  }

  child
    .write("generate-token\n".as_bytes())
    .expect("Failed to write to dedicated server");

  let token: String = loop {
    if let Some(message) = rx.recv().await {
      if let Stdout(line) = message {
        let line = String::from_utf8(line).unwrap();
        if line.contains("JWT") {
          break line.split_whitespace().last().unwrap().to_string();
        }
      }
    }
  };

  integrated_server_state
    .child_process
    .lock()
    .await
    .replace(Box::from(child));

  let url = format!("http://127.0.0.1:{}", available_port);
  Ok(format!("{}\n{}", url, token))
}
