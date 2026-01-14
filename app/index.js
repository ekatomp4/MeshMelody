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
        res.status(404).send('Page not found');
    }
    
});

const appPath = path.join(__dirname, 'frontend', 'app.html');
const appPage = fs.readFileSync(appPath, 'utf-8');

const staticAssets = ["css", "js", "jpg", "png", "svg", "gif", "webm", "mp4", "ogg", "wav", "mp3", "ico", "json"];
app.use((req, res) => {

    // serve static assets
    if(staticAssets.some(ext => req.path.endsWith(ext))) {
        res.sendFile(path.join(__dirname, 'frontend', req.path));
        return;
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
