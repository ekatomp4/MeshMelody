import { exec } from "child_process";
import path from "path";

class interLangConnection {
    constructor(config = {}) {
        if (!config.path) throw new Error("No path provided");

        this.config = {
            path: config.path,
            extension: config.path.split(".").pop(),
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
        switch (this.config.extension) {
            case "cs": {
                const projectDir = this.config.path; // folder containing .csproj
                const result = await this.runScript(`dotnet run -- ${args.join(" ")}`, {
                    cwd: projectDir
                });
                return result;
            }
        }
    }

    // check for streaming

}

export default interLangConnection;
