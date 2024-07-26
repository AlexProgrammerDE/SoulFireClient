// Prevents an additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{env, thread};
use std::str::FromStr;
use std::sync::atomic::AtomicBool;

use serde::Serialize;
use tauri::{CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};

use crate::cast::{CastRunningState, connect_cast, discover_casts};
use crate::discord::load_discord_rpc;
use crate::sf_loader::run_integrated_server;

mod utils;
mod cast;
mod discord;
mod sf_loader;

fn main() {
  env_logger::init();

  thread::spawn(|| {
    load_discord_rpc()
  });

  let open = CustomMenuItem::new("open".to_string(), "Open SoulFire");
  let quit = CustomMenuItem::new("quit".to_string(), "Quit SoulFire");
  let tray_menu = SystemTrayMenu::new()
    .add_item(open)
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(quit);
  tauri::Builder::default()
    .manage(CastRunningState {
      running: AtomicBool::new(false),
    })
    .invoke_handler(tauri::generate_handler![run_integrated_server, discover_casts, connect_cast])
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
