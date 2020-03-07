const {Contract, Tariff, ContractHistory} = require('../schemas');
const {conflict, badRequest, notFound} = require('boom');
const Scooter = require('./Scooter');
const Distance = require('geo-distance');
const moment = require('moment');
const DISTANCE_BETWEEN_USER_AND_SCOOTER = 5;

exports.getUserActiveContract = async (user) => {
    const contract = await Contract.findOne({user: user._id, active: true}).populate('scooter').lean();
    if (!contract) throw notFound('Contract nor found');
    contract.period = moment().diff(contract.createdAt, 'seconds');
    return contract;
};

exports.getUserActiveContractByContractId = async (userId, contractId) => {
    const contract = await Contract.findOne({user: userId, _id: contractId, active: true}).populate('scooter').lean();
    if (!contract) throw notFound('Contract nor found');
    
    return contract;
};

exports.createContract = async (user, body) => {
    const existsContract = await this.getUserActiveContract(user);
    if (existsContract) throw badRequest('User already created contract');
    const {scooterId, userCoords} = body;
    const [scooter, tariff] = await Promise.all([
        Scooter.getFreeScooterById(scooterId),
        Tariff.findOne()
    ]);
    if (!tariff) throw notFound('Tariff not found');
    const {coords} = scooter;
    const distance = Distance.between(userCoords, coords);
    if (distance > Distance(`${DISTANCE_BETWEEN_USER_AND_SCOOTER} m`)) throw conflict('Distance is too big');
    const now = new Date();
    const [contract, updateScooter] = await Promise.all([
        new Contract({
            scooter: scooter._id,
            user: user._id,
            active: true,
            period: 0,
            tariff: tariff._id,
            status: {
                value: 'start',
                updatedAt: now
            }
        }).save(),
        Scooter.updateFreeFlagOfScooter(scooter._id, false)
    ]);
    await ContractHistory({contract: contract._id, start: [{from: now, price: tariff.price || 0}]}).save();
    return contract;
};

exports.updateStatusOfContractToNormal = async (user) => {
    const [contract, tariff] = await Promise.all([
        this.getUserActiveContract(user),
        Tariff.findOne({type: 'normal'})
    ]);
    if (contract.status.value !== 'start' && contract.status.value !== 'pause' && contract.status.value !== 'stop') throw conflict('impossible');
    if (!tariff || !tariff.price) throw notFound('Tariff not found');
    contract.status.value = 'normal';

    await Promise.all([
        contract.save(),
        this.startStatus(contract._id, tariff.price, 'normal')
    ]);
};

exports.updateStatusOfContractToPause = async (user) => {
    const [contract, tariff] = await Promise.all([
        this.getUserActiveContract(user),
        Tariff.findOne({type: 'pause'})
    ]);
    if (contract.status.value !== 'normal') throw conflict('Impossible');
    if (!tariff) throw notFound('Tariff not found');
    const oldStatus = contract.status.value;
    contract.status.value = 'pause';

    await Promise.all([
        contract.save(),
        this.startStatus(contract._id, tariff.price, 'pause'),
        this.endStatus(contract._id, oldStatus)
    ]);
};

exports.updateStatusOfContractToStop = async (userId, contractId) => {
    const [contract, tariff] = await Promise.all([
        this.getUserActiveContractByContractId(userId, contractId),
        Tariff.findOne({type: 'stop'})
    ]);
    if (!['normal', 'pause', 'start'].includes(contract.status.value)) throw conflict('Impossible');
    if (!tariff) throw notFound('Tariff not found');
    const oldStatus = contract.status.value;
    contract.status.value = 'stop';

    await Promise.all([
        contract.save(),
        this.startStatus(contract._id, tariff.price, 'stop'),
        this.endStatus(contract._id, oldStatus)
    ]);
};

exports.updateStatusOfContractToExit = async (userId, contractId, cableImg, closedLockImg) => {
    const contract = await this.getUserActiveContractByContractId(userId, contractId);
    if (!cableImg || !closedLockImg) throw badRequest('Enter imgs names');
    contract.cableImg = cableImg;
    contract.closedLockImg = closedLockImg;
    contract.status.value = 'exit';

    await Promise.all([
        this.endStatus(contractId, 'stop'),
        Scooter.updateFreeFlagOfScooter(contract.scooter, true),
        contract.save(),
        ContractHistory({contract: contractId, type: 'exit', start: new Date()}).save()
    ]);
    return {message: 'ok'};
};  

exports.startStatus = async (contractId, tariffPrice, type) => {
    const now = new Date();
    return ContractHistory({contract: contractId, type, start: now, price: tariffPrice}).save();
};

exports.endStatus = async (contractId, type) => {
    return ContractHistory.updateOne({contract: contractId, type, end: {$exists: false}}, {$set: {end: new Date()}});
};

exports.checkSumOfContract = async (user) => {
    const contract = await this.getUserActiveContract(user);
    const histories = await ContractHistory.find({contract: contract._id});
    let sum = 0;
    for (const history of histories) {
        if (!history.end) history.end = new Date();
        const minutes = moment(history.end).diff(history.start, 'minutes');
        sum += minutes * history.price;
    }
    return {sum};
};

