# Implementation Tasks: AI 3D Fitness Coach

**Feature**: AI 3D Fitness Coach | **Branch**: `003-ai-coach-3d` | **Date**: 2025-10-20

---

## Overview

This document breaks down the implementation into executable tasks organized by user story priority. Each phase represents a complete, independently testable increment.

**Total Tasks**: 68  
**User Stories**: 3 (P1, P2, P3)  
**Parallel Opportunities**: 24 tasks marked with [P]

---

## Implementation Strategy

### MVP Scope (Recommended First Delivery)
**User Story 1 only** - Real-time 3D Coaching with single exercise (push-ups)
- Delivers core value: pose detection + form correction + voice feedback
- Estimated: ~2-3 weeks for solo developer
- Validates technical approach before expanding

### Incremental Delivery
1. **Phase 1-2**: Setup + Foundational (all stories depend on this)
2. **Phase 3**: User Story 1 - Core coaching for push-ups
3. **Phase 4**: User Story 2 - Add motivation + metrics
4. **Phase 5**: User Story 3 - Add remaining exercises + disciplines
5. **Phase 6**: Polish + optimization

---

## Dependencies & Execution Order

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational - blocking for all stories)
    ↓
    ├→ Phase 3: User Story 1 (P1) - INDEPENDENT
    ├→ Phase 4: User Story 2 (P2) - Depends on US1
    └→ Phase 5: User Story 3 (P3) - INDEPENDENT (can parallel with US2)
    ↓
