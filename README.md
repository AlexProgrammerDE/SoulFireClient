# SoulFireClient

This is a client for the SoulFire server. It is written using Next.JS and packaged as a Tauri app.

## Compiling gRPC-web files

```bash
mkdir -p src/generated
npx protoc --ts_out src/generated --proto_path protos $(find protos -iname "*.proto")
```

## Linux dependencies

```bash
sudo apt install libavahi-client-dev
```
