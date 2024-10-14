use log::info;
use tauri_plugin_updater::UpdaterExt;

pub(crate) async fn update(app: tauri::AppHandle) -> tauri::Result<()> {
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
