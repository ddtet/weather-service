# Weather Data Service

Get weather data form [氣象資料開發平台](https://opendata.cwb.gov.tw/), and provide an api to get a part of them.

## INSTALL

```
npm install
```

## RUN


**should authkey [氣象資料開發平台](https://opendata.cwb.gov.tw/) by the first cli param or in the environment variable.**

```
# Set by the first cli param
node index.js [AUTH_KEY]

# Set in the environment variable
export CWB_AUTH_KEY=[AUTH_KEY]
```

## USE

add self auth key
```
http://127.0.0.1/addKey/[authKey]
```

then use the key above to get weather data

```
http://127.0.0.1/weatherData?authKey=[authKey]
```
