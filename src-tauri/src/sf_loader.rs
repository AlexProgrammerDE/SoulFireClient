use crate::utils::{detect_architecture, detect_os, extract_tar_gz, extract_zip, find_random_available_port, get_java_exec_name, get_java_home_dir, SFAnyError, SFError};
use log::info;
use serde::Serialize;
use sha2::Digest;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use jni::{InitArgsBuilder, JNIVersion, JavaVM};
use tauri::async_runtime::Mutex;
use tauri::{AppHandle, Emitter, Manager};

pub struct IntegratedServerState {
  pub starting: Arc<AtomicBool>,
  pub child_process: Arc<Mutex<Option<Box<JavaVM>>>>,
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
    return Err(SFAnyError::from(SFError::ServerAlreadyStarting));
  }

  integrated_server_state
    .starting
    .store(true, std::sync::atomic::Ordering::Relaxed);

  let soul_fire_version = "1.18.2";

  fn send_log<S: Serialize + Clone>(app_handle: &AppHandle, payload: S) -> tauri::Result<()> {
    info!("{}", serde_json::to_string(&payload)?);
    app_handle
      .emit("integrated-server-start-log", payload)
  }

  let app_local_data_dir = app_handle.path().app_local_data_dir()?;
  let jvm_dir = app_local_data_dir.join("jvm-21");
  if jvm_dir.exists() {
    send_log(&app_handle, "JVM detected")?;
  } else {
    let checksum: String;
    let download_url: String;
    let jvm_archive_dir_name: String;
    if cfg!(desktop) {
      let adoptium_os = detect_os();
      let adoptium_arch = detect_architecture();
      let jvm_url = format!("https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture={}&image_type=jre&os={}&vendor=eclipse", adoptium_arch, adoptium_os);
      info!("JVM URL: {}", jvm_url);

      send_log(&app_handle, "Fetching JVM data...")?;
      let response = reqwest::get(&jvm_url).await?;
      if !response.status().is_success() {
        return Err(SFAnyError::from(SFError::DownloadFailed));
      }

      let jvm_json: serde_json::Value = response.json().await?;
      checksum = jvm_json[0]["binary"]["package"]["checksum"].as_str().ok_or(SFError::JsonFieldInvalid("binary.package.checksum".to_string()))?.to_string();
      download_url = jvm_json[0]["binary"]["package"]["link"].as_str().ok_or(SFError::JsonFieldInvalid("binary.package.link".to_string()))?.to_string();
      let major_version = jvm_json[0]["version"]["major"].as_u64().ok_or(SFError::JsonFieldInvalid("version.major".to_string()))?;
      let minor_version = jvm_json[0]["version"]["minor"].as_u64().ok_or(SFError::JsonFieldInvalid("version.minor".to_string()))?;
      let security_version = jvm_json[0]["version"]["security"].as_u64().ok_or(SFError::JsonFieldInvalid("version.security".to_string()))?;
      let build_version = jvm_json[0]["version"]["build"].as_u64().ok_or(SFError::JsonFieldInvalid("version.build".to_string()))?;
      jvm_archive_dir_name = format!(
        "jdk-{}.{}.{}+{}-jre",
        major_version, minor_version, security_version, build_version
      );
    } else {
      checksum = "0".to_string();
      download_url = "http://192.168.178.69:8080/jre.zip".to_string();
      jvm_archive_dir_name = "jre".to_string();
    }

    info!("Download URL: {}", download_url);
    let last_sent_progress = std::sync::atomic::AtomicU64::new(0);
    let send_download_progress = |app_handle: &AppHandle, progress: u64, total: u64| -> tauri::Result<()> {
      let percent = progress * 100 / total;
      if last_sent_progress.load(std::sync::atomic::Ordering::Relaxed) == percent {
        return Ok(());
      }

      last_sent_progress.store(percent, std::sync::atomic::Ordering::Relaxed);
      send_log(
        app_handle,
        format!("Downloading JVM... {}%", progress * 100 / total),
      )
    };

    send_download_progress(&app_handle, 0, 1)?;
    let mut response = reqwest::get(download_url.clone()).await?;
    if !response.status().is_success() {
      return Err(SFAnyError::from(SFError::DownloadFailed));
    }

    let total_size = response.content_length().ok_or(SFError::NoContentLengthHeader)?;
    let mut downloaded_size = 0;
    let mut content = Vec::new();
    while let Some(chunk) = response.chunk().await? {
      downloaded_size += chunk.len() as u64;
      content.extend_from_slice(&chunk);
      send_download_progress(&app_handle, downloaded_size, total_size)?;
    }

    if cfg!(desktop) {
      send_log(&app_handle, "Verifying sha256 checksum...")?;
      let mut hasher = sha2::Sha256::new();
      hasher.update(&content);
      let hash = hasher.finalize();
      let hash = hex::encode(hash);
      if hash != checksum {
        send_log(&app_handle, "Checksum verification failed")?;
        return Err(SFAnyError::from(SFError::InvalidJvmChecksum));
      }
    }

    send_log(&app_handle, "Extracting JVM...")?;

    let jvm_tmp_dir = if cfg!(desktop) {
       app_handle.path().cache_dir()?.join("jvm-extract")
    } else {
       app_local_data_dir.join("jvm-extract")
    };

    std::fs::create_dir_all(&jvm_tmp_dir)?;
    info!("Extracting to: {}", jvm_tmp_dir.to_str().ok_or(SFError::PathCouldNotBeConverted)?);
    if download_url.clone().ends_with(".tar.gz") {
      let _ = extract_tar_gz(&content[..], jvm_tmp_dir.as_path())?;
    } else if download_url.clone().ends_with(".zip") {
      let _ = extract_zip(&content[..], jvm_tmp_dir.as_path())?;
    } else {
      return Err(SFAnyError::from(SFError::InvalidArchiveType));
    }

    std::fs::rename(jvm_tmp_dir.as_path().join(jvm_archive_dir_name), &jvm_dir)?;

    send_log(&app_handle, "Downloaded JVM")?;
  };

  let jars_dir = app_local_data_dir.join("jars");
  if !jars_dir.exists() {
    std::fs::create_dir_all(&jars_dir)?;
  }

  let soul_fire_version_file =
    jars_dir.join(format!("SoulFireDedicated-{}.jar", soul_fire_version));
  if !soul_fire_version_file.exists() {
    send_log(&app_handle, "Fetching SoulFire data...")?;
    let soul_fire_url = format!("https://github.com/AlexProgrammerDE/SoulFire/releases/download/{}/SoulFireDedicated-{}.jar", soul_fire_version, soul_fire_version);
    info!("SoulFire URL: {}", soul_fire_url);

    let last_sent_progress = std::sync::atomic::AtomicU64::new(0);
    let send_download_progress = |app_handle: &AppHandle, progress: u64, total: u64| -> tauri::Result<()> {
      let percent = progress * 100 / total;
      if last_sent_progress.load(std::sync::atomic::Ordering::Relaxed) == percent {
        return Ok(());
      }

      last_sent_progress.store(percent, std::sync::atomic::Ordering::Relaxed);
      send_log(
        app_handle,
        format!("Downloading SoulFire... {}%", progress * 100 / total),
      )
    };

    send_download_progress(&app_handle, 0, 1)?;
    let mut response = reqwest::get(&soul_fire_url).await?;
    if !response.status().is_success() {
      return Err(SFAnyError::from(SFError::DownloadFailed));
    }

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
    std::fs::create_dir_all(&soul_fire_rundir)?;
  }

  send_log(&app_handle, "Starting SoulFire server...")?;

  let java_home_dir = get_java_home_dir(jvm_dir);
  let java_exec_name = get_java_exec_name();
  let java_bin_dir = java_home_dir.join("bin");
  let java_exec_path = java_bin_dir.join(java_exec_name);
  let java_exec_path = java_exec_path.to_str().ok_or(SFError::PathCouldNotBeConverted)?;
  info!("Integrated Server Java Executable: {}", java_exec_path);

  let java_lib_dir = java_home_dir.join("lib");
  let java_lib_server_dir = java_lib_dir.join("server");
  let available_port = find_random_available_port().ok_or(SFError::NoPortAvailable)?;
  info!("Integrated Server Port: {}", available_port);

  let current_ld_library_path = std::env::var("LD_LIBRARY_PATH").unwrap_or("".to_string());
  let current_dyld_library_path = std::env::var("DYLD_LIBRARY_PATH").unwrap_or("".to_string());

  unsafe {
    std::env::set_var("LD_LIBRARY_PATH", format!("{:?}:{:?}:{}", java_lib_dir, java_lib_server_dir, current_ld_library_path));
    std::env::set_var("DYLD_LIBRARY_PATH", format!("{:?}:{:?}:{}", java_lib_dir, java_lib_server_dir, current_dyld_library_path));
    std::env::set_var("JAVA_HOME", java_home_dir);
  }

  info!("Preparing JVM...");
  let jvm_args = InitArgsBuilder::new()
    .version(JNIVersion::V8)
    .option(format!("-Dsf.grpc.port={}", available_port))
    .option("-XX:+EnableDynamicAgentLoading")
    .option("-XX:+UnlockExperimentalVMOptions")
    .option("-XX:+UseZGC")
    .option("-XX:+ZGenerational")
    .option("-XX:+AlwaysActAsServerClassMachine")
    .option("-XX:+UseNUMA")
    .option("-XX:+UseFastUnorderedTimeStamps")
    .option("-XX:+UseVectorCmov")
    .option("-XX:+UseCriticalJavaThreadPriority")
    .option("-Dsf.flags.v1=true")
    .option("-Dsf.jni.client=true")
    .option(format!("-Djava.class.path={}", soul_fire_version_file.to_str().ok_or(SFError::PathCouldNotBeConverted)?))
    .option(format!("-Duser.dir={}", soul_fire_rundir.to_str().ok_or(SFError::PathCouldNotBeConverted)?))
    .build()?;

  info!("Spawning Java VM...");
  let jvm = JavaVM::new(jvm_args)?;

  let token;
  {
    let mut env = jvm.attach_current_thread()?;

    info!("Calling main method...");
    let return_value = env.call_static_method(
      "com/soulfiremc/dedicated/SoulFireDedicatedLauncher",
      "jniMain",
      "()Ljava/lang/String;",
      &[]
    )?.l()?;
    token = env.get_string((&return_value).into())?.to_str()?.to_string();
  }

  integrated_server_state
    .child_process
    .lock()
    .await
    .replace(Box::from(jvm));

  info!("Integrated Server ready for use!");

  let url = format!("http://127.0.0.1:{}", available_port);
  Ok(format!("{}\n{}", url, token))
}
