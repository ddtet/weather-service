const process = require('process');

const getWeatherData = require('./lib/GetWeaterData');

const DB_FILE = 'weather.db';

// get the auth key from first cli param or env var
const key = process.argv[2] || process.env.CWB_AUTH_KEY;


// if no auth key input, don't exec fetch
if (key) {
    getWeatherData(key)
        .then(data => {
            console.log(data);
        });
} else {
    console.error('you should set apiKey for get weather data.');
}
