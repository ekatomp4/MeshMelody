

import Instrument from "./Instrument.js";





class SoundPlayer {

    static audioCtx = new AudioContext();
    static instrumentList = {};
    static addInstrument(name, instrument) {
        this.instrumentList[name] = instrument;
    }

    static getInstrument(instrument) {
        if(!this.instrumentList[instrument]) {
            throw new Error(`Instrument ${instrument} does not exist`);
        }
        return this.instrumentList[instrument];
    }

}

// SoundPlayer.addInstrument("test", new Instrument(SoundPlayer.audioCtx));
SoundPlayer.addInstrument("piano",
    new Instrument(SoundPlayer.audioCtx, {
        oscillators: [
            {
                // fundamental / body
                type: "sine",
                volume: 0.18,
                detune: 0,
                punch: 0.6,
                punchTime: 0.1,
                noteSustain: 0.5,
                filterType: "lowpass",
                filterFreq: 2000
            },
            {
                // harmonic brightness (tamed)
                type: "triangle",
                volume: 0.08,
                detune: 0,
                punch: 0.1,
                punchTime: 0.04,
                noteSustain: 0.4,
                filterType: "lowpass",
                filterFreq: 2600
            },
            {
                // background vibration
                type: "sawtooth",
                volume: 0.01,
                detune: 0,
                punch: 0.01,
                punchTime: 0.04,
                noteSustain: 1,
                filterType: "lowpass",
                filterFreq: 1600
            }
        ]
    })
);


window.SoundPlayer = SoundPlayer;

export default SoundPlayer