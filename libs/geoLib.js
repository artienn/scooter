const geoLib = require('geo-lib');
const Distance = require('geo-distance');
const DISTANCE_BETWEEN_USER_AND_SCOOTER = 5;
exports.DISTANCE_BETWEEN_USER_AND_SCOOTER = DISTANCE_BETWEEN_USER_AND_SCOOTER;

exports.pointInsideZones = async (point, zone) => {
    if (point && zone) {
        const result = await geoLib.pointInsidePolygon(point, zone.coordinates);
        if (result) return true;
    }
    return false;
};

exports.checkDistance = (userCoords, scooterCoords) => {
    const distance = Distance.between(userCoords, scooterCoords);
    if (distance > Distance(`${DISTANCE_BETWEEN_USER_AND_SCOOTER} m`)) return false;
    return true;
};  