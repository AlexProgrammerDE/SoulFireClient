# SoulFireClient

This is a client for the SoulFire server. It is written using Next.JS and packaged as a Tauri app.

## Compiling gRPC-web files

```bash
export DIR=proto
export OUT_DIR=src/generated
protoc -I=$DIR $(find proto -iname "*.proto") \
  --js_out=import_style=commonjs:$OUT_DIR \
  --grpc-web_out=import_style=typescript,mode=grpcwebtext:$OUT_DIR
```
