const process = require('process');
const path = require('path');

const WeatherDao = require('./lib/WeatherDao');

const WeatherDataGetter = require('./lib/WeatherDataGetter');

const WebService = require('./lib/WebService');

const DB_FILE = 'weather.db';

// get the auth key from first cli param or env var
const key = process.argv[2] || process.env.CWB_AUTH_KEY;

if (!key) {
    console.error('you should set apiKey for get weather data.');
    express.exit(1);
}

const weatherDao = new WeatherDao(path.resolve(__dirname, DB_FILE));
let weatherDataGetter;
let webService;

weatherDao.init().then(() => {
    weatherDataGetter = new WeatherDataGetter(key, weatherDao);
    webService = new WebService(weatherDao);
});

process.on('SIGINT', () => {
    if (weatherDataGetter) {
        weatherDataGetter.stop();
    }
    weatherDao.close().then(() => {
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    if (weatherDataGetter) {
        weatherDataGetter.stop();
    }
    weatherDao.close().then(() => {
        process.exit(0);
    });
});