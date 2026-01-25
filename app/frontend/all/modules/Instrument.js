const NOTE_OFFSETS = {
    "C": 0, "C#": 1, "Db": 1,
    "D": 2, "D#": 3, "Eb": 3,
    "E": 4, "Fb": 4, "E#": 5, "F": 5,
    "F#": 6, "Gb": 6,
    "G": 7, "G#": 8, "Ab": 8,
    "A": 9, "A#": 10, "Bb": 10,
    "B": 11, "Cb": 11
};

const CHROMATIC = {
    sharps: ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],
    flats:  ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"]
};

const SCALE_STEPS = {
    major: [2, 2, 1, 2, 2, 2, 1],
    minor: [2, 1, 2, 2, 1, 2, 2]
};

function noteToFrequency(note, octave = 4) {
    const offset = NOTE_OFFSETS[note];
    if (offset === undefined) throw new Error(`Invalid note: ${note}`);
    const noteIndex = octave * 12 + offset;
    return 440 * Math.pow(2, (noteIndex - (4*12 + 9)) / 12);
}

class AudioMixer {
    constructor(audioCtx, options = {}) {
        this.audioCtx = audioCtx;
        this.options = {
            volume: 0.2,          // base volume (0-1)
            type: "sine",         // oscillator type
            noteSustain: 0.2,     // fade-out duration in seconds
            punch: 0.2,           // initial attack boost
            punchTime: 0.05,      // punch duration
            tuneRange: 0.002,     // random pitch variation per layer
            detune: 0,            // detune in cents
            vibratoDepth: 0.005,   // % of frequency, e.g., 0.01 = ±1%
            vibratoRate: 4,       // cycles per second
            filterType: "lowpass",// filter type
            filterFreq: 2000,     // filter cutoff in Hz
            pan: 0,               // stereo pan (-1 to 1)
            layers: 1,            // number of oscillators to layer
            octaveShift: 0,       // shift in octaves (-1, 0, 1, etc.)
            ...options
        };
    }

    playNote(note, octave = 4, duration = 0.3) {
        if (!note) return Promise.resolve();

        const { volume, type, noteSustain, punch, punchTime, tuneRange, detune, vibratoDepth, vibratoRate, filterType, filterFreq, pan, layers, octaveShift } = this.options;

        const promises = [];

        for (let i = 0; i < layers; i++) {
            promises.push(new Promise(resolve => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                const filter = this.audioCtx.createBiquadFilter();
                const panner = this.audioCtx.createStereoPanner();

                // slight detune per layer
                const layerDetune = detune + (Math.random() - 0.5) * 5; // ±5 cents

                // calculate frequency with octave shift
                const baseFreq = noteToFrequency(note, octave);
                const layerFreq = baseFreq * Math.pow(2, octaveShift) * (1 + (Math.random() - 0.5) * tuneRange * 2);

                osc.type = type;
                osc.frequency.value = layerFreq;
                osc.detune.value = layerDetune;

                // filter
                filter.type = filterType;
                filter.frequency.value = filterFreq;

                // pan
                panner.pan.setValueAtTime(pan, this.audioCtx.currentTime);

                // gain & punch
                gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
                if (punch > 0) {
                    gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
                    gain.gain.linearRampToValueAtTime(volume + punch, this.audioCtx.currentTime + punchTime);
                    gain.gain.linearRampToValueAtTime(volume, this.audioCtx.currentTime + punchTime * 2);
                }

                // vibrato using % of frequency
                if (vibratoDepth > 0) {
                    const vibratoOsc = this.audioCtx.createOscillator();
                    const vibratoGain = this.audioCtx.createGain();
                    vibratoGain.gain.value = layerFreq * vibratoDepth; // proportional to frequency
                    vibratoOsc.frequency.value = vibratoRate;
                    vibratoOsc.connect(vibratoGain);
                    vibratoGain.connect(osc.frequency);
                    vibratoOsc.start();
                    vibratoOsc.stop(this.audioCtx.currentTime + duration + noteSustain);
                }

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(panner);
                panner.connect(this.audioCtx.destination);

                osc.start();

                if (noteSustain > 0) {
                    const fadeStart = this.audioCtx.currentTime + duration;
                    gain.gain.setValueAtTime(volume, fadeStart);
                    gain.gain.linearRampToValueAtTime(0, fadeStart + noteSustain);
                    osc.stop(fadeStart + noteSustain);
                    setTimeout(resolve, duration * 1000); // resolve after initial duration
                } else {
                    osc.onended = resolve;
                    osc.stop(this.audioCtx.currentTime + duration);
                }
            }));
        }

        return Promise.all(promises);
    }
}




class Instrument {
    constructor(audioCtx, mixerOptions = {}) {
        this.mixer = new AudioMixer(audioCtx, mixerOptions);
    }

    playNote(note, octave = 4, duration = 0.3) {
        return this.mixer.playNote(note, octave, duration);
    }

    playChord(notes, octave = 4, duration = 0.3) {
        return Promise.all(notes.map(note => this.mixer.playNote(note, octave, duration)));
    }

    async playScale(rootNote, scaleType, octave = 4, duration = 0.3) {
        const steps = SCALE_STEPS[scaleType];
        if (!steps) throw new Error(`Invalid scale type: ${scaleType}`);

        const useFlats = rootNote.includes("b");
        const chromatic = useFlats ? CHROMATIC.flats : CHROMATIC.sharps;

        let index = NOTE_OFFSETS[rootNote];
        let currentOctave = octave;

        await this.mixer.playNote(chromatic[index], currentOctave, duration);

        for (const step of steps) {
            const prevIndex = index;
            index = (index + step) % 12;
            if (index <= prevIndex) currentOctave++;
            await this.mixer.playNote(chromatic[index], currentOctave, duration);
        }
    }
}


export default Instrument;
