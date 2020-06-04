const rpn = require('request-promise-native');
const {uri, token} = require('../config').flespi;
const {notFound} = require('boom');

exports.getDevises = async () => {
    const options = {
        method: 'GET',
        uri: `${uri}/gw/devices/all`,
        headers: {
            Authorization: token,
            Accept: 'application/json'
        },
        json: true
    };
    const result = await rpn(options);
    if (!result || !result.result) throw notFound('Resource not found', result);
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
    return result.result;
};

exports.blockScooter = async () => {
    
};