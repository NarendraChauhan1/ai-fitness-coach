import { FeedbackPrompt, Severity, TTSStatus } from '../types';

/**
 * Voice coach configuration
 */
export interface VoiceCoachConfig {
  /** Voice selection (default: first available) */
  voiceName?: string;

  /** Speech rate (0.1-10, default: 1.0) */
  rate?: number;

  /** Pitch (0-2, default: 1.0) */
  pitch?: number;

  /** Volume (0-1, default: 1.0) */
  volume?: number;

  /** Max queue size (default: 3) */
  maxQueueSize?: number;
}

/**
 * Voice coach for TTS delivery
 */
export class VoiceCoach {
  private speechSynthesis: SpeechSynthesis | null = null;
  private queue: FeedbackPrompt[] = [];
  private currentSpeech: SpeechSynthesisUtterance | null = null;
  private speaking = false;
  private config: Required<VoiceCoachConfig>;
  private lastSpeakTime = 0;
  private readonly MIN_SPEAK_INTERVAL_MS = 200; // 200ms minimum between messages

  constructor(config: VoiceCoachConfig = {}) {
    this.config = {
      voiceName: '',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      maxQueueSize: 3,
      ...config,
    };

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
    } else {
      console.warn('Web Speech API not supported');
    }
  }

  /**
   * Speak feedback prompt
   */
  async speak(feedback: FeedbackPrompt): Promise<void> {
    if (!this.speechSynthesis) {
      feedback.ttsStatus = TTSStatus.FAILED;
      return;
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(feedback.message);
      utterance.rate = this.config.rate;
      utterance.pitch = this.config.pitch;
      utterance.volume = this.config.volume;

      // Select voice
      if (this.config.voiceName) {
        const voices = this.speechSynthesis!.getVoices();
        const voice = voices.find((v) => v.name === this.config.voiceName);
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.onstart = () => {
        feedback.ttsStatus = TTSStatus.SPEAKING;
        this.speaking = true;
        this.currentSpeech = utterance;
      };

      utterance.onend = () => {
        feedback.ttsStatus = TTSStatus.COMPLETED;
        this.speaking = false;
        this.currentSpeech = null;
        this.processQueue();
        resolve();
      };

      utterance.onerror = (error) => {
        feedback.ttsStatus = TTSStatus.FAILED;
        this.speaking = false;
        this.currentSpeech = null;
        reject(error);
      };

      this.speechSynthesis!.speak(utterance);
    });
  }

  /**
   * Queue feedback items with prioritization
   */
  queueFeedback(feedbackList: FeedbackPrompt[]): void {
    for (const feedback of feedbackList) {
      // Always queue critical feedback
      if (feedback.severity === Severity.CRITICAL) {
        this.queue.unshift(feedback); // Add to front
        continue;
      }

      // Check queue capacity
      if (this.queue.length >= this.config.maxQueueSize) {
        // Queue full - skip low priority items
        if (
          feedback.severity === Severity.INFO ||
          feedback.severity === Severity.NORMAL
        ) {
          feedback.ttsStatus = TTSStatus.SKIPPED;
          continue;
        }
      }

      // Add to queue based on priority
      if (feedback.severity === Severity.HIGH) {
        // Insert after critical items
        const firstNormalIndex = this.queue.findIndex(
          (f) => f.severity !== Severity.CRITICAL
        );
        if (firstNormalIndex === -1) {
          this.queue.push(feedback);
        } else {
          this.queue.splice(firstNormalIndex, 0, feedback);
        }
      } else {
        // Normal and info go to end
        this.queue.push(feedback);
      }
    }

    // Start processing queue if not already speaking
    if (!this.speaking) {
      this.processQueue();
    }
  }

  /**
   * Process next item in queue with debouncing
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0 || this.speaking) {
      return;
    }

    // Enforce minimum interval between messages
    const now = Date.now();
    const timeSinceLastSpeak = now - this.lastSpeakTime;
    
    if (timeSinceLastSpeak < this.MIN_SPEAK_INTERVAL_MS) {
      // Schedule next attempt after minimum interval
      setTimeout(() => this.processQueue(), this.MIN_SPEAK_INTERVAL_MS - timeSinceLastSpeak);
      return;
    }

    const nextFeedback = this.queue.shift();
    if (nextFeedback) {
      try {
        this.lastSpeakTime = Date.now();
        await this.speak(nextFeedback);
      } catch (error) {
        console.error('TTS error:', error);
      }
    }
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
      this.speaking = false;
      this.currentSpeech = null;
    }
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    this.queue = [];
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.speaking;
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }
}
