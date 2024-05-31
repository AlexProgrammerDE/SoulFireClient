// Prevents an additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::net::TcpListener;
use serde::Serialize;
use tauri::{AppHandle, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};
use tauri::api::process::Command;
use tauri::api::process::CommandEvent::Stdout;

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
        println!("JVM URL: {}", jvm_url);

        send_log(&app_handle, "Fetching JVM data...");
        let response = reqwest::get(&jvm_url).await.unwrap();
        let jvm_json: serde_json::Value = response.json().await.unwrap();
        let download_url = jvm_json[0]["binary"]["package"]["link"].as_str().unwrap();
        let major_version = jvm_json[0]["version"]["major"].as_u64().unwrap();
        let minor_version = jvm_json[0]["version"]["minor"].as_u64().unwrap();
        let security_version = jvm_json[0]["version"]["security"].as_u64().unwrap();
        let build_version = jvm_json[0]["version"]["build"].as_u64().unwrap();
        println!("Download URL: {}", download_url);
        let jdk_dir_name = format!("jdk-{}.{}.{}+{}", major_version, minor_version, security_version, build_version);

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
        let decompressed = flate2::read::GzDecoder::new(&content[..]);
        let mut archive = tar::Archive::new(decompressed);
        for entry in archive.entries().unwrap() {
            let mut entry = entry.unwrap();
            let path = entry.path().unwrap();
            let path = path.strip_prefix(&jdk_dir_name).unwrap();
            let path = jvm_dir.join(path);
            entry.unpack(path).unwrap();
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
        println!("SoulFire URL: {}", soul_fire_url);

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

    println!("Java Executable: {}", java_exec_path);
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
        "java.exe"
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

fn main() {
    let open = CustomMenuItem::new("open".to_string(), "Open SoulFire");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit SoulFire");
    let tray_menu = SystemTrayMenu::new()
        .add_item(open)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![run_integrated_server])
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
