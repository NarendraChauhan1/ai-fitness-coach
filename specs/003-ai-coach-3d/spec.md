# Feature Specification: AI 3D Fitness Coach

**Feature Branch**: `003-ai-coach-3d`  
**Created**: 2025-10-20  
**Status**: Draft  
**Input**: User description: " Build an AI fitness coach that replaces human trainers by providing real-time 3D form correction and guidance. Uses device camera to track body movements in 3D space (XYZ coordinates) with skeletal overlay. MediaPipe Pose provides 33 landmark points but we only need core body landmarks: shoulders (11, 12), elbows (13, 14), wrists (15, 16), hips (23, 24), knees (25, 26), ankles (27, 28). Remove face landmarks (0-10), hand detail landmarks (17-22), and foot detail landmarks (29-32) as they're unnecessary for exercise coaching. Use MediaPipe's 3D body pose estimation pipeline to track full XYZ coordinates, not just 2D, for accurate depth perception and form analysis. Supports 3 exercises initially: Marching, Jumping Jacks, Push-ups. The app acts as a complete coach by: counting reps with voice feedback, analyzing form in real-time using 3D pose data, detecting incorrect posture or technique in 3D space, providing immediate corrective feedback (voice + visual cues like \"Lower your back\" or \"Bend elbows more\"), demonstrating proper form, tracking workout sessions and progress, motivating users during exercises, and preventing injuries by catching bad form. Must work for fitness training, yoga instruction, and general exercise coaching. Maintains & processes everything locally, works on mobile/desktop, and provides the comprehensive guidance a human trainer would give."

## Clarifications

### Session 2025-10-20

- Q: Should workout sessions be stored locally? → A: No session storage.
- Q: Which MediaPipe variant powers pose detection? → A: MediaPipe Pose Heavy variant only.
- Q: How is corrective voice feedback delivered? → A: Predefined text prompts rendered via browser native text-to-speech.
- Q: How is the monorepo structured? → A: Managed with npm workspaces across all packages.
- Q: What visualization layer should render the skeletal overlay? → A: Canvas 2D with depth-aware color coding.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real-time 3D Coaching (Priority: P1)

As a fitness trainee, I want the coach to analyze my movement via the device camera and correct my form instantly so I can exercise safely and effectively without a human trainer.

**Why this priority**: Real-time guidance is the core value proposition and must work flawlessly before other capabilities.

**Independent Test**: Can be fully tested by running sample workout sessions and verifying form detection, corrective feedback, and rep counting for each supported exercise.

**Acceptance Scenarios**:

1. **Given** the camera is capturing the trainee, **When** they perform marching, jumping jacks, or push-ups, **Then** the coach must overlay a skeletal model using only required landmarks and update in real time with depth awareness.
2. **Given** the trainee deviates from proper form, **When** the system detects posture errors, **Then** it must deliver immediate voice and visual instructions to correct technique.

### User Story 2 - In-Session Motivation (Priority: P2)

As a trainee, I want the coach to deliver motivational prompts and live metrics during the workout so I stay engaged without needing historical storage.

**Why this priority**: Real-time encouragement and visibility into current performance maintain motivation while honoring the decision to avoid persistent storage.

**Independent Test**: Can be tested by completing sample sessions and verifying that live metrics update, voice prompts trigger appropriately, and all data clears once the workout ends.

**Acceptance Scenarios**:

1. **Given** a workout session, **When** the trainee completes reps, **Then** the system must count reps with voice confirmation and display transient metrics that reset after the session.
2. **Given** the trainee is midway through a set, **When** fatigue indicators appear, **Then** the coach must issue motivational feedback without relying on stored session history.

### User Story 3 - Multi-Discipline Support (Priority: P3)

As a trainee practicing fitness, yoga, or general exercise routines, I want the coach to adapt guidance to different disciplines so I can rely on one tool for varied training needs.

**Why this priority**: Supporting multiple disciplines supports broader adoption and reflects the requirement to replace human trainers.

**Independent Test**: Can be tested by mapping pose landmarks to discipline-specific form rules and verifying tailored feedback for each exercise type.

