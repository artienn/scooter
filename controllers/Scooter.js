const {Scooter, ScooterCoordsHistory} = require('../schemas');
const {notFound} = require('boom');
const Contract = require('./Contract');

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

exports.getUsedScooters = async () => {
    return Scooter.find({free: false});
};

exports.updateScooterCoords = async (user, lat, lon) => {
    const contract = await Contract.getUserActiveContract(user);
    const now = new Date();
    await Promise.all([
        Scooter.updateOne({coords: {lat, lon, updatedAt: now}}),
        ScooterCoordsHistory.updateOne({scooter: contract.scooter, contract: contract._id}, {$push: {coords: {lat, lon, now}}})
    ]);
    return {message: 'ok'};
};