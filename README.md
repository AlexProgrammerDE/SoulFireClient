# SoulFireClient

<!--suppress HtmlDeprecatedAttribute -->
<p align="center">
<a href="https://github.com/AlexProgrammerDE/SoulFireClient/actions/workflows/build.yml"><img src="https://github.com/AlexProgrammerDE/SoulFireClient/actions/workflows/build.yml/badge.svg?branch=main" alt="Test"></a>
<a href="https://github.com/AlexProgrammerDE/SoulFireClient/graphs/contributors"><img src="https://img.shields.io/github/contributors/AlexProgrammerDE/SoulFireClient.svg" alt="Contributors"></a>
<a href="https://github.com/AlexProgrammerDE/SoulFireClient/blob/main/LICENSE"><img src="https://img.shields.io/github/license/AlexProgrammerDE/SoulFireClient.svg" alt="License"></a>
<a href="https://github.com/AlexProgrammerDE/SoulFireClient/releases/latest"><img alt="GitHub all releases downloads" src="https://img.shields.io/github/downloads/AlexProgrammerDE/SoulFireClient/total"></a>
<a href="https://github.com/AlexProgrammerDE/SoulFireClient/releases/latest"><img alt="GitHub latest release downloads" src="https://img.shields.io/github/downloads/AlexProgrammerDE/SoulFireClient/latest/total"></a>
<a href="https://github.com/AlexProgrammerDE/SoulFireClient/releases/latest"><img src="https://img.shields.io/github/release/AlexProgrammerDE/SoulFireClient.svg" alt="Current Release"></a>
</p>
<p align="center"><a href="https://discord.gg/vHgRd6YZmH"><img src="https://discordapp.com/api/guilds/739784741124833301/embed.png" alt="Discord embed"></a></p>

This is a frontend for the [SoulFire server](https://github.com/AlexProgrammerDE/SoulFire).
It mainly targets the web, but uses native APIs using Tauri.

> [!NOTE]
> For more info about SoulFire, take a look at the main [SoulFire repository](https://github.com/AlexProgrammerDE/SoulFire).

## About the client

Built using latest web tech to consistently work on both web, desktop and mobile.
The client is the GUI for the SoulFire server, but it uses the official SoulFire gRPC API.
Anything that can be done using the SF client can also be done using gRPC HTTP API calls directly.

## Installation

> [!TIP]
> Want to check out how SoulFire looks before installing it? Take a look at the official [demo page](https://demo.soulfiremc.com).

For installing SoulFire, please refer to the [installation guide](https://soulfiremc.com/docs/installation).

<a href='https://flathub.org/apps/com.soulfiremc.soulfire'>
<img width='240' alt='Get it on Flathub' src='https://flathub.org/api/badge?locale=en'/>
</a>

## Deployments

See which branches are at which URLs:

- [`release`](https://app.soulfiremc.com) -> app.soulfiremc.com
- [`main`](https://preview.soulfiremc.com) -> preview.soulfiremc.com
- [`demo`](https://demo.soulfiremc.com) -> demo.soulfiremc.com

## Building

The client has a lot of dependencies. You'll need pnpm, latest node and a nightly rust toolchain installed.
Take a look at the scripts in `package.json` to see how to run a dev env locally.
You can also refer to the GitHub actions workflows to see how production builds are made.

## Sponsors

<table>
 <tbody>
  <tr>
   <td align="center"><img alt="[SignPath]" src="https://avatars.githubusercontent.com/u/34448643" height="30"/></td>
   <td>Free code signing on Windows provided by <a href="https://signpath.io/?utm_source=foundation&utm_medium=github&utm_campaign=soulfire">SignPath.io</a>, certificate by <a href="https://signpath.org/?utm_source=foundation&utm_medium=github&utm_campaign=soulfire">SignPath Foundation</a></td>
  </tr>
 </tbody>
</table>
