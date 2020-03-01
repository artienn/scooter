const {Contract} = require('../schemas');
const {conflict, badRequest} = require('boom');
const Scooter = require('./Scooter');
const Distance = require('geo-distance');

exports.getUserContract = async (user) => {
    const contract = await Contract.findOne({user: user._id}).populate('scooter');
    return contract;
};

exports.createContract = async (user, body) => {
    const existsContract = await this.getUserContract(user);
    if (existsContract) throw badRequest('User already created contract');
    const {scooterId, userCoords} = body;
    const scooter = await Scooter.getFreeScooterById(scooterId);
    const {coords} = scooter;
    const distance = Distance.between(userCoords, coords);
    if (distance > Distance('5 m')) throw conflict('Distance is too big');
    const [contract, _updateScooter] = await Promise.all([
        new Contract({
            scooter: scooter._id,
            user: user._id,
            active: true,
            rate: {
                value: 'start',
                updatedAt: new Date()
            }
        }).save(),
        Scooter.closeFreeFlagOfScooter(scooter._id)
    ]);
    return contract;
};