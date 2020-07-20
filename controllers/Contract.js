const {Tariff, Contract, ContractHistory, User} = require('../schemas');
const {conflict, badRequest, notFound} = require('boom');
const Scooter = require('./Scooter');
const Balance = require('./Balance');
const Distance = require('geo-distance');
const geoLib = require('../libs/geoLib');
const moment = require('moment');
const DISTANCE_BETWEEN_USER_AND_SCOOTER = 5;
const flespi = require('../libs/flespi');
const STOP = 'stop';
const NORMAL = 'normal';
const PAUSE = 'pause';
const UNLOCK = 'start';
const EXIT = 'exit';

const notUserOnUpdateContractStatus = async (contractId) => {
    const contract = await Contract.findById(contractId);
    if (!contract) throw notFound('Contract not found');
    const user = await User.findById(contract.user);
    return user;
};

exports.getUserActiveContracts = async (user = null, active = true) => {
    const query = {};
    if (active) query.active = true;
    if (user) query.user = user._id;
    const contracts = await Contract.find(query).populate({path: 'user', model: 'user', select: '_id phone balance firstName lastName'}).populate({path: 'scooter', model: 'scooter', select: '_id battery name'}).lean();
    return {
        contracts,
        contractsCount: contracts.length
    };
};

exports.getUserContracts = async (user) => {
    const contracts = await Contract.find({user: user._id});
    return contracts;
};

exports.getUserContractById = async (user, contractId) => {
    const query = {_id: contractId};
    if (user.userType) query.user = user._id;
    const contract = await Contract.findOne(query).lean();
    if (!contract) throw notFound('Contract not found');
    const result = {contract};
    if (contract.active) {
        contract.contractData = await exports.checkSumAndPeriodOfContract(contract);
    }
    return result;
};

exports.getUserActiveContractByContractId = async (userId, contractId) => {
    if (!contractId) throw badRequest('Enter contractId');
    const contract = await Contract.findOne({user: userId, _id: contractId, active: true}).populate('scooter');
    if (!contract) throw notFound('Contract nor found');
    
    return contract;
};

exports.createContract = async (user, body) => {
    const existsContracts = await exports.getUserActiveContracts(user);
    if (existsContracts.contractsCount >= 3) throw badRequest('User already created 3 contracts');
    const {scooterId, userCoords, code} = body;
    if (!scooterId || !userCoords) throw badRequest('Enter data');
    if (!user.balance || user.balance < 50) throw conflict('Pay on your balance');
    const [scooter, tariffUnlock, promocode] = await Promise.all([
        Scooter.getFreeScooterById(scooterId),
        Tariff.findOne({type: UNLOCK, userType: user.type || 'normal'}),
        Balance.getActivePromocode(code, false)
    ]);
    if (!tariffUnlock) throw notFound('Tariff not found');
    if (!scooter.battery || scooter.battery < 5) throw conflict('Battery is empty');
    if (scooter.viewed === false) throw conflict('Scooter not viewed');
    const {coords} = scooter;
    // if (!geoLib.checkDistance(userCoords, coords)) throw conflict('Distance is too big');
    const now = new Date();
    const [contract] = await Promise.all([
        new Contract({
            scooter: scooter._id,
            user: user._id,
            active: true,
            period: 0,
            status: {
                value: UNLOCK,
                updatedAt: now
            },
            promocode: code,
            contractStatusPromocode: promocode ? promocode.contractStatus : null,
            salePercentPromocode: promocode ? promocode.salePercent : null,
        }).save(),
        Scooter.updateFreeFlagOfScooter(scooter._id, false, scooter.id)
    ]);
    await ContractHistory({contract: contract._id, type: UNLOCK, start: now, end: now, price: tariffUnlock.price, click: true}).save();
    return contract;
};

exports.updateStatusOfContractToNormal = async (user, contractId) => {
    if (!user) {
        user = await notUserOnUpdateContractStatus(contractId);
    }
    const [contract, tariff] = await Promise.all([
        exports.getUserActiveContractByContractId(user._id, contractId),
        Tariff.findOne({type: NORMAL, userType: user.type || 'normal'})
    ]);
    if (![STOP, PAUSE, UNLOCK].includes(contract.status.value)) throw conflict('impossible');
    if (!tariff || !tariff.price) throw notFound('Tariff not found');
    const oldStatus = contract.status.value;
    contract.status.value = NORMAL;
    const salePercentPromocode = contract.contractStatusPromocode === 'all' || contract.contractStatusPromocode === NORMAL ? contract.salePercentPromocode : null;
    await Promise.all([
        contract.save(),
        flespi.lockScooter(contract.scooter.id, false),
        exports.startStatus(contract._id, tariff.price, NORMAL, salePercentPromocode),
        oldStatus === UNLOCK ? null : exports.endStatus(contract._id, oldStatus)
    ]);
    return exports.checkSumAndPeriodOfContract(contract);
};

