use crate::sf_version_constant::SOULFIRE_VERSION;
use crate::utils::{
  detect_architecture, detect_os, extract_tar_gz, extract_zip, find_random_available_port, get_java_exec_name,
  get_java_home_dir, SFAnyError, SFError,
};
use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};
use log::info;
use serde::{Deserialize, Serialize};
use sha2::Digest;
use std::fs::File;
use std::io::Write;
use std::path::Path;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use tauri::async_runtime::Mutex;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_shell::process::CommandChild;
use tauri_plugin_shell::process::CommandEvent::Stdout;
use tauri_plugin_shell::ShellExt;

pub struct IntegratedServerState {
    pub starting: Arc<AtomicBool>,
    pub child_process: Arc<Mutex<Option<Box<CommandChild>>>>,
}

const ROOT_USER_UUID: &str = "00000000-0000-0000-0000-000000000000";

#[derive(Serialize, Deserialize)]
struct JwtClaims {
    sub: String,
    iat: u64,
    aud: Vec<String>,
}

/// Generate a JWT for the root user with the "api" audience,
/// matching the format produced by the SoulFire server's AuthSystem.
fn generate_root_api_token(secret_key: &[u8]) -> Result<String, SFAnyError> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)?
        .as_secs();

    let claims = JwtClaims {
        sub: ROOT_USER_UUID.to_string(),
        iat: now,
        aud: vec!["api".to_string()],
    };

    let token = encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret_key),
    )
    .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;

    Ok(token)
}

fn unix_timestamp_millis() -> Result<u128, SFAnyError> {
    Ok(std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)?
        .as_millis())
}

fn sha256_hex(data: &[u8]) -> String {
    let mut hasher = sha2::Sha256::new();
    hasher.update(data);
    hex::encode(hasher.finalize())
}

fn sha256_file_hex(path: &Path) -> Result<String, SFAnyError> {
    let data = std::fs::read(path)?;
    Ok(sha256_hex(&data))
}

fn atomic_replace_path(tmp_path: &Path, final_path: &Path) -> Result<(), SFAnyError> {
    let timestamp = unix_timestamp_millis()?;
    let backup_path = final_path.with_extension(format!("bak.{}", timestamp));

    if final_path.exists() {
        std::fs::rename(final_path, &backup_path)?;
        match std::fs::rename(tmp_path, final_path) {
            Ok(_) => {
                let _ = if backup_path.is_dir() {
                    std::fs::remove_dir_all(&backup_path)
                } else {
                    std::fs::remove_file(&backup_path)
                };
                Ok(())
            }
            Err(err) => {
                let _ = std::fs::rename(&backup_path, final_path);
                Err(err.into())
            }
        }
    } else {
        std::fs::rename(tmp_path, final_path)?;
        Ok(())
    }
}

fn parse_sha256_digest(value: &str) -> Option<&str> {
    if value.is_empty() {
        None
    } else {
        Some(value.strip_prefix("sha256:").unwrap_or(value))
    }
}

async fn fetch_soulfire_jar_sha256(version: &str, jar_file_name: &str) -> Result<String, SFAnyError> {
    let url = format!(
        "https://api.github.com/repos/AlexProgrammerDE/SoulFire/releases/tags/{}",
        version
    );
    let response = reqwest::Client::new()
        .get(url)
        .header(reqwest::header::USER_AGENT, "SoulFireClient")
        .send()
        .await?;
    if !response.status().is_success() {
        return Err(SFAnyError::from(SFError::DownloadFailed));
    }

    let release_json: serde_json::Value = response.json().await?;
    let assets = release_json["assets"]
        .as_array()
        .ok_or(SFError::JsonFieldInvalid("assets".to_string()))?;

    let digest = assets
        .iter()
        .find(|asset| {
            asset["name"]
                .as_str()
                .map(|name| name == jar_file_name)
                .unwrap_or(false)
        })
        .and_then(|asset| asset["digest"].as_str())
        .ok_or(SFError::JsonFieldInvalid("assets[].digest".to_string()))?;

    let digest = parse_sha256_digest(digest)
        .ok_or(SFError::JsonFieldInvalid("assets[].digest".to_string()))?;
    Ok(digest.to_string())
}

#[tauri::command]
pub async fn get_sf_server_version() -> String {
    SOULFIRE_VERSION.to_string()
}

