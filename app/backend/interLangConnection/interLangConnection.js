import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));


class interLangConnection {
    constructor(config = {}) {
        if (!config.path) throw new Error("No path provided");

        const splitPath = config.path.split(".");
        this.config = {
            path: config.path,
            extension: splitPath[splitPath.length - 1],
            ...config
        };

        // add streaming
        // add error handling
        // add single function returns
        // add the ability to keep alive, optimization
        // add ability to prebuild and hold calls until build is finished

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
        const extensionlessDir = projectDir.split(".")[0];

        console.log(`Running ${this.config.extension} file: ${projectDir}`);

        switch (this.config.extension) {

            case "java": {
                // run straight java no build
                const result = await this.runScript(`java ${projectDir} ${cmdFormattedArgs}`);
                return result;
            }

            // not working

            case "cs": {
                // run c#, not working currently
                const result = await this.runScript(`dotnet run ${projectDir} ${cmdFormattedArgs}`);
                return result;
            }
            case "class": {
                const parsed = path.parse(projectDir);
            
                const classPath = parsed.dir;
                const className = parsed.name;
            
                return await this.runScript(
                    `java -cp "${classPath}" ${className} ${cmdFormattedArgs}`
                );
            }
                   
            default: {
                throw new Error(`Unsupported extension: ${this.config.extension}`);
            }
        }
    }


}

export default interLangConnection;
