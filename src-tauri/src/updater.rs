use crate::utils::SFAnyError;
use log::info;
use tauri_plugin_updater::UpdaterExt;

pub(crate) async fn update(app: tauri::AppHandle) -> Result<(), SFAnyError> {
    info!("Checking for updates");
    if let Some(update) = app.updater()?.check().await? {
        let mut downloaded = 0;

        update
            .download_and_install(
                |chunk_length, content_length| {
                    downloaded += chunk_length;
                    info!("Downloaded {downloaded} from {content_length:?}");
                },
                || {
                    info!("Download finished");
                },
            )
            .await?;

        info!("Update installed");
        app.restart();
    } else {
        info!("No update found");
    }

    Ok(())
}
