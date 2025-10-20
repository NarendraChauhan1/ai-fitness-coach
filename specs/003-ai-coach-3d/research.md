# Technology Research: AI 3D Fitness Coach

**Feature**: AI 3D Fitness Coach | **Branch**: `003-ai-coach-3d` | **Date**: 2025-10-20

## Overview

This document captures research decisions for the AI Fitness Coach implementation, documenting chosen technologies, rationale, and rejected alternatives.

---

## Core Technology Decisions

### 1. Pose Detection: MediaPipe Pose Heavy Variant

**Decision**: Use MediaPipe Pose Heavy variant exclusively

**Rationale**:
- Provides highest accuracy for 3D landmark detection with full XYZ coordinates
- Better depth perception critical for form validation (e.g., knee alignment, back straightness)
- GPU acceleration via WASM ensures 30+ FPS on mid-range devices
- Proven track record in fitness applications
- Free and open-source (Apache 2.0 license)

**Alternatives Considered**:
- **MediaPipe Lite**: Rejected - Lower accuracy could miss subtle form errors critical for injury prevention
- **TensorFlow PoseNet**: Rejected - Only 2D landmarks; lacks depth information needed for 3D form analysis
- **OpenPose**: Rejected - Requires server-side processing; conflicts with client-side architecture
- **ML Kit Pose Detection**: Rejected - Mobile-only; not suitable for web deployment

**Implementation Notes**:
- Bundle size impact: ~6MB uncompressed (~2MB gzipped)
- Requires WebGL support
- Fallback strategy: Graceful degradation with browser compatibility check

---

### 2. Framework: Next.js 15 with App Router

**Decision**: Next.js 15+ with App Router and static export

**Rationale**:
- App Router enables Server Components for static content (exercise library, instructions)
- Client Components for interactive features (camera, pose detection)
- Built-in code splitting and optimization
- Static export for GitHub Pages deployment (zero hosting cost)
- TypeScript support out-of-the-box
- Fast Refresh for rapid development

**Alternatives Considered**:
- **Create React App**: Rejected - Deprecated; limited optimization capabilities
- **Vite + React**: Rejected - Requires more manual configuration for routing and optimization
- **Vanilla JS + Rollup**: Rejected - Too low-level; would slow development significantly
- **Svelte/SvelteKit**: Rejected - Smaller ecosystem for AI/ML libraries

**Implementation Notes**:
- Use `next export` for static HTML generation
- Configure `output: 'export'` in `next.config.js`
- Dynamic imports for MediaPipe to reduce initial bundle

---

### 3. State Management: Zustand

**Decision**: Zustand for global state management

**Rationale**:
- Lightweight (~1KB gzipped) vs Redux (~10KB)
- Simple API with TypeScript support
- No boilerplate required
- Built-in persist middleware for session state (if needed)
- React 19 compatible

**Alternatives Considered**:
- **Redux Toolkit**: Rejected - Too heavy for this use case; unnecessary complexity
- **Context API**: Rejected - Performance issues with frequent pose updates (30+ FPS)
- **Jotai/Recoil**: Rejected - Atomic approach unnecessary; single workout state sufficient

**Implementation Notes**:
- Stores: `workoutStore` (session state), `settingsStore` (UI preferences)
- No persistence needed per clarifications

---

### 4. Voice Feedback: Web Speech API + Predefined Text

**Decision**: Browser-native text-to-speech with predefined text prompts

**Rationale**:
- Zero-cost solution (no API fees)
- Works offline after initial page load
- Predefined prompts ensure consistent, actionable feedback
- Supported in all major browsers (Chrome, Edge, Safari, Firefox)
- ~200ms latency achievable with prompt queue management

**Alternatives Considered**:
- **Preloaded audio files**: Rejected - Less flexible; requires recording all phrases
- **Cloud TTS APIs (Google, AWS)**: Rejected - Requires internet; adds latency and cost
- **Silent mode only**: Rejected - Voice feedback is core to "replacing human trainers" requirement

