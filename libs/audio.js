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

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime;

        switch (type) {
            case 'connect': // Sci-fi Rising "Link"
                osc.type = 'sine';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;

            case 'message': // Soft "Pop"
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(500, now);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;

            case 'success': // Happy "Chime"
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
                osc.start(now);
                osc.stop(now + 0.6);
                break;

            case 'nav': // Subtle "Click"
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.02, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
        }
    }
};
