# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dbslice v3 is a hierarchical data visualization library designed to support three phases of data exploration: explore, curate, and embed. It provides an infinite canvas approach for exploring complex datasets with features like on-the-fly creation, resizing, zooming, panning, multiple datasets with filters, and enhanced support for derived data visualization.

## Build System

This project uses Rollup for bundling JavaScript modules.

**Build Commands:**
- `npm run build` - Build the production bundle to `build/dbslice.js`
- `npm run dev` - Start development mode with file watching (`rollup -c -w`)

**Entry Point:** `src/Dbslice.js` - Main module that exports all public APIs
**Output:** `build/dbslice.js` - IIFE format bundle with sourcemaps

## Architecture

### Core Architecture Pattern
The codebase follows a modular export pattern where `src/Dbslice.js` serves as the main entry point, exporting all public APIs from various modules.

### Directory Structure
- `src/core/` - Core functionality (Board, Context, Dataset, Filter, rendering, session management)
- `src/plot/` - Visualization components (D3, Three.js, WebGL-based plots, charts, 3D meshes)
- `src/filters/` - Data filtering and transformation utilities
- `test/` - Test files with HTML harness

### Key Components

**Core Classes:**
- `Board` - Main canvas/board management
- `Context` - Application context and state
- `Dataset` - Data management and handling
- `Filter` - Data filtering functionality
- `Plot/PlotGroup` - Base plotting components

**Visualization Types:**
- D3-based: Bar charts, histograms, scatter plots, line series, contours
- Three.js-based: 3D surfaces, triangle meshes, 3D visualizations
- WebGL-based: Correlation matrices, scatter plots
- Specialized: Leaflet maps, GLTF viewers

**Data Processing:**
- Crossfilter integration for interactive filtering
- Support for CSV, time-series, and structured data
- Derived data extraction (cut lines across surfaces)

### Key Dependencies
- **D3 (v4 and v7)** - Primary visualization library
- **Three.js (v0.170 and v0.124)** - 3D graphics and rendering
- **Crossfilter2** - Fast multidimensional filtering
- **Bootstrap 5** - UI components and styling
- **Leaflet** - Map visualizations
- **board-box** - Canvas/board management utilities

## Development Workflow

**Local Development:**
1. Run `npm run dev` to start development server with file watching
2. Open `test/index.html` in a browser to test changes
3. The test harness loads the built bundle and initializes with `dbslice.start("target", "session.json")`

**Testing:**
- No automated test framework configured
- Manual testing through `test/index.html`
- Test harness expects a `session.json` configuration file

## Key Patterns

**Module Organization:** Each plot type and core component is in its own file with named exports
**API Design:** Functions are exported individually rather than as object methods
**Data Flow:** Uses crossfilter for reactive data filtering and updates
**Rendering:** Mixed approach with D3 for 2D, Three.js for 3D, and WebGL for performance-critical visualizations

## Configuration

**Rollup Configuration:**
- Input: `src/Dbslice.js`
- Output: IIFE format for browser usage
- Plugins: PostCSS for CSS processing, CommonJS/ES6 module resolution
- Development environment variable injection