const geoLib = require('geo-lib');
const Distance = require('geo-distance');
const DISTANCE_BETWEEN_USER_AND_SCOOTER = 5;
exports.DISTANCE_BETWEEN_USER_AND_SCOOTER = DISTANCE_BETWEEN_USER_AND_SCOOTER;

exports.pointInsideZones = async (point, coordinates) => {
    if (point && coordinates) {
        const result = await geoLib.pointInsidePolygon(point, coordinates);
        return result;
    }
    return false;
};

exports.checkDistance = (userCoords, scooterCoords) => {
    const distance = Distance.between(userCoords, scooterCoords);
    if (distance > Distance(`${DISTANCE_BETWEEN_USER_AND_SCOOTER} m`)) return false;
    return true;
};  

exports.checkDistanceOfIncomingValue = (coords1, coords2, dist) => {
    const distance = Distance.between(coords1, coords2);
    if (distance > Distance(`${dist} m`)) return false;
    return true;
};