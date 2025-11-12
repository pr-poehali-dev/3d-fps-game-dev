class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private ambientSource: AudioBufferSourceNode | null = null;
  private masterGain: GainNode | null = null;

  async init() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = 0.3;

    await this.generateSounds();
  }

  private async generateSounds() {
    if (!this.audioContext) return;

    this.sounds.set('footstep', this.createFootstepSound());
    this.sounds.set('pickup', this.createPickupSound());
    this.sounds.set('ambient', this.createAmbientSound());
    this.sounds.set('flashlight', this.createFlashlightSound());
    this.sounds.set('heartbeat', this.createHeartbeatSound());
  }

  private createFootstepSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.15;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 20);
      data[i] = (Math.random() * 2 - 1) * 0.3 * envelope;
    }

    return buffer;
  }

  private createPickupSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.3;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const freq = 800 + 400 * t;
      const envelope = Math.exp(-t * 5);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.2;
    }

    return buffer;
  }

  private createAmbientSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 10;
    const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        let value = 0;
        value += Math.sin(2 * Math.PI * 60 * t) * 0.03;
        value += Math.sin(2 * Math.PI * 80 * t) * 0.02;
        value += (Math.random() * 2 - 1) * 0.01;
        
        if (Math.random() < 0.0001) {
          value += (Math.random() * 2 - 1) * 0.1;
        }
        
        data[i] = value;
      }
    }

    return buffer;
  }

  private createFlashlightSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.1;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 30);
      data[i] = Math.sin(2 * Math.PI * 200 * t) * envelope * 0.15;
    }

    return buffer;
  }

  private createHeartbeatSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.8;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const beat1 = t < 0.15 ? Math.sin(2 * Math.PI * 60 * t) * Math.exp(-t * 20) : 0;
      const beat2 = t > 0.2 && t < 0.35 ? Math.sin(2 * Math.PI * 60 * (t - 0.2)) * Math.exp(-(t - 0.2) * 20) * 0.7 : 0;
      data[i] = (beat1 + beat2) * 0.3;
    }

    return buffer;
  }

  playSound(soundName: string, volume = 1.0) {
    if (!this.audioContext || !this.masterGain) return;

    const buffer = this.sounds.get(soundName);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    source.start(0);
    this.activeSources.add(source);
    
    source.onended = () => {
      this.activeSources.delete(source);
    };
  }

  startAmbient() {
    if (!this.audioContext || !this.masterGain || this.ambientSource) return;

    const buffer = this.sounds.get('ambient');
    if (!buffer) return;

    this.ambientSource = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    this.ambientSource.buffer = buffer;
    this.ambientSource.loop = true;
    gainNode.gain.value = 0.5;
    
    this.ambientSource.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    this.ambientSource.start(0);
  }

  stopAmbient() {
    if (this.ambientSource) {
      this.ambientSource.stop();
      this.ambientSource = null;
    }
  }

  playHeartbeat(health: number) {
    if (health < 30) {
      this.playSound('heartbeat', 1.0);
    }
  }

  stopAll() {
    this.activeSources.forEach(source => source.stop());
    this.activeSources.clear();
    this.stopAmbient();
  }
}

export const soundManager = new SoundManager();
