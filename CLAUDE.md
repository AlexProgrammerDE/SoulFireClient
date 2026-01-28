# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SoulFireClient is a React/TypeScript + Tauri frontend for the [SoulFire server](https://github.com/AlexProgrammerDE/SoulFire). It runs on web, desktop (Windows/macOS/Linux), and mobile (Android/iOS) via Tauri 2.

## Build Commands

```bash
pnpm install              # Install dependencies
pnpm dev                  # Start Vite dev server (web only, port 1420)
pnpm dev-tauri            # Start Tauri dev mode (desktop app with hot reload)
pnpm build                # Build web bundle
pnpm build-tauri          # Build Tauri desktop app
pnpm typecheck            # TypeScript type checking
pnpm check                # Run Biome linter
pnpm fix                  # Run Biome with auto-fix
pnpm generate-proto       # Regenerate TypeScript from .proto files (requires protoc)
pnpm generate-routes      # Regenerate TanStack Router route tree
```

## Architecture

### Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **Desktop**: Tauri 2 (Rust backend, requires nightly toolchain)
- **Routing**: TanStack Router (file-based in `src/routes/`)
- **State**: Zustand for editor state, TanStack Query for server state
- **API**: gRPC-Web via `@protobuf-ts` (protos in `protos/`, generated to `src/generated/`)
- **UI**: shadcn/ui components, Radix primitives, Lucide icons

### Key Directories
- `src/routes/` - File-based routing. `_dashboard.tsx` is authenticated layout, `_dashboard/user/` for admin pages, `_dashboard/instance/$instance/` for instance-scoped pages
- `src/components/script-editor/` - Visual node-based script editor built on React Flow
- `src/lib/web-rpc.ts` - gRPC transport setup and auth token management
- `src/lib/script-service.ts` - Query options and proto↔JS conversion utilities
- `src/stores/` - Zustand stores (currently just script editor state)
- `src/generated/` - Auto-generated protobuf types (do not edit manually)
- `src-tauri/` - Rust Tauri backend code

### Import Alias
Use `@/*` to import from `src/` (e.g., `import { Button } from '@/components/ui/button'`)

### Linting
- Biome handles formatting and linting
- Pre-commit hook runs lint-staged with Biome
- Ignored directories: `src/components/ui/`, `src/components/data-table/`, `src/generated/`

### Proto Generation
When modifying gRPC API:
1. Update `.proto` files in `protos/`
2. Run `pnpm generate-proto`
3. Conversion utilities in `src/lib/script-service.ts` may need updates

### Demo Mode
The app supports a demo mode (no server connection) using fallback data from `src/demo-data.ts`. Check `getTransport()` returning null for demo detection.