exports.updateStatusOfContractToPause = async (user, contractId) => {
    if (!user) {
        user = await notUserOnUpdateContractStatus(contractId);
    }
    const [contract, tariff] = await Promise.all([
        exports.getUserActiveContractByContractId(user._id, contractId),
        Tariff.findOne({type: PAUSE, userType: user.type})
    ]);
    if (contract.status.value !== NORMAL) throw conflict('Impossible');
    if (!tariff) throw notFound('Tariff not found');
    const oldStatus = contract.status.value;
    contract.status.value = PAUSE;
    const salePercentPromocode = contract.contractStatusPromocode === 'all' || contract.contractStatusPromocode === PAUSE ? contract.salePercentPromocode : null;
    await Promise.all([
        contract.save(),
        flespi.lockScooter(contract.scooter.id, true),
        exports.startStatus(contract._id, tariff.price, PAUSE, salePercentPromocode),
        exports.endStatus(contract._id, oldStatus)
    ]);
    return exports.checkSumAndPeriodOfContract(contract);
};

exports.updateStatusOfContractToStop = async (user, contractId) => {
    if (!user) {
        user = await notUserOnUpdateContractStatus(contractId);
    }
    const [contract, tariff] = await Promise.all([
        exports.getUserActiveContractByContractId(user._id, contractId),
        Tariff.findOne({type: STOP, userType: user.type})
    ]);
    if (![NORMAL, PAUSE].includes(contract.status.value)) throw conflict('Impossible');
    if (!tariff) throw notFound('Tariff not found');
    const oldStatus = contract.status.value;
    contract.status.value = STOP;
    const salePercentPromocode = contract.contractStatusPromocode === 'all' || contract.contractStatusPromocode === STOP ? contract.salePercentPromocode : null;
    await Promise.all([
        contract.save(),
        oldStatus === PAUSE ? flespi.lockScooter(contract.scooter.id, false) : null,
        exports.startStatus(contract._id, tariff.price, STOP, salePercentPromocode),
        flespi.lockScooter(contract.scooter.id, true),
        exports.endStatus(contract._id, oldStatus)
    ]);
    return exports.checkSumAndPeriodOfContract(contract);
};

exports.updateStatusOfContractToExit = async (user, contractId, cableImg, closedLockImg, warning = false) => {
    const isAdmin = user ? false : true;
    if (!user) {
        user = await notUserOnUpdateContractStatus(contractId);
    }
    const contract = await exports.getUserActiveContractByContractId(user._id, contractId);
    // if ((!closedLockImg) && !warning) throw badRequest('Enter imgs names');
    if (!isAdmin && ![STOP].includes(contract.status.value)) throw conflict('Impossible');
    contract.cableImg = cableImg;
    contract.closedLockImg = closedLockImg;
    contract.status.value = EXIT;
    contract.active = false;

    await Promise.all([
        exports.endStatus(contractId, STOP),
        Scooter.updateFreeFlagOfScooter(contract.scooter._id, true, contract.scooter.id),
        contract.save(),
        ContractHistory({contract: contractId, type: EXIT, start: new Date(), end: new Date(), click: true}).save()
    ]);
    const {sum, period, saleAmount} = await exports.checkSumAndPeriodOfContract(contract);
    await Contract.updateOne({_id: contractId}, {$set: {sum, period, saleAmount}});
    return {sum, period, saleAmount};
};  

exports.startStatus = async (contractId, tariffPrice, type, salePercent = null) => {
    const now = new Date();
    // tariffPrice = salePercent && salePercent < 100 ? (tariffPrice / 100) * (100 - salePercent) : tariffPrice;
    const click = [NORMAL, PAUSE, STOP].includes(type) ? false : true;
    return ContractHistory({contract: contractId, type, start: now, price: tariffPrice, salePercent, click, end: null}).save();
};

exports.endStatus = async (contractId, type) => {
    return ContractHistory.updateOne({contract: contractId, type, end: null}, {$set: {end: new Date()}});
};

exports.checkSumAndPeriodOfContract = async (contract = null) => {
    if (!contract) return;
    const histories = await ContractHistory.find({contract: contract._id, type: {$ne: EXIT}});
    let sum = 0;
    let period = 0;
    let saleAmount = 0;
    for (const history of histories) {
        console.log(history);
        if (!history.end) history.end = new Date();
        let periodSum = 0;
        let saleSum = 0;
        // const minutes = Math.ceil(moment(history.end).diff(history.start, 'minutes', true));
        const seconds = Math.ceil(moment(history.end).diff(history.start, 'seconds'));
        console.log(seconds);
        history.price = history.salePercent && history.salePercent <= 100 ? (history.price / 100) * (100 - history.salePercent) : history.price;
        if (!history.click) periodSum += seconds * history.price;
        else periodSum += history.price;
        saleSum += seconds * ((history.price / 100) * (history.salePercent || 0));
        if (saleSum > periodSum) saleSum = periodSum;
        periodSum -= saleSum;
        period += seconds;
        sum += periodSum;
        saleAmount += saleSum;
    }
    sum = Math.ceil(sum);
    period = Math.ceil(period);
    saleAmount = Math.ceil(saleAmount);
    return {sum, period, saleAmount};
};

exports.checkSumAndPeriodOfContractByUser = async (user, contractId) => {
    const contract = await exports.getUserActiveContractByContractId(user._id, contractId);
    const result = await exports.checkSumAndPeriodOfContract(contract);
    return result;
};