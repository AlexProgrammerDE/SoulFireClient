use std::time::{SystemTime, UNIX_EPOCH};

use discord_presence::{Client, Event};
use log::{error, info};

pub fn load_discord_rpc() {
  let mut drpc = Client::new(1248603974475583608);

  let _ready = drpc.on_ready(|_ctx| {
    info!("Discord RPC ready!");
  });

  let _ready = drpc.on_error(|error| {
    error!("Discord RPC error: {:?}", error);
  });

  let _activity_join_request = drpc.on_activity_join_request(|ctx| {
    info!("Join request: {:?}", ctx.event);
  });

  let _activity_join = drpc.on_activity_join(|ctx| {
    info!("Joined: {:?}", ctx.event);
  });

  let _activity_spectate = drpc.on_activity_spectate(|ctx| {
    info!("Spectate: {:?}", ctx.event);
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
