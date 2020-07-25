const geoLib = require('../libs/geoLib');
const zoneParser = require('../libs/zoneParser');
const {Zone} = require('../schemas');

exports.checkPoint = async (lat, lon) => {
    const zones = await Zone.find();
    for (const zone of zones) {
        const geoLibResult = await geoLib.pointInsideZones([lat, lon], zone.coordinates);
        if (geoLibResult) return {zone, result: true};
    }
    return {result: false};
};

exports.getDataAboutZoneFromKml = async (fileName) => {
    const zonesData = await zoneParser.parse(fileName);
    return {zonesData};
};

exports.updateZonePoints = async (zonesData) => {
    await Zone.remove({});
    const zones = zonesData.map(zone => {
        return ({
            name: zone.name,
            coordinates: zone.coordinates,
            type: zone.type
        });
    });
    await Zone.insertMany(zones);
    return {message: 'ok'};
};

exports.getZones = async () => {
    const zones = await Zone.find();
    return {zones};
};