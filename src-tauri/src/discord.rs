use discord_presence::{Client, Event};

pub fn load_discord_rpc() {
  let mut drpc = Client::new(1248603974475583608);

  let _ready = drpc.on_ready(|_ctx| {
    println!("ready?");
  });

  let _activity_join_request = drpc.on_activity_join_request(|ctx| {
    println!("Join request: {:?}", ctx.event);
  });

  let _activity_join = drpc.on_activity_join(|ctx| {
    println!("Joined: {:?}", ctx.event);
  });

  let _activity_spectate = drpc.on_activity_spectate(|ctx| {
    println!("Spectate: {:?}", ctx.event);
  });

  drpc.start();

  drpc.block_until_event(Event::Ready).unwrap();
  if let Err(why) = drpc.set_activity(|a| {
    a.state("Idling")
      .assets(|ass| {
        ass.large_image("logo")
          .large_text("SoulFire logo")
      })
      .append_buttons(|button|
      button
        .label("Learn more")
        .url("https://soulfiremc.com")
      )
  }) {
    println!("Failed to set presence: {}", why);
  }

  drpc.block_on().unwrap();
}
