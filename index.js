const process = require('process');
const express = require('express');

const getWeatherData = require('./lib/GetWeaterData');

const DB_FILE = 'weather.db';

// get the auth key from first cli param or env var
const key = process.argv[2] || process.env.CWB_AUTH_KEY;


// if no auth key input, don't exec fetch
let weatherData = null;
if (key) {
    getWeatherData(key)
        .then(data => {
            console.log(data);
            weatherData = data;
        });
} else {
    console.error('you should set apiKey for get weather data.');
}

const app = express();

app.get('/', (req, res) => {
   res.end('api : weatherData'); 
});

app.get('/weatherData', (req, res) => {
    console.log(req.query.authKey);
    console.log('got request!');
    res.type('json');
    res.send(weatherData);
})

app.listen(80, () => {
    console.log('http service started...');
});
