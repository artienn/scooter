require('./db')();
const schedule = require('node-schedule');
const Contract = require('./controllers/Contract');
const ContractModel = require('./schemas/Contract');
const Balance = require('./controllers/Balance');
const User = require('./schemas/User');
const fcm = require('./libs/fcm');
const {sendMessage} = require('./libs/sendSms');
const {scooterGoOutZone, blockScooterWarning} = require('./libs/scooterErrors');
const Scooter = require('./schemas/Scooter');
const {GoOutZoneOfScooter} = require('./schemas');


const updateUserBalance = async () => {
    let amount = 0;
    const {contracts} = await Contract.getUserActiveContracts();
    for (const contract of contracts) {
        if (!contract.user) {
            console.error('updateUserBalanceSchedule USER NOT FOUND', contract);
            continue;
        }
        const [{sum}, {userBalanceHistory}] = await Promise.all([
            Contract.checkSumAndPeriodOfContract(contract),
            Balance.getUserBalanceHistoryByContractId(contract.user._id, contract._id)
        ]);
        console.log(sum, contract.user, contract.scooter);
        amount -= sum;
        if (!contract.user.balance || contract.user.balance < 0) {
            const text = 'Недостатньо коштів на вашому рахунку! Поповніть рахунок і відновіть поїздку або відвезіть самокат на найближчу парковку!';
            await Contract.updateStatusOfContractToExit(null, contract._id, null, null, true);
            if (contract.user.firebaseIds && contract.user.firebaseIds.length) await fcm(contract.user.firebaseIds, {}, text);
            if (contract.user.phone) await sendMessage([contract.user.phone], text);
        }
        if (userBalanceHistory) {
            if (Math.abs(amount) < Math.abs(userBalanceHistory.amount)) amount = 0;
            else amount -= userBalanceHistory.amount;
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
    const scooters = await Scooter.find({});
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

schedule.scheduleJob('*/20 * * * * *', updateUserBalance);
schedule.scheduleJob('*/15 * * * * *', checkScooters);