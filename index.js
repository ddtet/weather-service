const process = require('process');
const path = require('path');

// Get / Save Weather Data from DB (sqlite)
const WeatherDao = require('./lib/WeatherDao');
// Fetch Watcher data from other web api
const WeatherDataGetter = require('./lib/WeatherDataGetter');
// Privide http api for other
const WebService = require('./lib/WebService');

// sqlite file path
const DB_FILE = 'weather.db';

// get the auth key from first cli param or env var
const key = process.argv[2] || process.env.CWB_AUTH_KEY;

if (!key) {
    console.error('you should set apiKey for get weather data.');
    process.exit(1);
}

let weatherDataGetter;
let webService;
const weatherDao = new WeatherDao(path.resolve(__dirname, DB_FILE));

// after dao (init db, get last data time), start data getter and web service
weatherDao.init().then(() => {
    weatherDataGetter = new WeatherDataGetter(key, weatherDao);
    webService = new WebService(weatherDao);
});

// When Ctrl+C or process be killed, end the cron from get weather data, and close sqlite db
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