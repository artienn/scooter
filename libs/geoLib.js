const geoLib = require('geo-lib');

exports.pointInsideZones = async (point, zone) => {
    if (point && zone) {
        const result = await geoLib.pointInsidePolygon(point, zone.coordinates);
        if (result) return true;
    }
    return false;
};