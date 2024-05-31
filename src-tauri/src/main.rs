// Prevents an additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use serde::Serialize;
use tauri::{AppHandle, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};

#[tauri::command]
async fn run_integrated_server(app_handle: AppHandle) -> String {
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

        send_log(&app_handle, "Fetching jvm data...");
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
            send_log(app_handle, format!("Downloading jvm... {}%", progress * 100 / total));
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

        send_log(&app_handle, "Extracting jvm...");
        let decompressed = flate2::read::GzDecoder::new(&content[..]);
        let mut archive = tar::Archive::new(decompressed);
        archive.unpack(&jvm_dir).unwrap();

        send_log(&app_handle, "Fixing up data...");
        // Move all files from jdk_dir_name to jvm_dir
        let jdk_dir = &jvm_dir.join(jdk_dir_name);
        for entry in std::fs::read_dir(jdk_dir).unwrap() {
            let entry = entry.unwrap();
            let file_name = entry.file_name();
            let new_path = jvm_dir.join(file_name);
            std::fs::rename(entry.path(), new_path).unwrap();
        }

        // Delete jdk_dir_name
        std::fs::remove_dir_all(jdk_dir).unwrap();

        send_log(&app_handle, "Downloaded jvm");
    } else {
        send_log(&app_handle, "JVM already downloaded");
    }

    let url = "http://localhost:8080";
    let token = "token";
    return format!("{}\n{}", url, token);
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
