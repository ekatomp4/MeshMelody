// get CONFIG.env
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import getConfig from './modules/getConfig.js';
import CONSTANTS from './backend/Constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = getConfig();
const app = express();

import Socket from './backend/Socket.js';
Socket.init(app, CONFIG.WS_PORT);



app.use(express.static(path.join(__dirname, 'frontend')));

/* =========================
    API
========================= */

import APIRoutes from './backend/api/APIRoutes.js';
import { doesConnectionExist, getConnection } from './backend/classes/ws/Connection.js';

for(const route in APIRoutes) {

    if(APIRoutes[route].method === "POST") {

        app.post('/api/' + route, (req, res)=>{
            console.log(req.body);
            if(route.isPrivate && !doesConnectionExist(req.body.token)) {
                res.status(401).send("Unauthorized");
            }
            const token = req.body.token ? req.body.token : null;
            APIRoutes[route].fn(req, res, token);
        });
        // POST DOES NOT WORK 

    } else {

        app.get('/api/' + route, (req, res)=>{

            const isPrivate = APIRoutes[route].isPrivate;
            const connection = getConnection(req.query.token);

            if(connection && !connection.authenticated && isPrivate) {
                if(!connection) {
                    res.status().send("Unauthorized, not connected");
                    return;
                }
                res.status(401).send("Unauthorized, not authenticated");
                return;
            }

            const token = req.query.token ? req.query.token : null;
            const response = APIRoutes[route].fn(req, res, token);

            if(!response) return; // if there is no response

            const formattedResponse = typeof response === "string" ? JSON.stringify({message: response}) : JSON.stringify(response);
            res.send(formattedResponse);
        });

    }
}

/* =========================
   PAGE CACHE
========================= */

app.get('/page/:page', (req, res) => {
    const page = req.params.page;
    // serve index and pass the requested page
    try {
        const pagePath = path.join(__dirname, 'frontend', 'pages', page, page + '.html');
        const pageContent = fs.readFileSync(pagePath, 'utf-8');
        res.send(pageContent);
    } catch (e) {
        console.error("Error in page", page, e);
        res.status(404).send('Page not found');
    }
    
});

const appPath = path.join(__dirname, 'frontend', 'app.html');
const appPage = fs.readFileSync(appPath, 'utf-8');

const staticAssets = ["css"];
app.use((req, res) => {

    // // serve static assets
    if(staticAssets.some(ext => req.path.endsWith(ext))) {
        try {
            res.sendFile(path.join(__dirname, 'frontend', req.path));
            return;
        } catch (e) {
            console.error("Error in static asset", req.path, e);
            res.status(404).send('Static asset not found');
        }
    }

    const pathHeirarchy = req.path.split("/").filter(p => p.length > 0);
    // serve index and pass the requested page

    // replace [[DATA]] with initial data
    const data = {
        pathHeirarchy: pathHeirarchy,
    };
    const finalPage = appPage.replace('[[DATA]]', JSON.stringify(data));
    res.send(finalPage);
});


/* =========================
   START SERVER
========================= */

app.listen(CONFIG.PORT, () => {
    console.log('Server started on http://localhost:' + CONFIG.PORT);
});


// inter language connection test
import interLangConnection from './backend/interLangConnection/interLangConnection.js';

const csProcess = new interLangConnection({
    // path: path.join(__dirname, 'backend', 'interLangConnection', 'tests', 'test.java'),
    path: path.join(__dirname, 'backend', 'interLangConnection', 'tests', 'test.java'),
});
// csProcess.runTest();
csProcess.run(["Hello", "World"]).then(console.log);


