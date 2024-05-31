// Prevents an additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use tauri::{CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};

#[tauri::command]
async fn run_integrated_server(window: tauri::Window, app_handle: tauri::AppHandle) -> String {
    let app_local_data_dir = app_handle.path_resolver().app_local_data_dir();
    window.emit("integrated-server-start-log", "Downloading jvm...").expect("Failed to emit event");

    app_local_data_dir.unwrap().to_string_lossy().to_string()
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
