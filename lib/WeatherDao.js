const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

/**
 * Read / Write weather from sqlite
 */
class WeatherDao {
    constructor(dbPath) {
        // if closed, no db operation could exec
        this._isReady = false;
        this._obsTime = 0;
        this._dbPath = dbPath;
    }

    init() {
        return open({       // init db file
            filename: this._dbPath,
            driver: sqlite3.Database
        }).then((db) => {   // make sure the table exist, and get the newest obsTime
            this.db = db;
            return this._initTables();
        }).then(() => {     // set status ready, and tell others the dao is ready.
            this._isReady = true;
        });
    }

    get isReady() {
        return this._isReady;
    }

    _initTables() {
        return Promise.resolve()
            .then(() => {  // data_log: log how many versions data in, and which is the newest
                return this.db.run(`
                CREATE TABLE IF NOT EXISTS data_log (
                    obsTime INTEGER PRIMARY KEY,
                    current INTEGER
                )`)
            })
            .then(() => {  // weather_data: keep weather data
                return this.db.run(`
                CREATE TABLE IF NOT EXISTS weather_data (
                    stationId TEXT NOT NULL,
                    locationName TEXT NOT NULL,
                    obsTime INTEGER NOT NULL,
                    lat REAL,
                    lon REAL,
                    WDIR INTEGER,
                    WDSD REAL,
                    TEMP REAL,
                    HUMD REAL,
                    PRES REAL,
                    D_TX REAL,
                    D_TN REAL,
                    Weather TEXT NOT NULL,
                    CITY TEXT NOT NULL,
                    TOWN TEXT NOT NULL,
                    FOREIGN KEY ( "obsTime" ) REFERENCES data_log,
                    UNIQUE ( obsTime, stationId )
                )`)
            }).then(() => {
                // find the newest version's obsTime
                return this.db.get('SELECT obsTime FROM data_log WHERE current=1')
                    .then((resp) => {
                        if (resp) {
                            this._obsTime = resp.obsTime;
                        }
                    })
            });
    }

    getCurentTimestamp() {
        if (!this._isReady) {
            throw new Error('DB is not ready');
        }
        return this._obsTime;
    }

    saveWeatherData(list) {
        if (!this._isReady) {
            throw new Error('DB is not ready');
        }
        let maxObsTime = 0;
        list.forEach(data => {
            maxObsTime = Math.max(maxObsTime, data.obsTime);
        });
        let promise = Promise.resolve();
        if (maxObsTime > this._obsTime) { // when new data in, update data_log and set the newest one is current
            promise = promise.then(() => {
                const sql = `
                    UPDATE data_log SET current = 0 WHERE current = 1;
                    INSERT INTO data_log ( obsTime, current ) VALUES ( ${maxObsTime}, 1 );
                `;
                return this.db.exec(sql);
            });
            this._obsTime = maxObsTime; // update properity
        } else { // no new data, move out.
            return promise;
        }
        // save weather data
        promise = promise.then(() => {
            // conbine the sql string and input multi data
            const values = list.map((data) => {
                return `(
                    "${data.stationId}",
                    "${data.locationName}",
                    ${data.obsTime},
                    ${data.lat},
                    ${data.lon},
                    ${data.WDIR},
                    ${data.WDSD},
                    ${data.TEMP},
                    ${data.HUMD},
                    ${data.PRES},
                    ${data.D_TX},
                    ${data.D_TN},
                    "${data.Weather}",
                    "${data.CITY}",
                    "${data.TOWN}"
                )`
            });
            const sql = `
                INSERT INTO weather_data (
                    stationId, locationName, obsTime, lat,
                    lon, WDIR, WDSD, TEMP, HUMD, PRES, D_TX,
                    D_TN, Weather, CITY, TOWN
                ) VALUES ${values.join(', ')}
            `;
            return this.db.exec(sql);
        });
        return promise;
    }

    // get the current version's data
    getCurrentWeatherData() {
        if (!this._isReady) {
            throw new Error('DB is not ready');
        }
        if (!this._obsTime) {
            // not have any data
            return Promise.resolve([]);
        }
        return this.db.all(`
        SELECT weather_data.*
        FROM weather_data
        JOIN data_log ON data_log.obsTime = weather_data.obsTime
        WHERE data_log.current = 1
        `).then((list) => {
            return list;
        });
    }

    close() {
        this._isReady = false;
        return this.db.close();
    }
}

module.exports = WeatherDao;