**Acceptance Scenarios**:

1. **Given** a selected training mode (fitness, yoga, general exercise), **When** the trainee performs movements, **Then** the coach must apply discipline-specific form thresholds and feedback.
2. **Given** new exercises are introduced, **When** the coach processes pose data, **Then** it must reuse the landmark pipeline and progressive enhancement approach to deliver guidance without regressions.

### Edge Cases

- Limited lighting conditions reduce landmark confidence: system degrades gracefully with visual warnings and suggests improved lighting.
- Trainee moves partially out of frame: system pauses rep counting until full body re-enters view and notifies user.
- Device thermal throttling lowers frame rate: system switches to lower frequency analysis while maintaining safety alerts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST capture live video from device cameras and process frames locally without transmitting data externally.
- **FR-002**: System MUST use the MediaPipe Pose Heavy variant for 3D pose estimation with skeletal overlay showing only the specified core landmarks (shoulders, elbows, wrists, hips, knees, ankles).
- **FR-003**: System MUST ingest MediaPipe Pose or equivalent 3D landmark output and ignore face, hand detail, and foot detail landmarks.
- **FR-004**: System MUST compute XYZ coordinates for each core landmark at a minimum frame rate that supports real-time feedback (≥30 FPS on target devices).
- **FR-005**: System MUST classify supported exercises (marching, jumping jacks, push-ups) and detect reps using landmark trajectories.
- **FR-006**: System MUST provide immediate corrective feedback via predefined text prompts rendered through browser-native text-to-speech and synchronized on-screen visual cues when posture deviations exceed defined thresholds.
- **FR-007**: System MUST demonstrate proper form for each supported exercise through animated skeletal sequences or recorded samples prior to the workout.
- **FR-008**: System MUST present live session metrics including reps, duration, error counts, and difficulty level without persisting data after the session ends.
- **FR-009**: System MUST provide motivational prompts based on progress, fatigue indicators, or rep streaks detected during the session.
- **FR-010**: System MUST prevent injuries by detecting high-risk movements (e.g., excessive lumbar curvature, knee valgus) and issuing urgent warnings.
- **FR-011**: System MUST operate effectively on mobile and desktop devices with responsive UI layouts and sensor access permissions.
- **FR-012**: System MUST render the skeletal overlay using a Canvas 2D layer with depth-aware color coding while supporting additional training modes (fitness, yoga, general exercise) by applying discipline-specific posture rules via the same landmark pipeline.

### Key Entities *(include if feature involves data)*

- **PoseFrame**: Represents a single timestamped set of XYZ landmarks with metadata for confidence scores and detected exercise state.
- **ExerciseSession**: Captures transient session context including selected discipline, exercise list, live rep counts, feedback events, and motivational cues, all cleared when the workout ends.
- **RepEvent**: Logs an individual repetition with start/end frames, correctness score, and associated feedback delivered.
- **FeedbackPrompt**: Defines corrective or motivational messages, associated trigger conditions, modality (voice, visual), and severity level.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Real-time pose tracking maintains ≥90% landmark confidence for core points and delivers feedback latency ≤200ms during supported exercises.
- **SC-002**: Rep counting accuracy achieves ≤5% error rate across marching, jumping jacks, and push-ups in lab validation.
- **SC-003**: Corrective feedback reduces detected posture deviations by ≥75% within three prompts during usability tests.
- **SC-004**: 85% of pilot users report equal or higher confidence compared to sessions with human trainers after four weeks of use.
- **SC-005**: Application sustains continuous local processing for 30-minute sessions on reference mobile and desktop hardware without thermal throttling or frame drops below 25 FPS.

## Assumptions

- Target devices provide camera access, microphone support for voice output, and sufficient GPU/CPU resources for 3D pose estimation.
- MediaPipe Pose or equivalent pipeline can be adapted to exclude unused landmarks without degrading performance.
- Users consent to local processing of workout data without long-term storage.
- Additional exercises and disciplines will reuse the core architecture and can be added via configuration updates.
- Monorepo packages (`pose-analysis-3d`, `coaching-engine`, `fitness-coach-app`) are managed with npm workspaces.
