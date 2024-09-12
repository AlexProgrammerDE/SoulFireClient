// Prevents an additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::{env, thread};
use std::ops::Deref;
use crate::cast::{connect_cast, discover_casts, CastRunningState};
use crate::discord::load_discord_rpc;
use crate::sf_loader::{run_integrated_server, IntegratedServerState};
use crate::utils::kill_child_process;
use tauri::async_runtime::Mutex;
use tauri::{CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};

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
    .manage(IntegratedServerState {
      starting: Arc::new(AtomicBool::new(false)),
      child_process: Arc::new(Mutex::new(None)),
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

      let app_handle = app.handle();
      app.listen_global("kill-integrated-server", move |_event| {
        kill_child_process(app_handle.state::<IntegratedServerState>().deref());
        app_handle.emit_all("integrated-server-killed", ()).unwrap();
      });
      Ok(())
    })
    .on_window_event(move |event| {
      if let tauri::WindowEvent::CloseRequested { .. } = event.event() {
        kill_child_process(event.window().state::<IntegratedServerState>().deref());
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
