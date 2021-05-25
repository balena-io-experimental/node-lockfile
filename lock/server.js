const path = require('path');
const fs = require('fs');
const express = require('express');
const lockfile = require('lockfile');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

const staticPath = path.resolve(__dirname, 'static');
const lockPath = '/tmp/balena/updates.lock';

app.use(express.static(staticPath));
app.use(express.json());
app.use(cors());

app.post('/lock', (req, res) => {
    lockfile.lock(lockPath, (err) => {
        if (err) {
            console.error(err);
            return res.send(err);
        }
        res.status(201).send('Lockfile created');
    });
});

app.post('/unlock', (req, res) => {
    lockfile.unlock(lockPath, (err) => {
        if (err) {
            console.error(err);
            return res.send(err);
        }
        res.status(201).send('Lockfile removed');
    });
});

app.get('/lock', async (req, res) => {
    const dirContents = await fs.promises.readdir('/tmp/balena');
    if (dirContents && dirContents.includes('updates.lock')) {
        res.send('true');
    } else {
        res.send('false');
    }
});

app.post('/count', async (req, res) => {
    const { service } = req.body;
    const port = service === 'one' ? 3000 : 3001;
    await fetch(`http://${service}:${port}/count`, { method: 'POST' });
    res.sendStatus(201);
});

app.get('/:service/count', async (req, res) => {
    const { service } = req.params;
    const port = service === 'one' ? 3000 : 3001;
    const countResponse = await fetch(`http://${service}:${port}/count`, { method: 'GET' })
        .then(rsp => rsp.json());
    res.status(200).json(countResponse);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen('80', () => {
    console.log('Lock server listening on port 80');
});