**Implementation Notes**:
- ~20-30 predefined prompts covering common form corrections
- Queue system to prevent overlapping audio
- Fallback to visual-only feedback if browser doesn't support TTS

---

### 5. Visualization: Canvas 2D with Depth-Aware Color Coding

**Decision**: Canvas 2D rendering with color-coded depth visualization

**Rationale**:
- Lightweight (~0KB additional bundle)
- 60 FPS rendering capability
- Z-depth visualization via color gradients (red=too close, green=optimal, yellow=too far)
- Works on all devices including low-end mobile
- Easy to implement skeletal connections between landmarks

**Alternatives Considered**:
- **Three.js full 3D**: Rejected - Adds ~150KB gzipped; overkill for skeletal overlay
- **SVG rendering**: Rejected - Performance issues at 30+ FPS update rate
- **WebGL shaders**: Rejected - Unnecessary complexity; Canvas 2D sufficient

**Implementation Notes**:
- Use `requestAnimationFrame` for smooth rendering
- Color mapping based on Z-coordinate normalized to camera distance
- Draw skeleton with lines connecting landmark pairs

---

### 6. Monorepo Management: npm Workspaces

**Decision**: npm workspaces for 3-package monorepo

**Rationale**:
- Built into npm 7+ (zero additional dependencies)
- Simple configuration via root `package.json`
- Works seamlessly with Next.js and TypeScript
- Sufficient for 3-package structure
- Local package linking without symlink issues

**Alternatives Considered**:
- **Turborepo**: Rejected - Adds complexity and dependencies for marginal caching benefit
- **pnpm workspaces**: Rejected - Requires switching package manager
- **Yarn workspaces**: Rejected - No significant advantage over npm workspaces
- **Lerna**: Rejected - Outdated; npm workspaces standard now

**Implementation Notes**:
```json
{
  "workspaces": [
    "packages/pose-analysis-3d",
    "packages/coaching-engine",
    "packages/fitness-coach-app"
  ]
}
```

---

### 7. Testing Strategy

**Decision**: Multi-layer testing with Jest, RTL, and Playwright

**Rationale**:
- **Unit tests (Jest + RTL)**: Fast feedback for geometry calculations, rep counting logic
- **Integration tests**: Validate pose → feedback pipeline
- **E2E tests (Playwright)**: Verify full user workflows with mocked camera input
- **Pose validation suite**: Custom test fixtures with known good/bad poses

**Alternatives Considered**:
- **Cypress only**: Rejected - Heavier than Playwright; less suitable for component testing
- **No E2E tests**: Rejected - Critical for verifying camera → pose → feedback flow
- **Manual testing only**: Rejected - Regression risk too high for safety-critical app

**Implementation Notes**:
- Mock MediaPipe output for consistent test data
- Use Playwright's video recording for debugging visual issues
- Performance tests to validate 30 FPS target

---

### 8. UI Framework: Tailwind CSS + shadcn/ui

**Decision**: Tailwind CSS for styling, shadcn/ui for component library

**Rationale**:
- Tailwind: Utility-first CSS with minimal bundle impact via PurgeCSS
- shadcn/ui: Copy-paste components (no runtime dependency)
- Modern, accessible components out-of-the-box
- Easy customization with Tailwind theming
- Dark mode support built-in

**Alternatives Considered**:
- **Material-UI**: Rejected - Heavy bundle size (~300KB)
- **Chakra UI**: Rejected - Runtime CSS-in-JS adds overhead
- **Vanilla CSS**: Rejected - Slower development; harder to maintain consistency
- **Bootstrap**: Rejected - Not optimized for modern React patterns

**Implementation Notes**:
- Install only needed shadcn/ui components
- Use Tailwind's JIT mode for development speed
- Custom color palette for depth indicators (red/yellow/green)

