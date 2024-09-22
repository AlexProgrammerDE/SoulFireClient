use crate::cast::{connect_cast, discover_casts, get_casts, CastRunningState};
use crate::discord::load_discord_rpc;
use crate::sf_loader::{run_integrated_server, IntegratedServerState};
use crate::utils::kill_child_process;
use log::info;
use std::ops::Deref;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::{env, thread};
use tauri::async_runtime::Mutex;
use tauri::{Emitter, Listener, Manager};
use tauri_plugin_updater::UpdaterExt;

#[cfg(desktop)]
mod tray;
mod cast;
mod discord;
mod sf_loader;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  env_logger::init();

  thread::spawn(|| load_discord_rpc());

  tauri::Builder::default()
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_clipboard_manager::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_os::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .manage(CastRunningState {
      running: AtomicBool::new(false),
      announced_devices: Mutex::new(Vec::new()),
    })
    .manage(IntegratedServerState {
      starting: Arc::new(AtomicBool::new(false)),
      child_process: Arc::new(Mutex::new(None)),
    })
    .invoke_handler(tauri::generate_handler![
            run_integrated_server,
            discover_casts,
            connect_cast,
            get_casts
        ])
    .setup(|app| {
      #[cfg(all(desktop))]
      {
        let handle = app.handle();
        tray::create_tray(handle)?;
      }

      let main_window = app.get_webview_window("main").unwrap();
      let app_version = &app.package_info().version;
      let _ = main_window.set_title(format!("SoulFireClient {app_version}").as_str());

      let app_handle = app.handle().clone();
      app.listen("kill-integrated-server", move |_event| {
        kill_child_process(app_handle.state::<IntegratedServerState>().deref());
        app_handle.emit("integrated-server-killed", ()).unwrap();
      });

      let handle = app.handle().clone();
      tauri::async_runtime::spawn(async move {
        let _ = update(handle).await;
      });
      Ok(())
    })
    .on_window_event(move |window, event| {
      if let tauri::WindowEvent::CloseRequested { .. } = event {
        kill_child_process(window.state::<IntegratedServerState>().deref());
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

async fn update(app: tauri::AppHandle) -> tauri::Result<()> {
  info!("Checking for updates");
  if let Some(update) = app.updater().unwrap().check().await.unwrap() {
    let mut downloaded = 0;

    update.download_and_install(|chunk_length, content_length| {
      downloaded += chunk_length;
      info!("Downloaded {downloaded} from {content_length:?}");
    }, || {
      info!("Download finished");
    }).await.unwrap();

    info!("Update installed");
    app.restart();
  } else {
    info!("No update found");
  }

  Ok(())
}
