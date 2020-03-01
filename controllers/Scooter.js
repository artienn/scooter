const {Scooter} = require('../schemas');
const {notFound} = require('boom');

exports.listOfFreeScooters = async () => {
    const scooters = await Scooter.find({free: true});
    
    return scooters;
};

exports.getScooterById = async (user, query) => {
    const {_id} = query;
    const scooter = await Scooter.findById(_id);
    return scooter;
};

exports.getFreeScooterById = async (_id) => {
    const scooter = await Scooter.findOne({_id, free: true});
    if (!scooter) throw notFound('Scooter not found');
    return scooter;
};

exports.closeFreeFlagOfScooter = async (scooterId) => {
    await Scooter.updateOne({_id: scooterId}, {$set: {free: false}});
};