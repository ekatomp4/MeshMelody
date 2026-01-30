import Instrument from "./Instrument.js";



class MusicSheet {
    constructor(beatsPerBar = 16, bpm = 120) {
        const secondsPerBar = 60 / bpm * 4 / beatsPerBar;

        this.instrument = new Instrument();
        this.data = [];
    }

    setInstrument(instrument) {
        this.instrument = instrument;
    }

    play() {

    }
}

export default MusicSheet;

