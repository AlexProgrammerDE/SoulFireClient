use crate::cast::{CastRunningState, connect_cast, discover_casts, get_casts};
use crate::discord::load_discord_rpc;
use crate::sf_loader::{IntegratedServerState, get_sf_server_version, run_integrated_server};
use crate::utils::kill_child_process;
use log::{error, info};
use std::ops::Deref;
use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use std::{env, thread};
use tauri::async_runtime::Mutex;
use tauri::{Emitter, Listener, Manager};
use tauri_plugin_log::fern::colors::Color;
#[cfg(desktop)]
use tauri_plugin_updater;

mod cast;
mod discord;
mod sf_loader;
mod sf_version_constant;
#[cfg(desktop)]
mod tray;
#[cfg(desktop)]
mod updater;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // jsonwebtoken v10 requires selecting one process-level CryptoProvider.
    let _ = jsonwebtoken::crypto::rust_crypto::DEFAULT_PROVIDER.install_default();

    let mut builder = tauri::Builder::default().plugin(tauri_plugin_opener::init());

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }));
        builder = builder.plugin(
            tauri_plugin_window_state::Builder::new()
                .with_state_flags(
                    tauri_plugin_window_state::StateFlags::all()
                        - tauri_plugin_window_state::StateFlags::VISIBLE
                        - tauri_plugin_window_state::StateFlags::DECORATIONS,
                )
                .build(),
        )
    }

    builder
        .plugin(tauri_plugin_deep_link::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .level_for(
                    "discord_presence::connection::manager",
                    log::LevelFilter::Off,
                )
                .with_colors(tauri_plugin_log::fern::colors::ColoredLevelConfig {
                    error: Color::Red,
                    warn: Color::Yellow,
                    debug: Color::Cyan,
                    info: Color::Green,
                    trace: Color::Blue,
                })
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Webview,
                ))
                .max_file_size(50_000)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                .build(),
        )
        .plugin(tauri_plugin_process::init())
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
            get_sf_server_version,
            discover_casts,
            connect_cast,
            get_casts
        ])
        .setup(|app| {
            std::panic::set_hook(Box::new(|panic_info| {
                error!("{}", format!("{}", panic_info).replace('\n', " "));
            }));

            thread::spawn(|| match load_discord_rpc() {
                Ok(_) => {}
                Err(error) => {
                    error!("Fatal discord error: {error}");
                }
            });

            #[cfg(desktop)]
            {
                let handle = app.handle();
                tray::create_tray(handle)?;
            }

            #[cfg(desktop)]
            {
                if env::var("SOULFIRE_DISABLE_UPDATER").is_err() && !cfg!(dev) {
                    app.handle()
                        .plugin(tauri_plugin_updater::Builder::new().build())?;
                    let handle = app.handle().clone();
                    tauri::async_runtime::spawn(async move {
                        match updater::update(handle).await {
                            Ok(()) => {
                                info!("Updater finished");
                            }
                            Err(error) => {
                                error!("An updater error occurred! {error}");
                            }
                        }
                    });
                }
            }

            #[cfg(desktop)]
            {
                let app_handle = app.handle().clone();
                app.listen("app-loaded", move |_event| {
                    app_handle
                        .get_webview_window("main")
                        .unwrap()
                        .show()
                        .unwrap();
                });
            }

            let app_handle = app.handle().clone();
            app.listen("kill-integrated-server", move |_event| {
                info!("Got request to kill integrated server");
                kill_child_process(app_handle.state::<IntegratedServerState>().deref());
                if let Err(error) = app_handle.emit("integrated-server-killed", ()) {
                    error!("An emit error occurred! {error}");
                }
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
