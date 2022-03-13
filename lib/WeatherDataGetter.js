
const fetch = require('node-fetch');

const targetCities = ['臺北市', '新北市', '桃園市'];

/**
 * Get weather from https://opendata.cwb.gov.tw
 * 
 * After getting data, will setTimeout next fetching an hour late by Data's obsTime.
 * 
 * The data will save by dao.
 */
class WeatherGetter {
    constructor(key, weatherDao) {
        this._key = key;
        this._dao = weatherDao;
        this._timeoutInt = null;
        // waiting time, 1 hour
        this._gettingProid = 3600000;

        this._initGetter();
    }

    /**
     * Clear any timeout interval.
     */
    stop() {
        if (this._timeoutInt) {
            clearTimeout(this._timeoutInt);
        }
    }

    _initGetter() {
        // check the current obs is newest
        const timeNow = new Date().setHours(0, 0, 0, 0);
        const currentTimestamp = this._dao.getCurentTimestamp()
        // when date after then data's, try to fetch new on
        if (timeNow > currentTimestamp) {
            this._getWeatherData();
        } else {
            this._setTimeoutForNextHour(currentTimestamp + this._gettingProid);
        }
    }

    _getWeatherData() {
        this._timeoutInt = null;
        this._getDataByUrl()          // get data from web api
            .then(this._filterByCity) // filter data by city list
            .then(this._prepareData)  // parpare data for saving by dao
            .then((list) => {
                return this._dao.saveWeatherData(list);  // save the newlest data into db
            }).then(() => {           // decide the next time to fetch data
                const currentTimestamp = this._dao.getCurentTimestamp();
                this._setTimeoutForNextHour(currentTimestamp + this._gettingProid);
            })
            .catch((err) => {         // anything wrong, try agin at five minutes later
                console.error(err.toString());
                console.error('Something wrong, try again at five minutes later');
                this._setTimeoutForNextHour(new Date.now() + 300000);
            });;
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
            });
    }

    // filter data by city list
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