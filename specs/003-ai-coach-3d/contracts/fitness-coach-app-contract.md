# Contract: fitness-coach-app Package

**Package**: `@ai-fitness-coach/fitness-coach-app`  
**Version**: 1.0.0  
**Purpose**: Main Next.js application with UI and workout orchestration

---

## Routes

- `/` - Landing page (Server Component)
- `/workout` - Exercise selection (Server Component)
- `/workout/[exercise]` - Live workout session (Client Component)
- `/about` - Instructions (Server Component)

---

## Key Components

### CameraCapture
- Accesses device camera
- Provides HTMLVideoElement to pose detector
- Handles permissions and errors

### PoseOverlay
- Canvas 2D rendering at 30+ FPS
- Draws 11 skeletal connections
- Color-codes by depth (red/green/yellow)

### FeedbackDisplay
- Shows visual feedback messages
- Color-coded by severity
- Animated with Framer Motion

### WorkoutControls
- Rep counter, timer, form score
- Pause/Resume and End Session buttons

---

## State Management (Zustand)

```typescript
interface WorkoutStore {
  currentSession: ExerciseSession | null;
  startSession: (exercise, discipline, targetReps) => void;
  updateSession: (updates) => void;
  addRep: (rep: RepEvent) => void;
  endSession: () => void;
}
```

---

## Web Worker

`pose-processor.ts` - Offloads MediaPipe processing to prevent UI blocking

---

**Contract Version**: 1.0.0 | **Last Updated**: 2025-10-20
