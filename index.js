const process = require('process');
const path = require('path');
const express = require('express');

const WeatherDao = require('./lib/WeatherDao');

const WeatherDataGetter = require('./lib/WeatherDataGetter');

const DB_FILE = 'weather.db';

// get the auth key from first cli param or env var
const key = process.argv[2] || process.env.CWB_AUTH_KEY;

const weatherDao = new WeatherDao(path.resolve(__dirname, DB_FILE));
let weatherDataGetter;

weatherDao.init().then(() => {
    weatherDataGetter = new WeatherDataGetter(key, weatherDao);
});


// // if no auth key input, don't exec fetch
// let weatherData = null;
// if (key) {
//     getWeatherData(key)
//         .then(data => {
//             console.log(data);
//             weatherData = data;
//         });
// } else {
//     console.error('you should set apiKey for get weather data.');
// }

const app = express();

app.get('/', (req, res) => {
    res.end('api : weatherData');
});

app.get('/weatherData', (req, res) => {
    console.log(req.query.authKey);
    console.log('got request!');
    res.type('json');
    if (weatherDao.isReady) {
        weatherDao.getCurrentWeatherData()
            .then(list => {
                res.send(list);
                res.end();
            })
    } else {
        res.end({ err: 'db is not ready' });
    }
})

app.listen(80, () => {
    console.log('http service started...');
});


process.on('SIGINT', () => {
    weatherDataGetter.stop();
    weatherDao.close().then(() => {
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    weatherDataGetter.stop();
    weatherDao.close().then(() => {
        process.exit(0);
    });
});