Phase 6 (Polish)
```

### Parallel Execution Opportunities

**Within User Story 1** (after foundational tasks complete):
- T018, T019, T020 (geometry utils) can run in parallel
- T023, T024, T025 (exercise validators) can run in parallel  
- T034, T035 (camera + overlay) can run in parallel
- T039, T040, T041 (UI components) can run in parallel

**Within User Story 2**:
- T047, T048, T049 (motivation engine tasks) can run in parallel

**Within User Story 3**:
- T053, T054 (exercise validators) can run in parallel
- T057, T058, T059 (discipline thresholds) can run in parallel

---

## Phase 1: Setup & Project Initialization

**Goal**: Establish monorepo structure and development environment

### Tasks

- [X] T001 Initialize npm workspace monorepo with root package.json at repository root
- [X] T002 Create packages/pose-analysis-3d package structure with src/, tests/, package.json, tsconfig.json
- [X] T003 Create packages/coaching-engine package structure with src/, tests/, package.json, tsconfig.json
- [X] T004 Create packages/fitness-coach-app Next.js application with app router structure
- [X] T005 Configure shared TypeScript config in root tsconfig.json with strict mode enabled
- [X] T006 Set up ESLint configuration in root .eslintrc.js with TypeScript rules
- [X] T007 Set up Prettier configuration in root .prettierrc for code formatting
- [X] T008 Install shared dependencies in root: TypeScript 5.x, ESLint, Prettier
- [X] T009 Configure Jest in packages/pose-analysis-3d/jest.config.js for unit testing
- [X] T010 Configure Jest + React Testing Library in packages/coaching-engine/jest.config.js
- [X] T011 Configure Playwright in packages/fitness-coach-app/playwright.config.ts for E2E tests
- [X] T012 Create .gitignore for node_modules, .next, dist, coverage
- [X] T013 Initialize git repository and create feature branch 003-ai-coach-3d

**Deliverable**: Fully scaffolded monorepo ready for development

---

## Phase 2: Foundational Layer (Blocking Prerequisites)

**Goal**: Build core infrastructure that all user stories depend on

### Core Types (pose-analysis-3d package)

- [X] T014 Define LandmarkID type enum in packages/pose-analysis-3d/src/types/pose.types.ts (12 landmark IDs: 11-16, 23-28)
- [X] T015 Define Landmark interface in packages/pose-analysis-3d/src/types/pose.types.ts (id, x, y, z, visibility)
- [X] T016 Define PoseFrame interface in packages/pose-analysis-3d/src/types/pose.types.ts (timestamp, landmarks, confidence, state)
- [X] T017 Define ExerciseType and Discipline enums in packages/pose-analysis-3d/src/types/exercise.types.ts

### Geometry Utilities (pose-analysis-3d package)

- [X] T018 [P] Implement calculateAngle function in packages/pose-analysis-3d/src/geometry/angle-calculator.ts (3-point angle in degrees)
- [X] T019 [P] Implement calculateDistance3D function in packages/pose-analysis-3d/src/geometry/distance-calculator.ts (3D Euclidean distance)
- [X] T020 [P] Implement calculateDepth function in packages/pose-analysis-3d/src/geometry/depth-calculator.ts (Z-axis difference)
- [X] T021 Implement smoothValue function in packages/pose-analysis-3d/src/geometry/smoothing.ts (moving average for 5 frames)
- [X] T022 Export all geometry utilities from packages/pose-analysis-3d/src/geometry/index.ts

### Core Types (coaching-engine package)

- [X] T026 Define FeedbackPrompt interface in packages/coaching-engine/src/types/feedback.types.ts (message, type, severity, modality)
- [X] T027 Define RepEvent interface in packages/coaching-engine/src/types/rep.types.ts (repNumber, startFrame, endFrame, correctnessScore)
- [X] T028 Define ExerciseSession interface in packages/coaching-engine/src/types/session.types.ts (id, exercise, repCount, formScore)
- [X] T029 Create predefined feedback prompts library in packages/coaching-engine/src/feedback/prompts.ts (~20 corrective phrases)

### Next.js App Foundation

- [X] T030 Configure next.config.js in packages/fitness-coach-app/ with output: 'export' for static generation
- [X] T031 Set up Tailwind CSS configuration in packages/fitness-coach-app/tailwind.config.js
- [X] T032 Create root layout in packages/fitness-coach-app/app/layout.tsx with global styles and metadata
- [X] T033 Install shadcn/ui dependencies and configure in packages/fitness-coach-app/components.json

**Deliverable**: Core types, geometry utilities, and app foundation ready for user story implementation

---

## Phase 3: User Story 1 - Real-time 3D Coaching (P1)

**User Story**: As a fitness trainee, I want the coach to analyze my movement via the device camera and correct my form instantly so I can exercise safely and effectively without a human trainer.

**Independent Test Criteria**: 
✅ Camera captures video and displays in UI  
✅ Skeletal overlay renders in real-time (30+ FPS)  
✅ Push-ups form validation detects errors  
✅ Voice + visual feedback delivered when form deviates  
✅ Reps counted accurately (≤5% error)

### MediaPipe Integration (pose-analysis-3d)

- [X] T023 [P] [US1] Implement PoseDetector class in packages/pose-analysis-3d/src/mediapipe/pose-detector.ts (MediaPipe Heavy initialization)
- [X] T024 [P] [US1] Implement detectPose method to process video frames and return PoseFrame with 12 filtered landmarks
- [X] T025 [P] [US1] Implement dispose method for cleanup and isReady check in PoseDetector

### Form Validation (pose-analysis-3d)

- [X] T036 [US1] Implement FormValidator class constructor in packages/pose-analysis-3d/src/exercises/form-validator.ts
- [X] T037 [US1] Implement validateForm method to analyze PoseFrame and return FormValidationResult with errors
- [X] T038 [US1] Implement push-ups validator in packages/pose-analysis-3d/src/exercises/push-ups-validator.ts (elbow angle, spine curvature, shoulder alignment)

### Rep Detection (pose-analysis-3d)

- [X] T042 [US1] Implement RepDetector class in packages/pose-analysis-3d/src/exercises/rep-detector.ts with state machine
- [X] T043 [US1] Implement processFrame method for push-ups rep detection (down → up cycle)
- [X] T044 [US1] Implement getState method to expose current rep phase and progress

### Feedback Generation (coaching-engine)

- [X] T045 [US1] Implement FeedbackGenerator class in packages/coaching-engine/src/feedback/feedback-generator.ts
- [X] T046 [US1] Implement generateFeedback method to create FeedbackPrompts from FormValidationResult with deduplication

### Voice Coaching (coaching-engine)

- [X] T050 [US1] Implement VoiceCoach class in packages/coaching-engine/src/voice/voice-coach.ts with Web Speech API
- [X] T051 [US1] Implement speak method with promise-based TTS delivery
- [X] T052 [US1] Implement queueFeedback with priority-based queue management (max 3 items)

### Rep Counting (coaching-engine)

- [X] T060 [US1] Implement RepCounter class in packages/coaching-engine/src/rep-counter/rep-counter.ts
- [X] T061 [US1] Implement processRep method with form score validation (min 50/100 to count)
- [X] T062 [US1] Implement getCurrentCount and getStatistics methods

### UI Components (fitness-coach-app)

- [X] T034 [P] [US1] Implement CameraCapture component in packages/fitness-coach-app/components/camera/camera-capture.tsx (getUserMedia integration)
- [X] T035 [P] [US1] Implement PoseOverlay component in packages/fitness-coach-app/components/pose-overlay/pose-overlay.tsx (Canvas 2D rendering at 30 FPS)
- [X] T039 [P] [US1] Implement FeedbackDisplay component in packages/fitness-coach-app/components/feedback-ui/feedback-display.tsx (animated messages)
- [X] T040 [P] [US1] Implement WorkoutControls component in packages/fitness-coach-app/components/feedback-ui/workout-controls.tsx (rep counter, timer, form score)
- [X] T041 [P] [US1] Implement ExerciseCard component in packages/fitness-coach-app/components/ui/exercise-card.tsx (selectable exercise option)

### State Management (fitness-coach-app)

- [X] T063 [US1] Create WorkoutStore with Zustand in packages/fitness-coach-app/lib/store/workout-store.ts (currentSession, startSession, endSession)
- [X] T064 [US1] Implement startSession action to create new ExerciseSession with transient state
- [X] T065 [US1] Implement addRep and addFeedback actions to update session in real-time
- [X] T066 [US1] Implement endSession action to clear all transient data

### Web Worker (fitness-coach-app)

- [X] T067 [US1] Create pose-processor worker in packages/fitness-coach-app/workers/pose-processor.ts
- [X] T068 [US1] Implement worker message handlers for INIT, PROCESS_FRAME, DISPOSE commands
- [X] T069 [US1] Integrate worker with CameraCapture using transferable ImageData objects

### Pages & Integration (fitness-coach-app)

- [X] T070 [US1] Create landing page in packages/fitness-coach-app/app/page.tsx with hero section and CTA
- [X] T071 [US1] Create exercise selection page in packages/fitness-coach-app/app/workout/page.tsx with push-ups exercise card
- [X] T072 [US1] Create live workout page in packages/fitness-coach-app/app/workout/[exercise]/page.tsx (client component)
- [X] T073 [US1] Integrate camera → worker → pose detection → form validation → feedback pipeline in workout page
- [X] T074 [US1] Implement skeletal overlay rendering with depth-aware color coding (red/green/yellow)
- [X] T075 [US1] Connect VoiceCoach to deliver TTS feedback when form errors detected
- [X] T076 [US1] Connect RepCounter to update UI and trigger voice confirmation on rep completion

**Deliverable**: Fully functional real-time coaching for push-ups with form correction and rep counting

---

## Phase 4: User Story 2 - In-Session Motivation (P2)

**User Story**: As a trainee, I want the coach to deliver motivational prompts and live metrics during the workout so I stay engaged without needing historical storage.

**Dependencies**: Requires User Story 1 (workout session infrastructure)

**Independent Test Criteria**:
✅ Motivational prompts trigger at 25%, 50%, 75%, 100% completion  
✅ Streak detection triggers encouragement (5+ good reps)  
✅ Live metrics (reps, duration, form score) update in real-time  
✅ All data clears when session ends

### Motivation Engine (coaching-engine)

- [X] T047 [P] [US2] Implement MotivationEngine class in packages/coaching-engine/src/motivation/motivation-engine.ts
- [X] T048 [P] [US2] Implement generateMotivation method to trigger prompts at milestone percentages
- [X] T049 [P] [US2] Implement checkMilestone method for rep streaks (5+ consecutive good form reps)

### UI Enhancements (fitness-coach-app)

- [X] T077 [US2] Add motivational message display to FeedbackDisplay component (distinct styling from corrections)
- [X] T078 [US2] Add circular progress indicator to WorkoutControls for form score visualization
- [X] T079 [US2] Add session timer with MM:SS format to WorkoutControls component
- [X] T080 [US2] Integrate MotivationEngine into workout page to trigger prompts based on session state

### Integration

- [X] T081 [US2] Connect motivation triggers to VoiceCoach queue (lower priority than corrective feedback)
- [X] T082 [US2] Update WorkoutStore to track rep streaks and milestone percentages
- [X] T083 [US2] Verify transient data clears on endSession (no data persists after workout)

**Deliverable**: Motivational coaching system with real-time engagement prompts

---

## Phase 5: User Story 3 - Multi-Discipline Support (P3)

**User Story**: As a trainee practicing fitness, yoga, or general exercise routines, I want the coach to adapt guidance to different disciplines so I can rely on one tool for varied training needs.

**Dependencies**: Independent of User Story 2 (can be developed in parallel)

**Independent Test Criteria**:
✅ Marching exercise validated with leg lift detection  
✅ Jumping jacks validated with arm/leg coordination  
✅ Yoga discipline applies relaxed thresholds  
✅ General discipline uses moderate thresholds  
✅ Form feedback adapts to selected discipline

### Additional Exercise Validators (pose-analysis-3d)

- [X] T053 [P] [US3] Implement marching validator in packages/pose-analysis-3d/src/exercises/marching-validator.ts (hip lift height, knee angle)
- [X] T054 [P] [US3] Implement jumping-jacks validator in packages/pose-analysis-3d/src/exercises/jumping-jacks-validator.ts (arm extension, leg spread)
- [X] T055 [US3] Implement exercise-specific rep detection for marching (left/right leg cycle)
- [X] T056 [US3] Implement exercise-specific rep detection for jumping jacks (open/close cycle)

### Discipline-Specific Thresholds (pose-analysis-3d)

- [X] T057 [P] [US3] Create discipline threshold configs in packages/pose-analysis-3d/src/exercises/discipline-thresholds.ts
- [X] T058 [P] [US3] Implement fitness thresholds (strict: 90° angles, 10° tolerance)
- [X] T059 [P] [US3] Implement yoga thresholds (relaxed: 80° angles, 15° tolerance) and general thresholds (moderate)

### UI Updates (fitness-coach-app)

- [X] T084 [US3] Add marching and jumping jacks ExerciseCards to workout selection page
- [X] T085 [US3] Add discipline selector (fitness/yoga/general) to workout selection page with radio buttons
- [X] T086 [US3] Pass selected discipline to WorkoutStore startSession action
- [X] T087 [US3] Update FormValidator to apply discipline-specific thresholds based on session context

### Integration

- [X] T088 [US3] Test marching exercise end-to-end (camera → detection → validation → feedback)
- [X] T089 [US3] Test jumping jacks exercise end-to-end
- [X] T090 [US3] Verify yoga discipline uses relaxed thresholds and provides gentler feedback
- [X] T091 [US3] Verify fitness discipline enforces strict form and provides detailed corrections

**Deliverable**: Support for 3 exercises (marching, jumping jacks, push-ups) and 3 disciplines (fitness, yoga, general)

---

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Optimize performance, handle edge cases, and prepare for production

### Error Handling & Edge Cases

- [X] T092 [P] Add camera permission error handling in CameraCapture component (PERMISSION_DENIED, NO_CAMERA_FOUND)
- [X] T093 [P] Add pose-not-detected handling in workout page (show "Move into frame" message)
- [X] T094 [P] Add low confidence warning in PoseOverlay (when average confidence < 0.7)
- [X] T095 Add thermal throttling detection and frame rate adjustment in workout page
- [X] T096 Add lighting quality assessment and warning display in workout page

### Performance Optimization

- [X] T097 [P] Implement dynamic import for MediaPipe WASM in pose-processor worker
- [X] T098 [P] Add React.memo to PoseOverlay component to prevent unnecessary re-renders
- [X] T099 [P] Implement debouncing for feedback delivery (min 200ms interval between same message)
- [X] T100 Optimize Canvas 2D rendering with requestAnimationFrame caching
- [X] T101 Add Web Worker error recovery and automatic restart on crash

### UI/UX Polish

- [ ] T102 [P] Add loading states to CameraCapture (spinner while initializing)
- [ ] T103 [P] Add loading state to workout page while MediaPipe initializes
- [ ] T104 [P] Implement Framer Motion page transitions between routes
- [ ] T105 Add exercise instruction modal before starting workout (demonstrate proper form)
- [ ] T106 Add pause/resume functionality to WorkoutControls component
- [ ] T107 Add confirmation dialog before ending session

### Accessibility

- [ ] T108 [P] Add ARIA labels to all interactive components (buttons, cards, controls)
- [ ] T109 [P] Ensure keyboard navigation works for exercise selection and controls
- [ ] T110 [P] Add focus indicators for all focusable elements
- [ ] T111 Add alt text for exercise thumbnails

### Build & Deployment

- [X] T112 Configure Next.js static export in packages/fitness-coach-app/next.config.js
- [X] T113 Add build scripts to root package.json (build:all, export)
- [ ] T114 Test production build and verify bundle size < 600KB gzipped (excluding MediaPipe)
- [X] T115 Create README.md with setup instructions and browser compatibility notes
- [ ] T116 Add GitHub Pages deployment workflow in .github/workflows/deploy.yml

**Deliverable**: Production-ready application with comprehensive error handling and optimal performance

---

## Testing Strategy (Optional - Not included in task list)

Tests are **not required** per the specification. However, if you want to implement tests, add these task groups after Phase 2:

### Unit Tests (pose-analysis-3d)
- Test geometry calculations with known inputs
- Test form validators with fixture pose data
- Test rep detection state machine

### Unit Tests (coaching-engine)
- Test feedback generation and deduplication
- Test voice queue prioritization
- Test motivation trigger logic

### Integration Tests (fitness-coach-app)
- Test camera → worker → pose detection pipeline
- Test pose → validation → feedback pipeline
- Mock MediaPipe output for consistent tests

### E2E Tests (Playwright)
- Test complete workout flow for each exercise
- Test discipline switching
- Test error states (camera denied, pose not detected)

---

## Progress Tracking

**Phase 1 (Setup)**: [X] 13/13 tasks complete (100%)  
**Phase 2 (Foundational)**: [X] 20/20 tasks complete (100%)  
**Phase 3 (User Story 1)**: [X] 44/44 tasks complete (100%)  
**Phase 4 (User Story 2)**: [X] 7/7 tasks complete (100%)  
**Phase 5 (User Story 3)**: [X] 9/9 tasks complete (100%)  
**Phase 6 (Polish)**: [ ] 10/25 tasks complete (40%)

**Overall Progress**: 103/118 tasks complete (87%)

---

## Validation Checklist

Before marking a task complete, verify:

- ✅ Code follows TypeScript strict mode (no `any` types)
- ✅ File paths match the project structure in plan.md
- ✅ Imports use correct package names (@ai-fitness-coach/*)
- ✅ Functions include JSDoc comments
- ✅ User Story tasks include [US1], [US2], or [US3] label
- ✅ Parallel tasks marked with [P] can truly run independently

---

**Document Status**: Ready for Implementation | **Last Updated**: 2025-10-20
