use std::net::TcpListener;

pub fn extract_tar_gz(data: &[u8], target_dir: &std::path::Path, strip_prefix: &str) {
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

pub fn extract_zip(data: &[u8], target_dir: &std::path::Path, strip_prefix: &str) {
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

pub fn get_java_exec_name() -> &'static str {
  if cfg!(target_os = "windows") {
    "javaw.exe"
  } else {
    "java"
  }
}

pub fn find_next_available_port(start_port: u16) -> Option<u16> {
  for port in start_port..=u16::MAX {
    if is_port_available(port) {
      return Some(port);
    }
  }
  None
}

pub fn is_port_available(port: u16) -> bool {
  match TcpListener::bind(("127.0.0.1", port)) {
    Ok(listener) => {
      drop(listener);
      true
    }
    Err(_) => false,
  }
}

pub fn detect_architecture() -> &'static str {
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
  } else {
    "unknown"
  }
}
