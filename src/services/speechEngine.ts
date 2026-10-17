/**
 * Offline & Local Speech Engine for WhisperFlow
 * Handles microphone capture, Web Audio visualizer,
 * verbal punctuation parsing, and Web Speech API.
 */

// Voice punctuation rules
export function formatSpokenPunctuation(text: string, enableSmartCaps = true): string {
  let formatted = text;

  const punctuationMap: [RegExp, string][] = [
    [/\b(new paragraph)\b/gi, '\n\n'],
    [/\b(new line|next line)\b/gi, '\n'],
    [/\b(period|full stop)\b/gi, '.'],
    [/\b(comma)\b/gi, ','],
    [/\b(question mark)\b/gi, '?'],
    [/\b(exclamation mark|exclamation point)\b/gi, '!'],
    [/\b(colon)\b/gi, ':'],
    [/\b(semicolon)\b/gi, ';'],
    [/\b(open quote|open quotation)\b/gi, ' "'],
    [/\b(close quote|close quotation)\b/gi, '" '],
    [/\b(dash|hyphen)\b/gi, ' - '],
    [/\b(ellipsis|dot dot dot)\b/gi, '...'],
    [/\b(smiley face)\b/gi, ' 😊 '],
  ];

  for (const [regex, replacement] of punctuationMap) {
    formatted = formatted.replace(regex, replacement);
  }

  // Clean spacing around punctuation marks
  formatted = formatted
    .replace(/\s+([.,!?:;])/g, '$1') // remove space before punctuation
    .replace(/([.,!?:;])(?=[A-Za-z])/g, '$1 ') // ensure space after punctuation if missing
    .replace(/[ ]{2,}/g, ' '); // collapse double spaces

  // Smart capitalization
  if (enableSmartCaps && formatted.length > 0) {
    // Capitalize first letter
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    // Capitalize after periods, question marks, exclamation marks, and newlines
    formatted = formatted.replace(/([.!?\n]\s*)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  }

  return formatted;
}

export class SpeechAudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private recognition: any = null;
  private isListening = false;
  private onTranscriptCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onAudioLevelCallback: ((level: number) => void) | null = null;
  private animFrameId: number | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript;
            } else {
              interim += transcript;
            }
          }

          if (this.onTranscriptCallback) {
            const outputText = final || interim;
            const parsed = formatSpokenPunctuation(outputText);
            this.onTranscriptCallback(parsed, Boolean(final));
          }
        };

        rec.onerror = (err: any) => {
          console.warn('SpeechRecognition error:', err);
        };

        this.recognition = rec;
      } catch (e) {
        console.warn('Web Speech API could not be instantiated:', e);
      }
    }
  }

  public isWebSpeechSupported(): boolean {
    return Boolean(this.recognition);
  }

  public async start(
    onTranscript: (text: string, isFinal: boolean) => void,
    onAudioLevel?: (level: number) => void
  ): Promise<boolean> {
    if (this.isListening) return true;

    this.onTranscriptCallback = onTranscript;
    this.onAudioLevelCallback = onAudioLevel || null;

    // Play subtle start earcon tone
    this.playEarcon(520, 680, 0.08);

    try {
      // 1. Request microphone stream for live soundwave visualizer
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      this.monitorAudioLevel();

      // 2. Start speech recognizer if supported
      if (this.recognition) {
        try {
          this.recognition.start();
        } catch (recErr) {
          console.log('Recognition already active or restart required', recErr);
        }
      }

      this.isListening = true;
      return true;
    } catch (err) {
      console.warn('Microphone permission not granted or audio error:', err);
      // Fallback: Still mark as listening so simulated test speech can run
      this.isListening = true;
      this.simulateAudioLevels();
      return false;
    }
  }

  public stop(): void {
    if (!this.isListening) return;

    this.isListening = false;

    // Play subtle stop earcon tone
    this.playEarcon(680, 440, 0.08);

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    if (this.onAudioLevelCallback) {
      this.onAudioLevelCallback(0);
    }
  }

  private monitorAudioLevel() {
    if (!this.analyser || !this.isListening) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const update = () => {
      if (!this.isListening || !this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalized = Math.min(1, average / 128);

      if (this.onAudioLevelCallback) {
        this.onAudioLevelCallback(normalized);
      }

      this.animFrameId = requestAnimationFrame(update);
    };

    this.animFrameId = requestAnimationFrame(update);
  }

  private simulateAudioLevels() {
    let t = 0;
    const sim = () => {
      if (!this.isListening) return;
      t += 0.2;
      const level = 0.2 + Math.abs(Math.sin(t)) * 0.6;
      if (this.onAudioLevelCallback) {
        this.onAudioLevelCallback(level);
      }
      this.animFrameId = requestAnimationFrame(sim);
    };
    this.animFrameId = requestAnimationFrame(sim);
  }

  /**
   * Generates a warm, professional sound-design earcon
   */
  private playEarcon(freq1: number, freq2: number, duration: number) {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq1, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq2, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy catch
    }
  }
}

export const speechAudioEngine = new SpeechAudioEngine();