#[tauri::command]
pub async fn reset_integrated_data(app_handle: AppHandle) -> Result<(), SFAnyError> {
    let app_local_data_dir = app_handle.path().app_local_data_dir()?;

    let jvm_dir = app_local_data_dir.join("jvm-25");
    if jvm_dir.exists() {
        std::fs::remove_dir_all(&jvm_dir)?;
        info!("Deleted JVM directory: {:?}", jvm_dir);
    }

    let jars_dir = app_local_data_dir.join("jars");
    if jars_dir.exists() {
        std::fs::remove_dir_all(&jars_dir)?;
        info!("Deleted jars directory: {:?}", jars_dir);
    }

    Ok(())
}

#[tauri::command]
pub async fn run_integrated_server(
    jvm_args: Vec<&str>,
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

    let result =
        internal_load_integrated_server(jvm_args, app_handle, &integrated_server_state).await;
    integrated_server_state
        .starting
        .store(false, std::sync::atomic::Ordering::Relaxed);

    result
}

async fn internal_load_integrated_server(
    jvm_args: Vec<&str>,
    app_handle: AppHandle,
    integrated_server_state: &tauri::State<'_, IntegratedServerState>,
) -> Result<String, SFAnyError> {
    fn send_log<S: Serialize + Clone>(app_handle: &AppHandle, payload: S) -> tauri::Result<()> {
        info!("{}", serde_json::to_string(&payload)?);
        app_handle.emit("integrated-server-start-log", payload)
    }

    let app_local_data_dir = app_handle.path().app_local_data_dir()?;
    let jvm_dir = app_local_data_dir.join("jvm-25");
    if jvm_dir.exists() {
        send_log(&app_handle, "JVM detected")?;
    } else {
        let adoptium_os = detect_os();
        let adoptium_arch = detect_architecture();
        let jvm_url = format!(
            "https://api.adoptium.net/v3/assets/latest/25/hotspot?architecture={}&image_type=jre&os={}&vendor=eclipse",
            adoptium_arch, adoptium_os
        );
        info!("JVM URL: {}", jvm_url);

        send_log(&app_handle, "Fetching JVM data...")?;
        let response = reqwest::get(&jvm_url).await?;
        if !response.status().is_success() {
            return Err(SFAnyError::from(SFError::DownloadFailed));
        }

        let jvm_json: serde_json::Value = response.json().await?;
        let checksum = jvm_json[0]["binary"]["package"]["checksum"]
            .as_str()
            .ok_or(SFError::JsonFieldInvalid(
                "binary.package.checksum".to_string(),
            ))?
            .to_string();
        let download_url = jvm_json[0]["binary"]["package"]["link"]
            .as_str()
            .ok_or(SFError::JsonFieldInvalid("binary.package.link".to_string()))?;
        let release_name = jvm_json[0]["release_name"]
            .as_str()
            .ok_or(SFError::JsonFieldInvalid("release_name".to_string()))?;
        info!("Download URL: {}", download_url);
        let jvm_archive_dir_name = format!("{}-jre", release_name);

        let last_sent_progress = std::sync::atomic::AtomicU64::new(0);
        let send_download_progress =
            |app_handle: &AppHandle, progress: u64, total: u64| -> tauri::Result<()> {
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
        let mut response = reqwest::get(download_url).await?;
        if !response.status().is_success() {
            return Err(SFAnyError::from(SFError::DownloadFailed));
        }

        let total_size = response
            .content_length()
            .ok_or(SFError::NoContentLengthHeader)?;
        let mut downloaded_size = 0;
        let mut content = Vec::new();
        while let Some(chunk) = response.chunk().await? {
            downloaded_size += chunk.len() as u64;
            content.extend_from_slice(&chunk);
            send_download_progress(&app_handle, downloaded_size, total_size)?;
        }

        send_log(&app_handle, "Verifying JVM sha256 checksum...")?;
        let hash = sha256_hex(&content);
        if !hash.eq_ignore_ascii_case(&checksum) {
            send_log(&app_handle, "JVM checksum verification failed")?;
            return Err(SFAnyError::from(SFError::InvalidJvmChecksum));
        }

        let timestamp = unix_timestamp_millis()?;
        let archive_tmp_path = app_local_data_dir.join(format!("jvm-25-archive.tmp.{}", timestamp));
        let mut archive_file = File::create(&archive_tmp_path)?;
        archive_file.write_all(&content)?;
        archive_file.sync_all()?;

        send_log(&app_handle, "Verifying JVM sha256 checksum from disk...")?;
        let archive_hash = sha256_file_hex(&archive_tmp_path)?;
        if !archive_hash.eq_ignore_ascii_case(&checksum) {
            let _ = std::fs::remove_file(&archive_tmp_path);
            send_log(&app_handle, "JVM checksum verification from disk failed")?;
            return Err(SFAnyError::from(SFError::InvalidJvmChecksum));
        }

        send_log(&app_handle, "Extracting JVM...")?;
        let extract_tmp_root = app_local_data_dir.join(format!("jvm-25-extract.tmp.{}", timestamp));
        std::fs::create_dir_all(&extract_tmp_root)?;
        if download_url.ends_with(".tar.gz") {
            extract_tar_gz(&content, extract_tmp_root.as_path())?;
        } else if download_url.ends_with(".zip") {
            extract_zip(&content, extract_tmp_root.as_path())?;
        } else {
            let _ = std::fs::remove_file(&archive_tmp_path);
            let _ = std::fs::remove_dir_all(&extract_tmp_root);
            return Err(SFAnyError::from(SFError::InvalidArchiveType));
        }

        let extracted_jvm_dir = extract_tmp_root.join(jvm_archive_dir_name);
        if !extracted_jvm_dir.exists() {
            let _ = std::fs::remove_file(&archive_tmp_path);
            let _ = std::fs::remove_dir_all(&extract_tmp_root);
            return Err(SFAnyError::from(SFError::DownloadFailed));
        }

        send_log(&app_handle, "Validating extracted JVM...")?;
        let extracted_java_home = get_java_home_dir(extracted_jvm_dir.clone());
        let extracted_java_exec = extracted_java_home
            .join("bin")
            .join(get_java_exec_name());
        if !extracted_java_exec.exists() {
            let _ = std::fs::remove_file(&archive_tmp_path);
            let _ = std::fs::remove_dir_all(&extract_tmp_root);
            return Err(SFAnyError::from(SFError::JvmExtractIncomplete));
        }

        let jvm_tmp_dir = app_local_data_dir.join(format!("jvm-25.tmp.{}", timestamp));
        std::fs::rename(&extracted_jvm_dir, &jvm_tmp_dir)?;
        atomic_replace_path(&jvm_tmp_dir, &jvm_dir)?;

        let _ = std::fs::remove_file(&archive_tmp_path);
        let _ = std::fs::remove_dir_all(&extract_tmp_root);
        send_log(&app_handle, "Downloaded JVM")?;
    };

    let jars_dir = app_local_data_dir.join("jars");
    if !jars_dir.exists() {
        std::fs::create_dir_all(&jars_dir)?;
    }

    let soulfire_jar_name = format!("SoulFireDedicated-{}.jar", SOULFIRE_VERSION);
    let soul_fire_version_file = jars_dir.join(&soulfire_jar_name);
    send_log(&app_handle, "Fetching SoulFire checksum metadata...")?;
    let expected_soulfire_sha256 = fetch_soulfire_jar_sha256(SOULFIRE_VERSION, &soulfire_jar_name).await?;

    let mut need_download_jar = true;
    if soul_fire_version_file.exists() {
        send_log(&app_handle, "Verifying existing SoulFire jar sha256 checksum...")?;
        let existing_hash = sha256_file_hex(&soul_fire_version_file)?;
        if existing_hash.eq_ignore_ascii_case(&expected_soulfire_sha256) {
            need_download_jar = false;
            send_log(&app_handle, "SoulFire already downloaded and verified")?;
        } else {
            send_log(&app_handle, "Existing SoulFire jar is corrupted, re-downloading...")?;
        }
    }

    if need_download_jar {
        send_log(&app_handle, "Fetching SoulFire data...")?;
        let soul_fire_url = format!(
            "https://github.com/AlexProgrammerDE/SoulFire/releases/download/{}/{}",
            SOULFIRE_VERSION, soulfire_jar_name
        );
        info!("SoulFire URL: {}", soul_fire_url);

        let last_sent_progress = std::sync::atomic::AtomicU64::new(0);
        let send_download_progress =
            |app_handle: &AppHandle, progress: u64, total: u64| -> tauri::Result<()> {
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
        let total_size = response
            .content_length()
            .ok_or(SFError::NoContentLengthHeader)?;
        let mut downloaded_size = 0;
        while let Some(chunk) = response.chunk().await? {
            downloaded_size += chunk.len() as u64;
            content.extend_from_slice(&chunk);
            send_download_progress(&app_handle, downloaded_size, total_size)?;
        }

        send_log(&app_handle, "Verifying SoulFire jar sha256 checksum...")?;
        let jar_hash = sha256_hex(&content);
        if !jar_hash.eq_ignore_ascii_case(&expected_soulfire_sha256) {
            return Err(SFAnyError::from(SFError::InvalidJarChecksum));
        }

        let timestamp = unix_timestamp_millis()?;
        let jar_tmp_file = jars_dir.join(format!("{}.tmp.{}", soulfire_jar_name, timestamp));
        send_log(&app_handle, "Saving SoulFire...")?;
        let mut jar_file = File::create(&jar_tmp_file)?;
        jar_file.write_all(&content)?;
        jar_file.sync_all()?;

        send_log(&app_handle, "Verifying SoulFire jar sha256 checksum from disk...")?;
        let jar_disk_hash = sha256_file_hex(&jar_tmp_file)?;
        if !jar_disk_hash.eq_ignore_ascii_case(&expected_soulfire_sha256) {
            let _ = std::fs::remove_file(&jar_tmp_file);
            return Err(SFAnyError::from(SFError::InvalidJarChecksum));
        }

        atomic_replace_path(&jar_tmp_file, &soul_fire_version_file)?;
        send_log(&app_handle, "Downloaded SoulFire")?;
    }

    info!(
        "Integrated Server SoulFire Jar: {}",
        soul_fire_version_file
            .to_str()
            .ok_or(SFError::PathCouldNotBeConverted)?
    );

    let soul_fire_rundir = app_local_data_dir.join("soulfire");
    if !soul_fire_rundir.exists() {
        std::fs::create_dir_all(&soul_fire_rundir)?;
    }

    send_log(&app_handle, "Starting SoulFire server...")?;

    let java_home_dir = get_java_home_dir(jvm_dir);
    let java_exec_name = get_java_exec_name();
    let java_bin_dir = java_home_dir.join("bin");
    let java_exec_path = java_bin_dir.join(java_exec_name);
    let java_exec_path = java_exec_path
        .to_str()
        .ok_or(SFError::PathCouldNotBeConverted)?;
    info!("Integrated Server Java Executable: {}", java_exec_path);

    let java_lib_dir = java_home_dir.join("lib");
    let java_lib_server_dir = java_lib_dir.join("server");
    let available_port = find_random_available_port().ok_or(SFError::NoPortAvailable)?;
    info!("Integrated Server Port: {}", available_port);

    let current_ld_library_path = std::env::var("LD_LIBRARY_PATH").unwrap_or("".to_string());
    let current_dyld_library_path = std::env::var("DYLD_LIBRARY_PATH").unwrap_or("".to_string());
    let grpc_arg = format!("-Dsf.grpc.port={}", available_port);
    let mut full_jvm_args: Vec<&str> = Vec::new();
    full_jvm_args.extend(&jvm_args);
    full_jvm_args.extend(&[
        grpc_arg.as_str(),
        "-jar",
        soul_fire_version_file
            .to_str()
            .ok_or(SFError::PathCouldNotBeConverted)?,
    ]);

    let command = app_handle
        .shell()
        .command(java_exec_path)
        .env(
            "LD_LIBRARY_PATH",
            format!(
                "{:?}:{:?}:{}",
                java_lib_dir, java_lib_server_dir, current_ld_library_path
            ),
        )
        .env(
            "DYLD_LIBRARY_PATH",
            format!(
                "{:?}:{:?}:{}",
                java_lib_dir, java_lib_server_dir, current_dyld_library_path
            ),
        )
        .env("JAVA_HOME", java_home_dir)
        .current_dir(&soul_fire_rundir)
        .args(full_jvm_args);

    let (mut rx, child) = command.spawn()?;

    // Print all rx messages until server is ready
    while let Some(message) = rx.recv().await {
        if let Stdout(line) = message {
            let line = String::from_utf8_lossy(&line);
            let line = strip_ansi_escapes::strip_str(line);
            if line.contains("Finished loading!") {
                send_log(&app_handle, "Server ready")?;
                break;
            } else {
                send_log(&app_handle, line)?;
            }
        }
    }

    // Generate JWT directly from the secret key file instead of
    // running a command via stdin, keeping the token out of logs
    let secret_key_path = soul_fire_rundir.join("secret-key.bin");
    let secret_key = std::fs::read(&secret_key_path)?;
    let token = generate_root_api_token(&secret_key)?;

    integrated_server_state
        .child_process
        .lock()
        .await
        .replace(Box::from(child));

    info!("Integrated Server ready for use!");

    let url = format!("http://127.0.0.1:{}", available_port);
    Ok(format!("{}\n{}", url, token))
}
