const {Scooter} = require('../schemas');
const {notFound} = require('boom');

exports.list = async (user, query) => {
    const scooters = await Scooter.find();

    return scooters;
};

exports.getFreeScooterById = async (_id) => {
    const scooter = await Scooter.findOne({_id, free: true});
    if (!scooter) throw notFound('Scooter not found');
    return scooter;
};