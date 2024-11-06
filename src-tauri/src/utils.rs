use crate::sf_loader::IntegratedServerState;
use log::{error, info};
use regex::Regex;
use std::collections::HashMap;
use std::net::TcpListener;
use std::path::PathBuf;
use std::process::Command;
use std::sync::Arc;
use std::{env, fs};

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
  #[cfg(desktop)]
  #[error("no default window icon")]
  NoDefaultWindowIcon,
  #[cfg(desktop)]
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

#[cfg(not(target_os = "linux"))]
fn find_java_installations() -> Vec<PathBuf> {
  // todo: MacOS & Windows
  Vec::new()
}
#[cfg(target_os = "linux")]
fn find_potential_java_installations(other_installations: &mut Vec<&str>) -> Vec<PathBuf> {
  let mut java_installations = Vec::new();

  // common locations
  let mut common_locations = vec![
    "/usr/lib/jvm/",
    "/usr/java/",
    "/opt/java/",
    "/usr/local/java/",
  ];

  other_installations.append(&mut common_locations); // other installations first

  for location in common_locations {
    if let Ok(entries) = fs::read_dir(location) {
      for entry in entries {
        if let Ok(entry) = entry {
          let path = entry.path();
          if path.is_dir() {
            java_installations.push(path);
          }
        }
      }
    }
  }

  // try te get the main java
  if let Ok(java_home) = env::var("JAVA_HOME") {
    java_installations.push(PathBuf::from(java_home));
  }

  if let Ok(home_dir) = env::var("HOME") {
    let user_java_dir = PathBuf::from(home_dir.clone()).join(".local/share/java/");
    if user_java_dir.exists() {
      java_installations.push(user_java_dir);
    }

    // will iterate in these two common folders and detect javas inside
    let mut jdks_dirs = Vec::new();
    jdks_dirs.push(PathBuf::from(home_dir).join(".jdks"));
    jdks_dirs.push(PathBuf::from("/usr/lib/jvm/"));
    for jdks_dir in jdks_dirs {
      if jdks_dir.exists() {
        if let Ok(entries) = fs::read_dir(jdks_dir) {
          for entry in entries {
            if let Ok(entry) = entry {
              let path = entry.path();
              if path.is_dir() {
                let java_bin_path = path.join("bin").join("java");
                if java_bin_path.exists() {
                  java_installations.push(java_bin_path);
                }
              }
            }
          }
        }
      }
    }
  }

  // use update-alternatives to detect others
  if let Ok(output) = Command::new("update-alternatives")
    .arg("--list")
    .arg("java")
    .output()
  {
    if output.status.success() {
      let output_str = String::from_utf8_lossy(&output.stdout);
      for line in output_str.lines() {
        if !line.is_empty() {
          java_installations.push(PathBuf::from(line));
        }
      }
    }
  }

  // use of the 'which' command to detect javas in the paths
  if let Ok(output) = Command::new("which")
    .arg("java")
    .output()
  {
    if output.status.success() {
      let output_str = String::from_utf8_lossy(&output.stdout);
      let path = output_str.trim();
      if !path.is_empty() {
        java_installations.push(PathBuf::from(path));
      }
    }
  }

  // Some linux uses where command
  if let Ok(output) = Command::new("where")
    .arg("java")
    .output()
  {
    if output.status.success() {
      let output_str = String::from_utf8_lossy(&output.stdout);
      let path = output_str.trim();
      if !path.is_empty() {
        java_installations.push(PathBuf::from(path));
      }
    }
  }

  // if some detections are folder (like JAVA_HOME) we use the bin/java inside
  java_installations.iter_mut().for_each(|path| {
    if path.is_dir() {
      *path = path.join("bin/java");
    }
  });

  java_installations
}

fn detect_javas(other_installations: &mut Vec<&str>) -> HashMap<PathBuf, u8> {
  let mut map = HashMap::new();
  let potential_java_installations: Vec<PathBuf> = find_potential_java_installations(other_installations);

  for java_path in potential_java_installations {
    if let Some(version) = detect_java_version(&java_path) {
      map.insert(java_path, version);
    } else {
      eprintln!("Failed to detect Java version at {:?}", java_path);
    }
  }

  map
}

fn detect_java_version(java_path: &PathBuf) -> Option<u8> {
  // try to execute it to get version
  // todo: test to run a dummy jar on it to fully test if the jvm isn't broken
  let output = Command::new(java_path)
    .arg("-version")
    .output()
    .ok()?;

  let output_str = String::from_utf8(output.stderr).ok()?;
  let lines: Vec<&str> = output_str.lines().collect();

  let version_line = lines.get(0)?;

  // Regex of java version (x.y.z)
  let re = Regex::new(r"(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)").unwrap();
  if let Some(caps) = re.captures(version_line) {
    let major = caps.get(1).unwrap().as_str().parse::<u8>().unwrap();
    let minor = caps.get(2).unwrap().as_str().parse::<u8>().unwrap();

    return if major == 1 { // java 1.8 1.7 etc...
      Some(minor)
    } else {
      Some(major)
    };
  }

  None
}

pub(crate) fn get_best_java(other_installations: &mut Vec<&str>) -> Option<PathBuf> {
  let javas: HashMap<PathBuf, u8> = detect_javas(other_installations);

  // find the first java 21
  if let Some((path, _)) = javas.iter().find(|(_, &value)| value == 21) {
    return Some(path.clone());
  }

  // if not found, find the closest to 21
  let closest = javas.iter().min_by_key(|(_, &value)| {
    if value < 21 {
      (21 - value, false)
    } else {
      (value - 21, true)
    }
  });

  closest.map(|(path, _)| path.clone())
}
