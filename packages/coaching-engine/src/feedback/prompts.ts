/**
 * Predefined corrective feedback phrases (~20 phrases)
 */
export const CORRECTIVE_PROMPTS = {
  // Knee corrections
  knee_valgus: 'Keep your knees out',
  knee_depth: 'Go lower',

  // Back corrections
  back_rounding: 'Straighten your back',
  lower_back_arch: 'Tighten your core',

  // Arm/shoulder corrections
  elbow_flaring: 'Tuck your elbows in',
  shoulder_hunch: 'Shoulders back and down',

  // Depth/range corrections
  shallow_depth: 'Deeper movement',
  incomplete_extension: 'Fully extend',

  // Asymmetry corrections
  asymmetric_left: 'Even out your left side',
  asymmetric_right: 'Even out your right side',

  // Positioning
  too_close: 'Step back from camera',
  too_far: 'Move closer to camera',
  neck_forward: 'Keep your neck neutral',

  // Timing
  too_fast: 'Slow down your tempo',
  too_slow: 'Pick up the pace',

  // General
  hold_position: 'Hold this position',
  good_form: 'Good form',
  reset_position: 'Reset your position',
} as const;

/**
 * Warning messages (~5 phrases)
 */
export const WARNING_PROMPTS = {
  unsafe_form: 'Stop! Unsafe form detected',
  injury_risk: 'Risk of injury, please adjust',
  take_break: 'Take a break if needed',
  check_form: 'Check your form',
  move_into_frame: 'Move back into frame',
} as const;

/**
 * Motivational messages (~10 phrases)
 */
export const MOTIVATIONAL_PROMPTS = {
  great_form: 'Great form! Keep it up!',
  doing_amazing: "You're doing amazing!",
  halfway: 'Halfway there! Stay strong!',
  perfect_technique: 'Perfect technique!',
  almost_done: 'Almost done! Finish strong!',
  excellent_work: 'Excellent work!',
  steady_pace: 'Nice steady pace!',
  form_improving: 'Your form is improving!',
  last_few: 'Last few reps! You got this!',
  session_complete: 'Session complete! Well done!',
} as const;

/**
 * Get prompt by key
 */
export function getPrompt(
  category: 'corrective' | 'warning' | 'motivational',
  key: string
): string {
  switch (category) {
    case 'corrective':
      return CORRECTIVE_PROMPTS[key as keyof typeof CORRECTIVE_PROMPTS] || key;
    case 'warning':
      return WARNING_PROMPTS[key as keyof typeof WARNING_PROMPTS] || key;
    case 'motivational':
      return MOTIVATIONAL_PROMPTS[key as keyof typeof MOTIVATIONAL_PROMPTS] || key;
    default:
      return key;
  }
}
