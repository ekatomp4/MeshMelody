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

        this.defaults = {
            volume: 0.2,
            type: "sine",
            noteSustain: 0.2,
            punch: 0,
            punchTime: 0.05,
            tuneRange: 0,
            detune: 0,
            vibratoDepth: 0,
            vibratoRate: 0,
            filterType: "lowpass",
            filterFreq: 2000,
            pan: 0,
            octaveShift: 0
        };

        this.oscillators = options.oscillators || [{}];
    }

    playNote(note, octave = 4, duration = 0.3) {
        if (!note) return Promise.resolve();

        const promises = [];

        for (const oscOpts of this.oscillators) {
            const o = { ...this.defaults, ...oscOpts };

            promises.push(new Promise(resolve => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                const filter = this.audioCtx.createBiquadFilter();
                const panner = this.audioCtx.createStereoPanner();

                const baseFreq = noteToFrequency(note, octave);
                const freq =
                    baseFreq *
                    Math.pow(2, o.octaveShift) *
                    (1 + (Math.random() - 0.5) * o.tuneRange * 2);

                osc.type = o.type;
                osc.frequency.value = freq;
                osc.detune.value = o.detune;

                filter.type = o.filterType;
                filter.frequency.value = o.filterFreq;

                panner.pan.value = o.pan;

                gain.gain.setValueAtTime(o.volume, this.audioCtx.currentTime);

                if (o.punch > 0) {
                    gain.gain.linearRampToValueAtTime(
                        o.volume + o.punch,
                        this.audioCtx.currentTime + o.punchTime
                    );
                    gain.gain.linearRampToValueAtTime(
                        o.volume,
                        this.audioCtx.currentTime + o.punchTime * 2
                    );
                }

                if (o.vibratoDepth > 0) {
                    const vibOsc = this.audioCtx.createOscillator();
                    const vibGain = this.audioCtx.createGain();

                    vibGain.gain.value = freq * o.vibratoDepth;
                    vibOsc.frequency.value = o.vibratoRate;

                    vibOsc.connect(vibGain);
                    vibGain.connect(osc.frequency);

                    vibOsc.start();
                    vibOsc.stop(this.audioCtx.currentTime + duration + o.noteSustain);
                }

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(panner);
                panner.connect(this.audioCtx.destination);

                osc.start();

                const fadeStart = this.audioCtx.currentTime + duration;
                gain.gain.setValueAtTime(o.volume, fadeStart);
                gain.gain.linearRampToValueAtTime(0, fadeStart + o.noteSustain);

                osc.stop(fadeStart + o.noteSustain);
                setTimeout(resolve, duration * 1000);
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
        return Promise.all(
            notes.map(note => this.mixer.playNote(note, octave, duration))
        );
    }

    async playSheet() {

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
