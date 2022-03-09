
const fetch = require('node-fetch');

function getDataByUrl(key) {
    return fetch(`https://opendata.cwb.gov.tw/fileapi/v1/opendataapi/O-A0003-001?Authorization=${key}&downloadType=WEB&format=JSON`)
        .then((response) => {
            return response.json();
        })
        .catch(() => {
            console.error('Get weather from url error');
            return null;
        });
}

const targetCities = ['臺北市', '新北市', '桃園市'];

function filterByCity(json) {
    const data = [];

    json.cwbopendata.location.forEach(loc => {
        for (let i = 0, len = loc.parameter.length; i < len; i += 1) {
            const param = loc.parameter[i];
            if (param.parameterName === 'CITY') {
                if (targetCities.indexOf(param.parameterValue) !== -1) {
                    data.push(loc);
                }
                return;
            }
        }
    });

    return data;
}

function getWeatherData(apiKey) {
    return getDataByUrl(apiKey)
        .then(filterByCity);
};

module.exports = getWeatherData;