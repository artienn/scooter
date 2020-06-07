const {Tariff, Contract, ContractHistory} = require('../schemas');
const {conflict, badRequest, notFound} = require('boom');
const Scooter = require('./Scooter');
const Balance = require('./Balance');
const Distance = require('geo-distance');
const geoLib = require('../libs/geoLib');
const moment = require('moment');
const DISTANCE_BETWEEN_USER_AND_SCOOTER = 5;
const STOP = 'stop';
const NORMAL = 'normal';
const PAUSE = 'pause';
const START = 'start';
const EXIT = 'exit';

exports.getUserActiveContracts = async (user) => {
    const contracts = await Contract.find({user: user._id, active: true}).lean();
    return {
        contracts: contracts.map(c => {
            c.period = moment().diff(c.createdAt, 'seconds');
            return c;
        }), 
        contractsCount: contracts.length
    };
};

exports.getUserContracts = async (user) => {
    const contracts = await Contract.find({user: user._id});
    return contracts;
};

exports.getUserActiveContractByContractId = async (userId, contractId) => {
    if (!contractId) throw badRequest('Enter contractId');
    const contract = await Contract.findOne({user: userId, _id: contractId, active: true});
    if (!contract) throw notFound('Contract nor found');
    
    return contract;
};

exports.createContract = async (user, body) => {
    const existsContracts = await exports.getUserActiveContracts(user);
    if (existsContracts.contractsCount >= 3) throw badRequest('User already created 3 contracts');
    const {scooterId, userCoords, code} = body;
    if (!scooterId || !userCoords) throw badRequest('Enter data');
    const [scooter, tariff, promocode] = await Promise.all([
        Scooter.getFreeScooterById(scooterId),
        Tariff.findOne({type: START}),
        Balance.getActivePromocode(code, false)
    ]);
    if (!tariff) throw notFound('Tariff not found');
    const {coords} = scooter;
    if (!geoLib.checkDistance(userCoords, coords)) throw conflict('Distance is too big');
    const now = new Date();
    const [contract] = await Promise.all([
        new Contract({
            scooter: scooter._id,
            user: user._id,
            active: true,
            period: 0,
            tariff: tariff._id,
            status: {
                value: START,
                updatedAt: now
            },
            promocode: code,
            contractStatusPromocode: promocode ? promocode.contractStatus : null,
            salePercentPromocode: promocode ? promocode.salePercent : null,
        }).save(),
        Scooter.updateFreeFlagOfScooter(scooter._id, false)
    ]);
    await ContractHistory({contract: contract._id, start: now, price: tariff.price }).save();
    return contract;
};

exports.updateStatusOfContractToNormal = async (user, contractId) => {
    const [contract, tariff] = await Promise.all([
        exports.getUserActiveContractByContractId(user._id, contractId),
        Tariff.findOne({type: NORMAL})
    ]);
    if (contract.status.value !== START && contract.status.value !== PAUSE && contract.status.value !== STOP) throw conflict('impossible');
    if (!tariff || !tariff.price) throw notFound('Tariff not found');
    contract.status.value = NORMAL;
    const salePercentPromocode = contract.contractStatusPromocode === NORMAL ? contract.salePercentPromocode : null;
    await Promise.all([
        contract.save(),
        exports.startStatus(contract._id, tariff.price, NORMAL, salePercentPromocode)
    ]);
    return exports.checkSumAndPeriodOfContract(user, contract);
};

exports.updateStatusOfContractToPause = async (user, contractId) => {
    const [contract, tariff] = await Promise.all([
        exports.getUserActiveContractByContractId(user._id, contractId),
        Tariff.findOne({type: PAUSE})
    ]);
    if (contract.status.value !== NORMAL) throw conflict('Impossible');
    if (!tariff) throw notFound('Tariff not found');
    const oldStatus = contract.status.value;
    contract.status.value = PAUSE;
    const salePercentPromocode = contract.contractStatusPromocode === PAUSE ? contract.salePercentPromocode : null;
    await Promise.all([
        contract.save(),
        exports.startStatus(contract._id, tariff.price, PAUSE, salePercentPromocode),
        exports.endStatus(contract._id, oldStatus)
    ]);
    return exports.checkSumAndPeriodOfContract(user, contract);
};

exports.updateStatusOfContractToStop = async (user, contractId) => {
    const [contract, tariff] = await Promise.all([
        exports.getUserActiveContractByContractId(user._id, contractId),
        Tariff.findOne({type: STOP})
    ]);
    if (![NORMAL, PAUSE, START].includes(contract.status.value)) throw conflict('Impossible');
    if (!tariff) throw notFound('Tariff not found');
    const oldStatus = contract.status.value;
    contract.status.value = STOP;
    const salePercentPromocode = contract.contractStatusPromocode === STOP ? contract.salePercentPromocode : null;
    await Promise.all([
        contract.save(),
        exports.startStatus(contract._id, tariff.price, STOP, salePercentPromocode),
        exports.endStatus(contract._id, oldStatus)
    ]);
    return exports.checkSumAndPeriodOfContract(user, contract);
};

exports.updateStatusOfContractToExit = async (user, contractId, cableImg, closedLockImg) => {
    const contract = await exports.getUserActiveContractByContractId(user._id, contractId);
    if (!cableImg || !closedLockImg) throw badRequest('Enter imgs names');
    contract.cableImg = cableImg;
    contract.closedLockImg = closedLockImg;
    contract.status.value = EXIT;
    contract.active = false;

    await Promise.all([
        exports.endStatus(contractId, STOP),
        Scooter.updateFreeFlagOfScooter(contract.scooter, true),
        contract.save(),
        ContractHistory({contract: contractId, type: EXIT, start: new Date()}).save()
    ]);
    return exports.checkSumAndPeriodOfContract(user, contract);
};  

exports.startStatus = async (contractId, tariffPrice, type, salePercent = null) => {
    const now = new Date();
    // tariffPrice = salePercent && salePercent < 100 ? (tariffPrice / 100) * (100 - salePercent) : tariffPrice;
    return ContractHistory({contract: contractId, type, start: now, price: tariffPrice, salePercent}).save();
};

exports.endStatus = async (contractId, type) => {
    return ContractHistory.updateOne({contract: contractId, type, end: {$exists: false}}, {$set: {end: new Date()}});
};

exports.checkSumAndPeriodOfContract = async (contract = null) => {
    if (!contract) return;
    const histories = await ContractHistory.find({contract: contract._id, type: {$ne: EXIT}});
    let sum = 0;
    let period = 0;
    let saleAmount = 0;
    for (const history of histories) {
        if (!history.end) history.end = new Date();
        let periodSum = 0;
        let saleSum = 0;
        const minutes = Math.ceil(moment(history.end).diff(history.start, 'minutes', true));
        history.price = history.salePercent && history.salePercent <= 100 ? (history.price / 100) * (100 - history.salePercent) : history.price;
        periodSum += minutes * history.price;
        saleSum += minutes * ((history.price / 100) * (100 - (history.salePercent || 0)));
        if (saleSum > periodSum) saleSum = periodSum;
        periodSum -= saleSum;
        period += minutes;
        sum += periodSum;
        saleAmount += saleSum;
    }
    return {sum, period, saleAmount};
};
