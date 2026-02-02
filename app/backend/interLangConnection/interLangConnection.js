import { exec } from "child_process";
import { resolve } from "dns";
import path from "path";

const __dirname = path.dirname(import.meta.url);

class interLangConnection {
    constructor(config = {}) {
        if (!config.path) throw new Error("No path provided");

        const splitPath = config.path.split(".");
        this.config = {
            path: config.path,
            extension: splitPath[splitPath.length - 1],
            ...config
        };
    }

    async runScript(scriptString, options = {}) {
        return new Promise((resolve) => {
            exec(scriptString, { ...options }, (error, stdout, stderr) => {
                resolve({
                    stdout,
                    stderr,
                    code: error?.code ?? 0
                });
            });
        });
    }


    async runTest() {
        const result = await this.runScript(`echo Testing && echo ${this.config.path}`);
        console.log("Result from test", result);
        return result;
    }


    async run(args = []) {

        const projectDir = this.config.path.replaceAll("\\", "\\\\");
        const cmdFormattedArgs = args.map((arg) => `"${arg}"`).join(" ");
        console.log(`Running ${this.config.extension} file: ${projectDir}`);

        switch (this.config.extension) {
            case "cs": {
                const result = await this.runScript(`dotnet run ${projectDir} ${cmdFormattedArgs}`);
                return result;
            }
            case "java": {
                const result = await this.runScript(`java ${projectDir} ${cmdFormattedArgs}`);
                return result;
            }
            default: {
                throw new Error(`Unsupported extension: ${this.config.extension}`);
            }
        }
    }


}

export default interLangConnection;
