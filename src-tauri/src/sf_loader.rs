use crate::utils::{detect_architecture, detect_os, extract_tar_gz, extract_zip, find_random_available_port, get_java_exec_name, SFAnyError, SFError};
use log::info;
use serde::Serialize;
use sha2::Digest;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use tauri::async_runtime::Mutex;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_shell::process::CommandChild;
use tauri_plugin_shell::process::CommandEvent::Stdout;
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
) -> Result<String, SFAnyError> {
  if integrated_server_state
    .starting
    .load(std::sync::atomic::Ordering::Relaxed)
  {
    return Ok("Server already starting".to_string());
  }

  integrated_server_state
    .starting
    .store(true, std::sync::atomic::Ordering::Relaxed);

  let soul_fire_version = "1.14.0";

  fn send_log<S: Serialize + Clone>(app_handle: &AppHandle, payload: S) -> tauri::Result<()> {
    info!("{}", serde_json::to_string(&payload)?);
    app_handle
      .emit("integrated-server-start-log", payload)
  }

  let app_local_data_dir = app_handle.path().app_local_data_dir()?;
  let jvm_dir = app_local_data_dir.join("jvm-21");
  if !jvm_dir.exists() {
    let adoptium_os = detect_os();
    let adoptium_arch = detect_architecture();
    let jvm_url = format!("https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture={}&image_type=jre&os={}&vendor=eclipse", adoptium_arch, adoptium_os);
    info!("JVM URL: {}", jvm_url);

    send_log(&app_handle, "Fetching JVM data...")?;
    let response = reqwest::get(&jvm_url).await?;
    let jvm_json: serde_json::Value = response.json().await?;
    let checksum = jvm_json[0]["binary"]["package"]["checksum"].as_str().ok_or(SFError::JsonFieldInvalid("binary.package.checksum".to_string()))?;
    let download_url = jvm_json[0]["binary"]["package"]["link"].as_str().ok_or(SFError::JsonFieldInvalid("binary.package.link".to_string()))?;
    let major_version = jvm_json[0]["version"]["major"].as_u64().ok_or(SFError::JsonFieldInvalid("version.major".to_string()))?;
    let minor_version = jvm_json[0]["version"]["minor"].as_u64().ok_or(SFError::JsonFieldInvalid("version.minor".to_string()))?;
    let security_version = jvm_json[0]["version"]["security"].as_u64().ok_or(SFError::JsonFieldInvalid("version.security".to_string()))?;
    let build_version = jvm_json[0]["version"]["build"].as_u64().ok_or(SFError::JsonFieldInvalid("version.build".to_string()))?;
    info!("Download URL: {}", download_url);
    let jvm_archive_dir_name = format!(
      "jdk-{}.{}.{}+{}-jre",
      major_version, minor_version, security_version, build_version
    );

    fn send_download_progress(app_handle: &AppHandle, progress: u64, total: u64) -> tauri::Result<()> {
      send_log(
        app_handle,
        format!("Downloading JVM... {}%", progress * 100 / total),
      )
    }

    send_download_progress(&app_handle, 0, 1)?;
    let mut response = reqwest::get(download_url).await?;
    let total_size = response.content_length().ok_or(SFError::NoContentLengthHeader)?;
    let mut downloaded_size = 0;
    let mut content = Vec::new();
    while let Some(chunk) = response.chunk().await? {
      downloaded_size += chunk.len() as u64;
      content.extend_from_slice(&chunk);
      send_download_progress(&app_handle, downloaded_size, total_size)?;
    }

    send_log(&app_handle, "Verifying sha256 checksum...")?;
    let mut hasher = sha2::Sha256::new();
    hasher.update(&content);
    let hash = hasher.finalize();
    let hash = hex::encode(hash);
    if hash != checksum {
      send_log(&app_handle, "Checksum verification failed")?;
      return Err(SFAnyError::from(SFError::InvalidJvmChecksum));
    }

    send_log(&app_handle, "Extracting JVM...")?;

    let jvm_tmp_dir = tempdir()?;
    if download_url.ends_with(".tar.gz") {
      let _ = extract_tar_gz(&content[..], jvm_tmp_dir.path())?;
    } else if download_url.ends_with(".zip") {
      let _ = extract_zip(&content[..], jvm_tmp_dir.path())?;
    } else {
      panic!("Unsupported JVM archive format");
    }

    std::fs::rename(jvm_tmp_dir.path().join(jvm_archive_dir_name), &jvm_dir)?;

    jvm_tmp_dir.close()?;
    send_log(&app_handle, "Downloaded JVM")?;
  } else {
    send_log(&app_handle, "JVM already downloaded")?;
  }

  let jars_dir = app_local_data_dir.join("jars");
  if !jars_dir.exists() {
    std::fs::create_dir(&jars_dir)?;
  }

  let soul_fire_version_file =
    jars_dir.join(format!("SoulFireDedicated-{}.jar", soul_fire_version));
  if !soul_fire_version_file.exists() {
    send_log(&app_handle, "Fetching SoulFire data...")?;
    let soul_fire_url = format!("https://github.com/AlexProgrammerDE/SoulFire/releases/download/{}/SoulFireDedicated-{}.jar", soul_fire_version, soul_fire_version);
    info!("SoulFire URL: {}", soul_fire_url);

    fn send_download_progress(app_handle: &AppHandle, progress: u64, total: u64) -> tauri::Result<()> {
      send_log(
        app_handle,
        format!("Downloading SoulFire... {}%", progress * 100 / total),
      )
    }

    send_download_progress(&app_handle, 0, 1)?;
    let mut response = reqwest::get(&soul_fire_url).await?;
    let mut content = Vec::new();
    let total_size = response.content_length().ok_or(SFError::NoContentLengthHeader)?;
    let mut downloaded_size = 0;
    while let Some(chunk) = response.chunk().await? {
      downloaded_size += chunk.len() as u64;
      content.extend_from_slice(&chunk);
      send_download_progress(&app_handle, downloaded_size, total_size)?;
    }

    send_log(&app_handle, "Saving SoulFire...")?;
    std::fs::write(&soul_fire_version_file, &content)?;
    send_log(&app_handle, "Downloaded SoulFire")?;
  } else {
    send_log(&app_handle, "SoulFire already downloaded")?;
  }

  info!("Integrated Server SoulFire Jar: {}", soul_fire_version_file.to_str().ok_or(SFError::PathCouldNotBeConverted)?);

  let soul_fire_rundir = app_local_data_dir.join("soulfire");
  if !soul_fire_rundir.exists() {
    std::fs::create_dir(&soul_fire_rundir)?;
  }

  send_log(&app_handle, "Starting SoulFire server...")?;

  let java_exec_name = get_java_exec_name();
  let java_bin_dir = jvm_dir.join("bin");
  let java_exec_path = java_bin_dir.join(java_exec_name);
  let java_exec_path = java_exec_path.to_str().ok_or(SFError::PathCouldNotBeConverted)?;
  info!("Integrated Server Java Executable: {}", java_exec_path);

  let available_port = find_random_available_port().ok_or(SFError::NoPortAvailable)?;
  info!("Integrated Server Port: {}", available_port);

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
      soul_fire_version_file.to_str().ok_or(SFError::PathCouldNotBeConverted)?,
    ]);

  let (mut rx, mut child) = command.spawn().expect("Failed to spawn sidecar");

  // Print all rx messages
  while let Some(message) = rx.recv().await {
    if let Stdout(line) = message {
      let line = String::from_utf8(line)?;
      let line = strip_ansi_escapes::strip_str(line);
      if line.contains("Finished loading!") {
        send_log(&app_handle, "Generating token...")?;
        break;
      } else {
        send_log(&app_handle, line)?;
      }
    }
  }

  child
    .write("generate-token\n".as_bytes())
    .expect("Failed to write to dedicated server");

  let token: String = loop {
    if let Some(message) = rx.recv().await {
      if let Stdout(line) = message {
        let line = String::from_utf8(line)?;
        if line.contains("JWT") {
          break line.split_whitespace().last().ok_or(SFError::JwtLineInvalid)?.to_string();
        }
      }
    }
  };

  integrated_server_state
    .child_process
    .lock()
    .await
    .replace(Box::from(child));

  info!("Integrated Server ready for use!");

  let url = format!("http://127.0.0.1:{}", available_port);
  Ok(format!("{}\n{}", url, token))
}
