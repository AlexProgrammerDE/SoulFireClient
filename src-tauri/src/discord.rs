use std::sync::mpsc;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::utils::SFAnyError;
use discord_presence::{Client, Event};
use log::{debug, error, info};

const CLIENT_ID: u64 = 1248603974475583608;

pub struct DiscordRpcState {
    pub sender: std::sync::Mutex<Option<mpsc::Sender<DiscordPresenceUpdate>>>,
}

#[derive(Clone)]
pub struct DiscordPresenceUpdate {
    pub state: String,
    pub details: Option<String>,
}

pub fn load_discord_rpc(
    receiver: mpsc::Receiver<DiscordPresenceUpdate>,
) -> Result<(), SFAnyError> {
    let mut discord_rpc = Client::new(CLIENT_ID);

    let _ready = discord_rpc.on_ready(|_ctx| {
        info!("Discord RPC ready!");
    });

    let _error = discord_rpc.on_error(|error| {
        debug!("Discord RPC error: {:?}", error);
    });

    discord_rpc.start();

    let start = SystemTime::now();
    let epoch_secs = start.duration_since(UNIX_EPOCH)?.as_secs();
    discord_rpc.block_until_event(Event::Ready)?;

    set_presence(&mut discord_rpc, epoch_secs, "Idling", None);

    while let Ok(update) = receiver.recv() {
        set_presence(
            &mut discord_rpc,
            epoch_secs,
            &update.state,
            update.details.as_deref(),
        );
    }

    Ok(())
}

fn set_presence(
    client: &mut Client,
    epoch_secs: u64,
    state: &str,
    details: Option<&str>,
) {
    if let Err(why) = client.set_activity(|a| {
        let mut a = a
            .state(state)
            .timestamps(|timestamps| timestamps.start(epoch_secs))
            .assets(|assets| assets.large_image("logo").large_text("SoulFire 🧙"))
            .append_buttons(|button| button.label("Learn more").url("https://soulfiremc.com"));

        if let Some(details) = details {
            a = a.details(details);
        }

        a
    }) {
        error!("Failed to set presence: {}", why);
    }
}

#[tauri::command]
pub fn update_discord_activity(
    state: String,
    details: Option<String>,
    discord_state: tauri::State<'_, DiscordRpcState>,
) {
    if let Some(sender) = discord_state.sender.lock().unwrap().as_ref() {
        let _ = sender.send(DiscordPresenceUpdate { state, details });
    }
}
