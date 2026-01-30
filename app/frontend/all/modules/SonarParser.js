

class SonarParser {
    static suffix = "snr";
    constructor() {

    }

    parse(str) {
        // split by ; and \n
        const lines = str.split(/[\r\n]+/);

        let bracketDepth = 0;

        for(let i=0; i<lines.length; i++) {
            // check if line is empty
            if(lines[i].trim() === "") continue;
            // process

            // tokenize, split by space
            const tokens = lines[i].split(" ");
            
            for(let j=0; j<tokens.length; j++) {
                const token = tokens[j];
                if(token === "") continue;
                if(tokens === "{") bracketDepth++;
                if(tokens === "}") bracketDepth--;
            }

            console.log(tokens);
        }
    }
}


export default SonarParser;