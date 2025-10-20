# Implementation Plan: AI 3D Fitness Coach

**Branch**: `003-ai-coach-3d` | **Date**: 2025-10-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-ai-coach-3d/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a client-side Next.js application that replaces personal trainers using AI-powered 3D pose analysis with real-time form correction and voice feedback. The system uses MediaPipe Pose Heavy variant to track 12 core body landmarks (shoulders, elbows, wrists, hips, knees, ankles) in 3D space, validates exercise form against discipline-specific rules, and delivers immediate corrective feedback via browser-native text-to-speech. The application operates entirely client-side with no backend or persistent storage, supporting fitness training, yoga, and general exercise coaching across mobile and desktop devices.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x, React 19, Next.js 15+ (App Router)
**Primary Dependencies**: 
- MediaPipe Pose Heavy variant (WASM GPU acceleration)
- Zustand (state management)
- Tailwind CSS + shadcn/ui (UI components)
- Framer Motion (animations)
- Web Speech API (text-to-speech)
- Canvas 2D API (skeletal overlay)

**Storage**: N/A (no persistent storage per clarifications - transient session data only)
**Testing**: Jest + React Testing Library (unit), Playwright (E2E), custom pose validation test suite
**Target Platform**: Modern web browsers (Chrome/Edge/Safari) on desktop and mobile with WebGL support
**Project Type**: Monorepo with 3 packages managed via npm workspaces
**Performance Goals**: 
- Pose detection: ≥30 FPS on mid-range devices
- Feedback latency: ≤200ms
- Cold start: <2 seconds
- Rep counting accuracy: ≤5% error rate

**Constraints**: 
- Bundle size: <600KB gzipped (excluding MediaPipe WASM)
- Client-side only (no backend)
- Offline-capable after initial load
- MediaPipe Heavy bundle: ~6MB uncompressed

**Scale/Scope**: 
- 3 initial exercises (marching, jumping jacks, push-ups)
- 3 training modes (fitness, yoga, general exercise)
- 12 core body landmarks tracked
- ~20-30 predefined voice feedback phrases

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS - No project constitution exists yet. Recommend creating constitution after this feature establishes baseline patterns.

**Recommended Constitution Principles** (for future):
1. **Client-Side First**: All processing happens in-browser; no backend dependencies
2. **Privacy by Default**: No data transmission; transient storage only
3. **Performance Budget**: Bundle size and FPS targets enforced in CI
4. **Progressive Enhancement**: Core features work without cutting-edge APIs

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```
packages/
├── pose-analysis-3d/          # Core pose detection library
│   ├── src/
│   │   ├── mediapipe/         # MediaPipe integration
│   │   ├── geometry/          # 3D math (angles, distances, depth)
│   │   ├── exercises/         # Exercise-specific validation
│   │   ├── types/             # TypeScript types
│   │   └── index.ts
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── fixtures/          # Sample pose data
│   ├── package.json
│   └── tsconfig.json
│
├── coaching-engine/           # Feedback and motivation system
│   ├── src/
│   │   ├── feedback/          # Feedback generation logic
│   │   ├── voice/             # TTS management
│   │   ├── rep-counter/       # Rep counting algorithms
│   │   ├── motivation/        # Motivational prompts
│   │   ├── types/
│   │   └── index.ts
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
│
└── fitness-coach-app/         # Main Next.js application
    ├── app/                   # App Router structure
    │   ├── layout.tsx
    │   ├── page.tsx           # Landing page
    │   ├── workout/
    │   │   ├── page.tsx       # Exercise selection
    │   │   └── [exercise]/    # Dynamic exercise routes
    │   │       └── page.tsx   # Live workout session
    │   └── about/
    ├── components/
    │   ├── camera/            # Camera integration
    │   ├── pose-overlay/      # Canvas skeletal rendering
    │   ├── feedback-ui/       # Visual feedback display
    │   └── ui/                # shadcn/ui components
    ├── lib/
    │   ├── store/             # Zustand stores
    │   └── utils/
    ├── public/
    │   ├── audio/             # Preloaded voice feedback audio
    │   └── exercises/         # Exercise thumbnails
    ├── workers/
    │   └── pose-processor.ts  # Web Worker for pose calculations
    ├── tests/
    │   ├── e2e/               # Playwright tests
    │   └── unit/
    ├── next.config.js
    ├── package.json
    └── tsconfig.json

specs/003-ai-coach-3d/         # Feature documentation
├── spec.md
├── plan.md                    # This file
├── research.md                # Phase 0 output
├── data-model.md              # Phase 1 output
├── quickstart.md              # Phase 1 output
├── contracts/                 # Phase 1 output
└── tasks.md                   # Phase 2 output (not yet created)

Root files:
├── package.json               # Workspace root config
├── tsconfig.json              # Shared TypeScript config
├── .eslintrc.js
├── .prettierrc
└── turbo.json                 # Optional: for build caching
```

**Structure Decision**: Monorepo with 3 packages managed via npm workspaces. This structure:
- Separates concerns: pose analysis, coaching logic, and UI
- Enables independent testing and versioning
- Allows sharing TypeScript types across packages
- Supports future reuse of libraries in other projects

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

N/A - No constitution violations (no constitution exists yet).

