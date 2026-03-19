# 🚀 OIDC Sandbox - Codebase Walkthrough

Welcome to the ultimate guide for deciphering the OIDC Sandbox codebase. This repository allows users to visually drag and drop components, auto-detect authentication architectures, simulate actual protocol flows with animations, and run security attacks.

Wait, how does all of this work together securely and blazingly fast in the browser? Let's break it down!

---

## 🛠️ Tech Stack Overview

- **Framework**: React 18 + TypeScript + Vite
- **Canvas System**: `@xyflow/react` (React Flow)
- **State Management**: `zustand` 
- **Icons & UI**: `lucide-react`, Tailwind CSS
- **Interactive Tour**: `driver.js`

---

## 🏗️ Repository Architecture

If you're opening the repo, here's where to look:

- `src/components/canvas/`: The core interaction area.
  - `CanvasWrapper.tsx`: Initializes the board, handles drop coordinates (`screenToFlowPosition`), and manages global zoom/pan constraints.
  - `ComponentNode.tsx`: The stylized, 3D-effect cards (e.g., SPA, IdP). Renders active glows and truncation.
  - `ProtocolEdge.tsx`: The heart of the animation system. Draws the glowing dashed lines and moving data packets (`<animateMotion>`) when flows are active.
  
- `src/components/panels/`: Floating UI for interacting with selected items.
  - `ConfigurationPanel.tsx`: Enables tweaking variables (like Memory vs LocalStorage) that impact vulnerability testing.
  - `AttackPanel.tsx`: The attack simulator interface.
  - `ArchitectureSelectionPanel.tsx`: Prompts the user when a valid connection shape is found.

- `src/data/`: The rigid protocol logic.
  - `architectures.ts`: The absolute brain of the app. Defines what combinations of components (e.g., `['browser', 'spa']`) trigger which flows, and maps out the exact sequence of HTTP steps for execution.
  - `components.ts`: Definitions for the available node types (IdP, Web API).
  - `attacks.ts`: Logic mapping which architectures are vulnerable to which exploits based on their config.

- `src/store/`: The global nervous system using Zustand.
  - `canvasStore.ts`: Tracks raw node coordinates and edge connections (pure React Flow data).
  - `flowStore.ts`: Tracks the "Game State" — which architecture is selected, whether the timeline is currently playing, and the `animationStep` index.

---

## 🧠 How the Magic Works

### 1. Architecture Detection (`useArchitectureDetector.ts`)
When a user connects a SPA to an Identity Provider, the detector scans `canvasStore.nodes`. It cross-references these against `architectures.ts` (`requiredTypes` and `forbiddenTypes`). If a match is found, it populates `detectedArchitectures` and enables the timeline.

### 2. The Timeline & Animation Pipeline
When the user hits **Play** in the `FlowTimeline.tsx`:
1. `flowStore` toggles `isPlaying` to true, starting a `setInterval` that increments `animationStep`.
2. `ProtocolEdge.tsx` watches this step. If its "from" and "to" nodes match the current step in the architecture definition, it renders a `<circle>` with an SVG `<animateMotion>` tag.
3. *Ghost Edges*: If an architecture has a step (e.g., IdP redirecting back to SPA) but the user didn't explicitly draw that specific reverse line, `CanvasWrapper.tsx` dynamically projects a "Ghost Edge" strictly for the animation.

### 3. Attack Simulation
If the Attack simulator is running (`attackMode === true`), the system references `attacks.ts` to see if the chosen architecture + configuration is vulnerable. If it is, the normal Protocol lines turn Crimson Red, the vulnerable nodes throb, and execution halts at the exploit step!

---

## 🎨 Styling & Theming
The app relies heavily on **Tailwind CSS**. It uses standard utilities alongside heavily customized raw CSS in `index.css`:
- Custom scrollbar hiding (`.scrollbar-hide`), 
- Animations (`@keyframes dash-flow`), 
- Native overrides for `driver.js` so the guided walkthrough matches the neon dark-mode aesthetic perfectly.

## 🚢 Ready to Deploy?
Because the entire application is an ephemeral, client-side only React SPA (using purely `localStorage`), it is inherently secure to deploy anywhere. 
To deploy, simply run:
```bash
npm run build
```
And deploy the `dist/` folder to Vercel, Netlify, GitHub Pages, or any static hosting provider. 

Happy building! 🔐
