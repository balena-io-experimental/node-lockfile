const path = require('path');
const fs = require('fs');
const express = require('express');
const lockfile = require('lockfile');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const http = require('http');

const staticPath = path.resolve(__dirname, 'static');
const lockPath = '/tmp/balena/updates.lock';

app.use(express.static(staticPath));
app.use(express.json());
app.use(cors());

const SV_ADDR = process.env.BALENA_SUPERVISOR_ADDRESS;
const SV_KEY = process.env.BALENA_SUPERVISOR_API_KEY;

function triggerUpdate() {
    if (SV_ADDR == null) {
        return;
    }
    const url = new URL(`${SV_ADDR}/v1/update?apikey=${SV_KEY}`);
    const data = JSON.stringify({});
    const req = http
        .request(
            url,
            {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                    'Content-Length': Buffer.byteLength(data),
                },
            },
            (res) => {
                let data = '';

                // A chunk of data has been received.
                res.on('data', (chunk) => {
                    data += chunk;
                });

                // The whole response has been received. Print out the result.
                res.on('end', () => {
                    console.log(data);
                });
            },
        )
        .on('error', (err) => {
            console.log('Error: ' + err.message);
        });
    req.write(data);
    req.end();
}

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
        triggerUpdate();
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
    const countResponse = await fetch(`http://${service}:${port}/count`, {
        method: 'GET',
    }).then((rsp) => rsp.json());
    res.status(200).json(countResponse);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen('80', () => {
    console.log('Lock server listening on port 80');
});
