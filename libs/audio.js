const AudioEngine = {
    ctx: null,
    enabled: true,

    init() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.enabled = localStorage.getItem('sound-enabled') !== 'false';
        } catch (e) { console.error('Audio Init Failed', e); }
    },

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('sound-enabled', this.enabled);
        return this.enabled;
    },

    play(type) {
        if (!this.enabled || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);

        const playOsc = (freq, startTime, duration, type = 'sine', decay = true) => {
            const osc = this.ctx.createOscillator();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);
            osc.connect(gain);

            if (decay) {
                gain.gain.setValueAtTime(0.1, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            } else {
                gain.gain.setValueAtTime(0.1, startTime);
                gain.gain.setValueAtTime(0.1, startTime + duration - 0.05);
                gain.gain.linearRampToValueAtTime(0, startTime + duration);
            }

            osc.start(startTime);
            osc.stop(startTime + duration);
            return osc;
        };

        switch (type) {
            case 'connect': // Sci-fi Rising "Link"
                const oscC = this.ctx.createOscillator();
                oscC.type = 'sine';
                oscC.frequency.setValueAtTime(220, now);
                oscC.frequency.exponentialRampToValueAtTime(880, now + 0.4);
                oscC.connect(gain);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                oscC.start(now);
                oscC.stop(now + 0.4);
                break;

            case 'message': // Soft "Pop"
                playOsc(600, now, 0.1, 'triangle');
                break;

            case 'success': // Happy "Chime"
                playOsc(523.25, now, 0.2); // C5
                playOsc(659.25, now + 0.1, 0.2); // E5
                playOsc(783.99, now + 0.2, 0.4); // G5
                break;

            case 'nav': // Subtle "Click"
                playOsc(800, now, 0.05, 'sine');
                break;

            case 'error': // Low "Buh-buh"
                playOsc(150, now, 0.2, 'square');
                playOsc(110, now + 0.15, 0.3, 'square');
                break;

            case 'notify': // High "Ping"
                playOsc(900, now, 0.15, 'sine');
                playOsc(1200, now + 0.08, 0.2, 'sine');
                break;

            case 'send': // Rising "Swoosh"
                const oscS = this.ctx.createOscillator();
                oscS.frequency.setValueAtTime(200, now);
                oscS.frequency.exponentialRampToValueAtTime(1000, now + 0.3);
                oscS.connect(gain);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.3);
                oscS.start(now);
                oscS.stop(now + 0.3);
                break;

            case 'copied': // Short high "Blip"
                playOsc(1500, now, 0.05, 'sine');
                break;
        }
    }
};
