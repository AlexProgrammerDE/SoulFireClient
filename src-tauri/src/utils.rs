use crate::sf_loader::IntegratedServerState;
use log::{error, info};
use std::net::TcpListener;
use std::sync::Arc;

#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum SFError {
  #[error("checksum of downloaded jvm data does not match")]
  InvalidJvmChecksum,
  #[error("json field was invalid/not found: {0}")]
  JsonFieldInvalid(String),
  #[error("jwt line was invalid")]
  JwtLineInvalid,
  #[error("path could not be converted to string")]
  PathCouldNotBeConverted,
  #[error("no content length header present")]
  NoContentLengthHeader,
  #[error("no port available")]
  NoPortAvailable,
  #[error("invalid zip data")]
  InvalidZipData,
  #[error("no default window icon")]
  NoDefaultWindowIcon,
  #[error("no main window")]
  NoMainWindow,
}

#[derive(Debug, thiserror::Error)]
pub enum SFAnyError {
  #[error(transparent)]
  SFError(#[from] SFError),
  #[error(transparent)]
  Io(#[from] std::io::Error),
  #[error(transparent)]
  Tauri(#[from] tauri::Error),
  #[error(transparent)]
  Reqwest(#[from] reqwest::Error),
  #[error(transparent)]
  FromUtf8(#[from] std::string::FromUtf8Error),
  #[error(transparent)]
  ZipError(#[from] zip::result::ZipError),
  #[cfg(desktop)]
  #[error(transparent)]
  UpdaterError(#[from] tauri_plugin_updater::Error),
  #[error(transparent)]
  DiscordError(#[from] discord_presence::DiscordError),
}

impl serde::Serialize for SFAnyError {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::ser::Serializer,
  {
    serializer.serialize_str(self.to_string().as_ref())
  }
}

pub fn extract_tar_gz(data: &[u8], target_dir: &std::path::Path) -> Result<(), SFAnyError> {
  let decompressed = flate2::read::GzDecoder::new(data);
  let mut archive = tar::Archive::new(decompressed);
  for entry in archive.entries()? {
    let mut entry = entry?;
    let path = entry.path()?;
    let path = target_dir.join(path);
    entry.unpack(path)?;
  }

  Ok(())
}

pub fn extract_zip(data: &[u8], target_dir: &std::path::Path) -> Result<(), SFAnyError> {
  let mut archive = zip::ZipArchive::new(std::io::Cursor::new(data))?;
  for i in 0..archive.len() {
    let mut file_data = archive.by_index(i)?;
    let path = file_data.enclosed_name().ok_or(SFError::InvalidZipData)?;
    let path = target_dir.join(path);
    if file_data.is_dir() {
      std::fs::create_dir_all(&path)?;
    } else {
      let mut file = std::fs::File::create(&path)?;
      std::io::copy(&mut file_data, &mut file)?;
    }
  }

  Ok(())
}

pub fn get_java_exec_name() -> &'static str {
  if cfg!(target_os = "windows") {
    "javaw.exe"
  } else {
    "java"
  }
}

pub fn find_random_available_port() -> Option<u16> {
  if let Ok(listener) = TcpListener::bind("127.0.0.1:0") {
    if let Ok(local_addr) = listener.local_addr() {
      return Some(local_addr.port());
    }
  }

  None
}

pub fn detect_architecture() -> &'static str {
  if cfg!(target_arch = "x86_64") {
    "x64"
  } else if cfg!(target_arch = "x86") {
    "x32"
  } else if cfg!(target_arch = "powerpc64") {
    "ppc64"
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

pub fn detect_os() -> &'static str {
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
  } else if cfg!(target_os = "android") {
    "android"
  } else if cfg!(target_os = "ios") {
    "ios"
  } else {
    "unknown"
  }
}

pub fn kill_child_process(state: &IntegratedServerState) {
  let child_process = Arc::clone(&state.child_process);
  let starting = Arc::clone(&state.starting);
  tauri::async_runtime::spawn(async move {
    let mut child_process = child_process.lock().await;
    if let Some(child) = child_process.take() {
      match child.kill() {
        Ok(_) => {
          starting.store(false, std::sync::atomic::Ordering::Relaxed);
          info!("Killed child process");
        }
        Err(err) => {
          starting.store(false, std::sync::atomic::Ordering::Relaxed);
          error!("Error killing child process: {err}");
        }
      }
    }
  });
}
