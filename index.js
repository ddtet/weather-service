const process = require('process');
const fetch = require('node-fetch');

// get the auth key from first cli param or env var
const key = process.argv[2] || process.env.CWB_AUTH_KEY;

// try to get the weather data
async function getData(key) {
    const response = await fetch(`https://opendata.cwb.gov.tw/fileapi/v1/opendataapi/O-A0003-001?Authorization=${key}&downloadType=WEB&format=JSON`);

    // output for check
    console.log(await response.text());
}

// if no auth key input, don't exec fetch
if ( key ) {
    getData(key);
} else {
    console.error('you should set apiKey for get weather data.');
}
