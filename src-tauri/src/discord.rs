use std::time::{SystemTime, UNIX_EPOCH};

use discord_presence::{Client, Event};
use log::{error, info};

const CLIENT_ID: u64 = 1248603974475583608;
pub fn load_discord_rpc() {
  let mut discord_rpc = Client::new(CLIENT_ID);

  let _ready = discord_rpc.on_ready(|_ctx| {
    info!("Discord RPC ready!");
  });

  let _error = discord_rpc.on_error(|error| {
    error!("Discord RPC error: {:?}", error);
  });

  discord_rpc.start();

  let start = SystemTime::now();
  let epoch_secs = start
    .duration_since(UNIX_EPOCH)
    .expect("Time went backwards")
    .as_secs();
  discord_rpc.block_until_event(Event::Ready).unwrap();
  if let Err(why) = discord_rpc.set_activity(|a| {
    a.state("Idling")
      .details("Professional bot tool")
      .timestamps(|timestamps| timestamps.start(epoch_secs))
      .assets(|assets| assets.large_image("logo").large_text("SoulFire logo"))
      .append_buttons(|button| button.label("Learn more").url("https://soulfiremc.com"))
  }) {
    error!("Failed to set presence: {}", why);
  }

  discord_rpc.block_on().unwrap();
}
