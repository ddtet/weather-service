
const express = require('express');

class WebService {
    constructor(weatherDao) {
        this._weatherDao = weatherDao;
        this._app = null;
        this._authKeys = [];

        this._init();
    }

    _init() {
        this._app = express();

        this._app.get('/', (req, res) => {
            res.end('api : weatherData');
        });

        this._app.get('/weatherData', (req, res) => {
            const authKey = req.query.authKey;
            res.type('json');
            if (this._authKeys.indexOf(authKey) !== -1) {
                if (this._weatherDao.isReady) {
                    this._weatherDao.getCurrentWeatherData()
                        .then(list => {
                            res.send(list);
                            res.end();
                        })
                } else {
                    res.send({ err: 'db is not ready' });
                }
            } else {
                res.status(403).send({ err: 'wrong auth key' });
            }
        });

        this._app.get('/addKey/:key', (req, res) => {
            res.type('json');
            const key = String(req.params.key).trim();
            if (key) {
                console.log(key);
                if (this._authKeys.indexOf(key) === -1) {
                    this._authKeys.push(key);
                    res.send({ msg: 'add authkey success' });
                } else {
                    res.send({ msg: 'key had existed' });
                }
            } else {
                res.send({ msg: 'you should input a key' });
            }
        });

        this._app.listen(80, () => {
            console.log('http service started...');
        });
    }
}

module.exports = WebService;