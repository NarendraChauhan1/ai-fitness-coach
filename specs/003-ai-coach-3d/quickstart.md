# Quickstart Guide: AI 3D Fitness Coach

**Feature**: AI 3D Fitness Coach | **Branch**: `003-ai-coach-3d` | **Date**: 2025-10-20

---

## Prerequisites

- **Node.js**: 18.x or later
- **npm**: 9.x or later
- **Browser**: Chrome/Edge/Safari (latest) with WebGL support
- **Camera**: Device camera (front-facing recommended)

---

## Installation

```bash
# Clone repository
git clone <repo-url>
cd Ai-Fitness-Coach

# Checkout feature branch
git checkout 003-ai-coach-3d

# Install dependencies (npm workspaces)
npm install

# This installs all 3 packages:
# - packages/pose-analysis-3d
# - packages/coaching-engine
# - packages/fitness-coach-app
```

---

## Development

```bash
# Start Next.js dev server
cd packages/fitness-coach-app
npm run dev

# Open browser
# Navigate to http://localhost:3000
```

**Dev Server Features**:
- Fast Refresh: Instant updates on code changes
- TypeScript checking: Type errors shown in terminal
- Hot Module Replacement: No full page reloads

---

## Project Structure

```
packages/
├── pose-analysis-3d/      # Pose detection library
│   ├── src/
│   │   ├── mediapipe/     # MediaPipe integration
│   │   ├── geometry/      # 3D math utilities
│   │   ├── exercises/     # Exercise validators
│   │   └── types/         # TypeScript types
│   └── tests/
│
├── coaching-engine/       # Feedback & motivation
│   ├── src/
│   │   ├── feedback/      # Feedback generation
│   │   ├── voice/         # TTS management
│   │   └── rep-counter/   # Rep counting
│   └── tests/
│
└── fitness-coach-app/     # Next.js application
    ├── app/               # App Router pages
    ├── components/        # React components
    ├── lib/store/         # Zustand stores
    └── workers/           # Web Workers
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests for specific package
cd packages/pose-analysis-3d
npm test

# Run E2E tests
cd packages/fitness-coach-app
npm run test:e2e
```

---

## Building for Production

```bash
# Build all packages
npm run build

# Static export for GitHub Pages
cd packages/fitness-coach-app
npm run export

# Output in `out/` directory
```

---

## Key Technologies

- **Next.js 15+**: App Router, static export
- **MediaPipe Pose Heavy**: 3D landmark detection
- **TypeScript**: Strict type checking
- **Zustand**: State management
- **Tailwind CSS + shadcn/ui**: Styling
- **Web Speech API**: Text-to-speech
- **Canvas 2D**: Skeletal visualization

---

## Common Tasks

### Add New Exercise

1. Define exercise type in `packages/pose-analysis-3d/src/types/exercise.types.ts`
2. Create validator in `packages/pose-analysis-3d/src/exercises/[exercise]-validator.ts`
3. Add rep detection logic in `packages/coaching-engine/src/rep-counter/[exercise]-counter.ts`
4. Add exercise card to `packages/fitness-coach-app/app/workout/page.tsx`

### Adjust Form Thresholds

Edit thresholds in respective exercise validators:
```typescript
// packages/pose-analysis-3d/src/exercises/push-ups-validator.ts
const DEFAULT_THRESHOLDS = {
  minElbowBend: 90,        // degrees
  maxSpineCurvature: 15,   // degrees
  // ...
};
```

### Add Voice Feedback Phrase

Edit prompt library in `packages/coaching-engine/src/feedback/prompts.ts`:
```typescript
export const CORRECTIVE_PROMPTS = {
  // ...
  new_error: "Your new feedback message",
};
```

---

## Troubleshooting

**Camera not working**
- Check browser permissions (Settings → Privacy → Camera)
- Ensure no other app is using camera
- Try different browser

**Pose detection slow**
- Check GPU acceleration enabled (chrome://gpu)
- Close other heavy browser tabs
- Reduce video resolution in `CameraCapture` component

**TTS not working**
- Check browser supports Web Speech API
- Ensure volume is up
- Try different voice in settings

**Build errors**
- Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version: `node --version` (should be 18+)

---

## Performance Tips

- **GPU Acceleration**: Required for 30+ FPS
- **Web Worker**: Automatically handles pose processing
- **Bundle Size**: MediaPipe WASM (~6MB) loaded dynamically
- **Caching**: Browser caches WASM after first load

---

## Next Steps

1. **Implement Phase 1**: Set up monorepo structure
2. **Implement Phase 2**: Build pose-analysis-3d package
3. **Implement Phase 3**: Build coaching-engine package
4. **Implement Phase 4**: Build fitness-coach-app UI
5. **Testing**: Write unit/integration/E2E tests
6. **Deploy**: Static export to GitHub Pages

See `tasks.md` for detailed implementation tasks (generated via `/speckit.tasks`).

---

**Document Status**: Complete | **Last Updated**: 2025-10-20
