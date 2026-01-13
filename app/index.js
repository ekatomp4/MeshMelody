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

/* =========================
   PAGE CACHE
========================= */

const cachedPages = {};

// preload all valid pages from CONSTANTS.validPages
for (let i = 0; i < CONSTANTS.validPages.length; i++) {
    const page = CONSTANTS.validPages[i];
    const pagePath = path.join(
        __dirname,
        'frontend',
        'pages',
        page,
        `${page}.html`
    );
    cachedPages[page] = fs.readFileSync(pagePath, 'utf-8');
}

/* helper function */
function getPageData(page) {
    if (cachedPages[page]) {
        return cachedPages[page];
    }

    const pagePath = path.join(
        __dirname,
        'frontend',
        'pages',
        page,
        `${page}.html`
    );

    const pageData = fs.readFileSync(pagePath, 'utf-8');
    cachedPages[page] = pageData;
    return pageData;
}

/* =========================
   STATIC FILES
========================= */

app.use(express.static(path.join(__dirname, 'frontend')));

/* =========================
   ROUTING (CATCH-ALL)
========================= */

app.use((req, res) => {
    try {
        // normalize path
        const hierarchy = req.path.split('/').filter(Boolean);

        // explicitly handle "/"
        const page = (hierarchy.length === 0 || hierarchy[0] === '') ? 'home' : hierarchy[hierarchy.length - 1];

        // attempt to serve the page from filesystem/cache
        
        const fileData = getPageData(page);
        res.send(fileData);

    } catch (e) {
        // fallback to cached "error" page — fully treated like a normal route
        res.status(404).send(
            getPageData('error').replace(
                '[[IMPORT_DATA]]',
                JSON.stringify({ message: '404 - Page Not Found' })
            )
        );
    }
});

/* =========================
   START SERVER
========================= */

app.listen(CONFIG.PORT, () => {
    console.log('Server started on http://localhost:' + CONFIG.PORT);
});
