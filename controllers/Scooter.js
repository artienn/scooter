const {Scooter, ScooterCoordsHistory} = require('../schemas');
const {notFound} = require('boom');
const Contract = require('./Contract');
const flespi = require('../libs/flespi');

exports.listOfFreeScooters = async (free = true) => {
    const query = {};
    if (free) {
        query.battery = {$gte: 10};
        query.free = true;
        query.viewed = {$ne: false};
    }
    const scooters = await Scooter.find(query).sort({battery: 1});
    for (const scooter of scooters) {
        const {battery} = scooter;
        if (battery < 15) scooter.batteryFlag = 1;
        else if (battery < 50) scooter.batteryFlag = 2;
        else scooter.batteryFlag = 3;
    }
    return scooters;
};

exports.getScooterById = async (user, query) => {
    const {_id} = query;
    const scooter = await Scooter.findById(_id);
    return scooter;
};

exports.getFreeScooterById = async (_id) => {
    const scooter = await Scooter.findOne({_id, free: {$ne: false}, viewed: {$ne: false}});
    if (!scooter) throw notFound('Scooter not found');
    return scooter;
};

exports.updateScooter = async (_id, viewed) => {
    const scooter = await Scooter.findById(_id);
    if (!scooter) throw notFound('Scooter not found');
    if (viewed === false || viewed === true) scooter.viewed = viewed;
    await scooter.save();
    return {message: 'ok'};
};

exports.updateFreeFlagOfScooter = async (scooterId, free, id) => {
    await Promise.all([
        Scooter.updateOne({_id: scooterId}, {$set: {free, lock: free}}),
        flespi.lockScooter(id, free)
    ]);
};

exports.getUsedScooters = async () => {
    return Scooter.find({free: false});
};

exports.updateScooterCoords = async (user, lat, lon) => {
    const contracts = await Contract.getUserActiveContracts(user);
    const now = new Date();
    for (const contract of contracts) {
        await Promise.all([
            Scooter.updateOne({coords: {lat, lon, updatedAt: now}}),
            ScooterCoordsHistory.updateOne({scooter: contract.scooter._id, contract: contract._id}, {$push: {coords: {lat, lon, now}}})
        ]);
    }
    return {message: 'ok'};
};