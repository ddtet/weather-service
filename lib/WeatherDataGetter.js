
const fetch = require('node-fetch');

const targetCities = ['臺北市', '新北市', '桃園市'];

class WeatherGetter {
    constructor(key, weatherDao) {
        this._key = key;
        this._dao = weatherDao;
        this._timeoutInt = null;
        this._gettingProid = 3600000;

        this._initGetter();
    }

    stop() {
        if (this._timeoutInt) {
            clearTimeout(this._timeoutInt);
        }
    }

    _initGetter() {
        // check the current obs is newest
        const timeNow = new Date().setHours(0, 0, 0, 0);
        const currentTimestamp = this._dao.getCurentTimestamp()
        if (timeNow > currentTimestamp) {
            this._getWeatherData();
        } else {
            this._setTimeoutForNextHour(currentTimestamp + this._gettingProid);
        }
    }

    _getWeatherData() {
        this._timeoutInt = null;
        this._getDataByUrl()
            .then(this._filterByCity)
            .then(this._prepareData)
            .then((list) => {
                return this._dao.saveWeatherData(list);
            }).then(() => {
                const currentTimestamp = this._dao.getCurentTimestamp();
                this._setTimeoutForNextHour(currentTimestamp + this._gettingProid);
            });
    }

    _setTimeoutForNextHour(targetTimeStamp) {
        console.log('next get will at: ', new Date(targetTimeStamp).toLocaleString());
        this._timeoutInt = setTimeout(() => {
            this._getWeatherData();
        }, targetTimeStamp - Date.now());
    }

    _getDataByUrl() {
        const key = this._key;
        return fetch(`https://opendata.cwb.gov.tw/fileapi/v1/opendataapi/O-A0003-001?Authorization=${key}&downloadType=WEB&format=JSON`)
            .then((response) => {
                return response.json();
            })
            .catch((err) => {
                console.error('Get weather from url error');
                return null;
            });
    }

    _filterByCity(json) {
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

    _prepareData(data) {
        return data.map(wData => {
            const resp = {
                stationId: wData.stationId,
                locationName: wData.locationName,
                obsTime: new Date(wData.time.obsTime).getTime(),
                lat: Number(wData.lat),
                lon: Number(wData.lon),
            };
            const weatherFields = ['WDIR', 'WDSD', 'TEMP', 'HUMD', 'PRES', 'D_TX', 'D_TN', 'Weather'];
            wData.weatherElement.forEach(ele => {
                if (weatherFields.indexOf(ele.elementName) !== -1) {
                    resp[ele.elementName] = ele.elementValue.value;
                }
            });
            const parameterFields = ['CITY', 'TOWN'];
            wData.parameter.forEach(parm => {
                if (parameterFields.indexOf(parm.parameterName) !== -1) {
                    resp[parm.parameterName] = parm.parameterValue;
                }
            });
            return resp;
        });
    }
}

module.exports = WeatherGetter;