---

### 9. Animation: Framer Motion

**Decision**: Framer Motion for UI transitions

**Rationale**:
- Declarative animation API
- Performance-optimized (uses GPU acceleration)
- Small bundle impact (~30KB gzipped)
- Excellent TypeScript support
- Smooth page transitions and feedback animations

**Alternatives Considered**:
- **CSS animations only**: Rejected - Less flexible; harder to coordinate complex sequences
- **React Spring**: Rejected - Physics-based approach overkill for simple transitions
- **GSAP**: Rejected - Commercial license required for this use case

**Implementation Notes**:
- Use for page transitions between exercise selection and workout
- Animate feedback messages entering/exiting
- Skeleton overlay fade-in on pose detection

---

### 10. Performance Optimizations

**Decision**: Multi-pronged performance strategy

**Key Strategies**:
1. **Web Workers**: Offload pose processing to prevent UI blocking
2. **Dynamic Imports**: Lazy-load MediaPipe and exercise modules
3. **Code Splitting**: Route-based splitting via Next.js
4. **React.memo**: Prevent unnecessary re-renders of static components
5. **Debouncing**: Rate-limit feedback to prevent spam (200ms minimum interval)

**Rationale**:
- Web Worker essential for maintaining 30 FPS while processing pose data
- Dynamic imports reduce initial bundle from ~8MB to <600KB
- Debouncing prevents audio/visual feedback overload

**Alternatives Considered**:
- **Server-side processing**: Rejected - Conflicts with client-side architecture
- **Lower frame rate**: Rejected - Would degrade real-time feedback quality
- **No Web Worker**: Rejected - UI would freeze during pose calculations

**Implementation Notes**:
- Worker communicates via `postMessage` with structured clone
- MediaPipe WASM loaded once in worker scope
- Main thread handles rendering only

---

## Risk Analysis

### High-Risk Items

1. **MediaPipe Bundle Size (~6MB uncompressed)**
   - **Mitigation**: Dynamic import, WASM caching, compression
   - **Acceptance**: Bundle size constraint revised to exclude MediaPipe WASM

2. **Browser Compatibility (WebGL, TTS)**
   - **Mitigation**: Feature detection with graceful fallbacks
   - **Acceptance**: Targeting modern browsers only (Chrome/Edge/Safari latest)

3. **Pose Detection Accuracy**
   - **Mitigation**: Heavy variant chosen; thresholds tuned per exercise
   - **Acceptance**: 90% landmark confidence target in spec

### Medium-Risk Items

1. **30+ FPS Performance on Mid-Range Devices**
   - **Mitigation**: Web Workers, GPU acceleration, optimized rendering
   - **Testing**: Performance budgets enforced in CI

2. **TTS Latency and Quality**
   - **Mitigation**: Predefined prompts, audio queue, visual fallback
   - **Testing**: Manual testing across browsers

### Low-Risk Items

1. **TypeScript Complexity**
   - **Mitigation**: Strict typing from day 1, shared types across packages
   
2. **Monorepo Setup**
   - **Mitigation**: npm workspaces well-documented, standard pattern

---

## Open Questions

*All critical unknowns resolved via `/speckit.clarify` workflow:*
- ✅ Session storage: No persistent storage
- ✅ MediaPipe variant: Heavy variant only
- ✅ Voice feedback: Browser TTS with predefined text
- ✅ Monorepo tool: npm workspaces
- ✅ Visualization: Canvas 2D with depth-aware colors

---

## Next Steps

1. **Phase 1 (Design)**: Generate `data-model.md` and `contracts/`
2. **Phase 1 (Design)**: Create `quickstart.md` for developer onboarding
3. **Phase 1 (Design)**: Update agent context with technology stack
4. **Phase 2 (Tasks)**: Break down implementation into actionable tasks via `/speckit.tasks`

---

**Document Status**: Complete | **Last Updated**: 2025-10-20
