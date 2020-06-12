const geoLib = require('geo-lib');
const Distance = require('geo-distance');
const DISTANCE_BETWEEN_USER_AND_SCOOTER = 5;
exports.DISTANCE_BETWEEN_USER_AND_SCOOTER = DISTANCE_BETWEEN_USER_AND_SCOOTER;

exports.pointInsideZones = async (point, coordinates) => {
    if (point && coordinates) {
        const result = await geoLib.pointInsidePolygon(point, coordinates);
        if (result) return true;
    }
    return false;
};

exports.checkDistance = (userCoords, scooterCoords) => {
    const distance = Distance.between(userCoords, scooterCoords);
    if (distance > Distance(`${DISTANCE_BETWEEN_USER_AND_SCOOTER} m`)) return false;
    return true;
};  