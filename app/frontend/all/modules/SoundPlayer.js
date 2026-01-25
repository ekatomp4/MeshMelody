

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

SoundPlayer.addInstrument("test", new Instrument(SoundPlayer.audioCtx));
SoundPlayer.addInstrument("piano", new Instrument(SoundPlayer.audioCtx, {
    type: "triangle",      // softer than square
    punch: 0.3,            // piano attack
    punchTime: 0.02,       // very short attack
    noteSustain: 1.5,      // natural decay
    filterType: "lowpass",
    filterFreq: 4000,      // gentle top cutoff
    layers: 2,             // layered oscillators for richness
    detune: 5,             // slight detune per layer
    vibratoDepth: 0,     // vibrato frequency deviation %
}));


window.SoundPlayer = SoundPlayer;

export default SoundPlayer