const cors = require('cors');
const express = require('express');
const app = express();

app.use(cors());

// Indicates whether locks are working - will reset to 0 on service restart
let count = 0;

app.post('/count', (req, res) => {
    count++;
    res.status(201).send('OK');
});

app.get('/count', (req, res) => {
    res.status(200).json({ count });
});

app.listen(3001, () => {
    console.log('Server two listening on port 3001');
});