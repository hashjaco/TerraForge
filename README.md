# TerraForge

A modern, high-performance civil engineering design platform built with Tauri v2, React, and Rust.

## Architecture

- **Frontend**: React 19 + TypeScript + React Three Fiber + Zustand + Tailwind CSS
- **Backend**: Rust geometry engine (Delaunay triangulation, corridor extrusion, pipe hydraulics)
- **Desktop**: Tauri v2 (native Rust backend, WebView frontend)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Rust](https://rustup.rs/) stable
- Platform-specific Tauri dependencies (see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/))

### Development

```bash
npm install
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

## Project Structure

```
terraforge/
├── src-tauri/          # Rust backend
│   └── src/
│       ├── engine/     # Geometry computation (surface, alignment, profile, corridor, pipes)
│       ├── graph/      # Dependency graph (DAG with propagation)
│       ├── commands/   # Tauri IPC command handlers
│       ├── spatial/    # Spatial indexing and chunking
│       ├── io/         # File I/O (.terra format, import)
│       └── state/      # Project state and history
├── src/                # React frontend
│   ├── renderer/       # Three.js/R3F 3D rendering
│   ├── components/     # UI components (layout, editors, properties)
│   ├── features/       # Feature modules (surface, alignment, corridor, pipes)
│   ├── education/      # Tutorial system and tooltips
│   ├── plugins/        # Plugin API and loader
│   ├── stores/         # Zustand state management
│   └── lib/            # Types, math, Tauri bridge
```

## Core Features

- **Parametric Modeling**: Surfaces, alignments, profiles, corridors, pipe networks
- **Dependency Graph**: Changes propagate automatically across the model
- **Real-time 3D**: GPU-accelerated terrain, corridor, and pipe visualization
- **Education-first**: Built-in tutorials, contextual tooltips, beginner/expert modes
- **Modern UX**: Command palette, dockable panels, direct manipulation
