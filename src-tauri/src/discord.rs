use std::time::{SystemTime, UNIX_EPOCH};

use discord_presence::{Client, Event};
use log::{error, info};

const CLIENT_ID: u64 = 1248603974475583608;
pub fn load_discord_rpc() {
  let mut drpc = Client::new(CLIENT_ID);

  let _ready = drpc.on_ready(|_ctx| {
    info!("Discord RPC ready!");
  });

  let _ready = drpc.on_error(|error| {
    error!("Discord RPC error: {:?}", error);
  });

  drpc.start();

  let start = SystemTime::now();
  let epoch_secs = start
    .duration_since(UNIX_EPOCH)
    .expect("Time went backwards")
    .as_secs();
  drpc.block_until_event(Event::Ready).unwrap();
  if let Err(why) = drpc.set_activity(|a| {
    a.state("Idling")
      .details("Professional bot tool")
      .timestamps(|timestamps| {
        timestamps
          .start(epoch_secs)
      })
      .assets(|assets| {
        assets
          .large_image("logo")
          .large_text("SoulFire logo")
      })
      .append_buttons(|button| {
        button
          .label("Learn more")
          .url("https://soulfiremc.com")
      })
  }) {
    error!("Failed to set presence: {}", why);
  }

  drpc.block_on().unwrap();
}
