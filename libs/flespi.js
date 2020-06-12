const rpn = require('request-promise-native');
const {uri, token} = require('../config').flespi;
const {notFound} = require('boom');

exports.getDevises = async () => {
    const options = {
        method: 'GET',
        uri: `${uri}/gw/devices/all`,
        headers: {
            Authorization: `FlespiToken ${token}`,
            Accept: 'application/json'
        },
        json: true
    };
    const result = await rpn(options);
    if (!result || !result.result) throw notFound('Resource not found', result);
    console.log(result.result);
    return result.result;
};

exports.getDeviseById = async (id) => {
    const options = {
        method: 'GET',
        uri: `${uri}/gw/devices/${id}`,
        headers: {
            Authorization: token,
            Accept: 'application/json'
        },
        json: true
    };
    const result = await rpn(options);
    if (!result || !result.result) throw notFound('Resource not found', result);
    return result.result[0];
};

exports.getDevisesPlugins = async () => {
    const options = {
        method: 'GET',
        uri: `${uri}/gw/devices/all/plugins`,
        headers: {
            Authorization: token,
            Accept: 'application/json'
        },
        json: true
    };
    const result = await rpn(options);
    if (!result || !result.result) throw notFound('Resource not found', result);
    return result.result[0];
};

exports.getDevisesCoords = async (ids = []) => {
    if (!ids || !ids.length) {
        console.log('ids array empty');
        return;
    }
    const idsString = ids.join(',');
    const options = {
        method: 'GET',
        uri: `${uri}/gw/devices/${idsString}/telemetry`,
        headers: {
            Authorization: token,
            Accept: 'application/json'
        },
        json: true
    };
    const result = await rpn(options);
    if (!result || !result.result) throw notFound('Resource not found', result);
    console.log(result.result[0]);
    return result.result;
};

exports.blockScooter = async (id, lock) => {
    const options = {
        method: 'PUT',
        uri: `https://ru.flespi.io/gw/devices/${id}/settings/name=sclockctrl`,
        headers: {
            Authorization: `FlespiToken ${token}`,
            Accept: 'application/json'
        },
        body: {
            address: 'connection',
            properties: {
                lock
            }
        },
        json: true
    };
    const result = await rpn(options);
    if (!result || !result.result) throw notFound('Resource not found', result);
    console.log(result.result);
    return result.result;
};

exports.blockScooterInfo = async (ids) => {
    if (!ids || !ids.length) {
        console.log('ids array empty');
        return;
    }
    const idsString = ids.join(',');
    const options = {
        method: 'GET',
        uri: `https://ru.flespi.io/gw/devices/${idsString}/settings/name=sclockctrl`,
        headers: {
            Authorization: `FlespiToken ${token}`,
            Accept: 'application/json'
        },
        json: true
    };
    const result = await rpn(options);
    if (!result || !result.result) throw notFound('Resource not found', result);
    console.log(result.result);
    return result.result;
};