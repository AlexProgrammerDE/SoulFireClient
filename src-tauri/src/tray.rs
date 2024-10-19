use crate::utils::{SFAnyError, SFError};
use log::error;
use tauri::menu::MenuEvent;
use tauri::{menu::{Menu, MenuItem}, tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent}, AppHandle, Manager, Runtime};
use tauri::tray::TrayIcon;

fn handle_menu_event<R: Runtime>(
  app_handle: AppHandle<R>,
  event: MenuEvent,
) -> Result<(), SFAnyError> {
  match event.id.as_ref() {
    "open" => {
      let _ = app_handle.get_webview_window("main").ok_or(SFError::NoMainWindow)?.show();
    }
    "quit" => {
      app_handle.exit(0);
    }
    _ => {}
  }

  Ok(())
}

fn handle_tray_event<R: Runtime>(
  tray: TrayIcon<R>,
  event: TrayIconEvent,
) -> Result<(), SFAnyError> {
  if let TrayIconEvent::Click {
    button: MouseButton::Left,
    button_state: MouseButtonState::Up,
    ..
  } = event {
    let app = tray.app_handle();
    let main_window = app.get_webview_window("main").ok_or(SFError::NoMainWindow)?;
    main_window.show()?;
    main_window.set_focus()?;
  }
  
  Ok(())
}

pub fn create_tray<R: Runtime>(app: &AppHandle<R>) -> Result<(), SFAnyError> {
  let open_i = MenuItem::with_id(app, "open", "Open SoulFire", true, None::<&str>)?;
  let quit_i = MenuItem::with_id(app, "quit", "Quit SoulFire", true, None::<&str>)?;
  let menu = Menu::with_items(app, &[&open_i, &quit_i])?;

  let _ = TrayIconBuilder::with_id("tray")
    .icon(app.default_window_icon().ok_or(SFError::NoDefaultWindowIcon)?.clone())
    .menu(&menu)
    .menu_on_left_click(false)
    .on_menu_event(move |app, event| {
      match handle_menu_event(app.clone(), event) {
        Ok(_) => {}
        Err(e) => error!("Error during menu event: {e}"),
      }
    })
    .on_tray_icon_event(|tray, event| {
      match handle_tray_event(tray.clone(), event) {
        Ok(_) => {}
        Err(e) => error!("Error during tray event: {e}"),
      }
    })
    .build(app);

  Ok(())
}
