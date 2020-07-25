require('./db')();
const schedule = require('node-schedule');
const Contract = require('./controllers/Contract');
const ContractModel = require('./schemas/Contract');
const Balance = require('./controllers/Balance');
const User = require('./schemas/User');
const fcm = require('./libs/fcm');
const {checkDistanceOfIncomingValue} = require('./libs/geoLib');
const {sendMessage} = require('./libs/sendSms');
const {scooterGoOutZone, blockScooterWarning, scooterUpdateCoordsWithoutContract, scooterWithoutCoords} = require('./libs/scooterErrors');
const Scooter = require('./schemas/Scooter');
const {GoOutZoneOfScooter, ScooterCoordsWithoutContract} = require('./schemas');

const updateUserBalance = async () => {
    const {contracts} = await Contract.getUserActiveContracts();
    for (const contract of contracts) {
        let amount = 0;
        if (!contract.user) {
            console.error('updateUserBalanceSchedule USER NOT FOUND', contract);
            continue;
        }
        const [{sum}, {userBalanceHistory}] = await Promise.all([
            Contract.checkSumAndPeriodOfContract(contract),
            Balance.getUserBalanceHistoryByContractId(contract.user._id, contract._id)
        ]);
        console.log(sum, userBalanceHistory ? userBalanceHistory.amount : 0,  contract.user, contract.scooter);
        amount -= sum;
        if (!contract.user.balance || contract.user.balance < 0) {
            console.error('NULL BALANCE', contract && contract.scooter ? contract.scooter.name : 0, contract.user.balance);
            const text = 'Недостатньо коштів на вашому рахунку! Поповніть рахунок і відновіть поїздку або відвезіть самокат на найближчу парковку!';
            await Contract.updateStatusOfContractToExit(null, contract._id, null, null, true);
            if (contract.user.firebaseIds && contract.user.firebaseIds.length) await fcm(contract.user.firebaseIds, {}, text);
            if (contract.user.phone) await sendMessage([contract.user.phone], text);
        }
        if (userBalanceHistory) {
            amount = 0 - (sum - Math.abs(userBalanceHistory.amount));
            userBalanceHistory.amount += amount;
            await Promise.all([
                userBalanceHistory.save(),
                User.updateOne({_id: contract.user._id}, {$inc: {balance: amount}})
            ]);
        } else {
            await Balance.putUserBalance(contract.user._id, amount, 'contract', contract._id);
        }
    }
};

const checkScooters = async () => {
    const scooters = await Scooter.find({viewed: {$ne: false}});
    for (const scooter of scooters) {
        const result = await scooterGoOutZone(scooter);
        if (!result) {
            const contract = await ContractModel.findOne({scooter: scooter._id, active: true}).populate('user');
            const userPhone = (contract && contract.user) ? contract.user.phone : null;
            await blockScooterWarning(scooter._id, scooter.id, scooter.name, userPhone);
        } else {
            await GoOutZoneOfScooter.deleteMany({scooter: scooter._id});
        }
    }
};

const checkLocationUpdateScooterWithoutContract = async () => {
    const scooters = await Scooter.find({viewed: true, free: true});
    for (const scooter of scooters) {
        const scooterCoordsWithoutContract = await ScooterCoordsWithoutContract.findOne({scooter: scooter._id});
        if (!scooter.coords || !scooter.coords.lat || !scooter.coords.lon) {
            console.error('SCOOTER WITHOUT COORDS', scooter);
            await scooterWithoutCoords(scooter);
            continue;
        }
        if (scooterCoordsWithoutContract && scooterCoordsWithoutContract.lat && scooterCoordsWithoutContract.lon) {
            if (!checkDistanceOfIncomingValue({lat: scooterCoordsWithoutContract.lat, lon: scooterCoordsWithoutContract.lon}, {lat: scooter.coords.lat, lon: scooter.coords.lon})) {
                console.error('SCOOTER IS BEING STOLEN', scooter);
                await scooterUpdateCoordsWithoutContract(scooter);
            }
        } else {
            await ScooterCoordsWithoutContract({scooter: scooter._id, lat: scooter.coords.lat, lon: scooter.coords.lon}).save();
        }
        await ScooterCoordsWithoutContract.updateOne({scooter: scooter._id}, {$set: {lat: scooter.coords.lat, lon: scooter.coords.lon, updatedAt: new Date()}});
    }
};

schedule.scheduleJob('*/20 * * * * *', updateUserBalance);
schedule.scheduleJob('*/15 * * * * *', checkScooters);
schedule.scheduleJob('*/10 * * * * *', checkLocationUpdateScooterWithoutContract);