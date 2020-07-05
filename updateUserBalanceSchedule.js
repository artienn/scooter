const schedule = require('node-schedule');
const Contract = require('./controllers/Contract');
const Balance = require('./controllers/Balance');
const User = require('./schemas/User');
const fcm = require('./libs/fcm');
const {sendMessage} = require('./libs/sendSms');

const updateUserBalance = async () => {
    let amount = 0;
    const contracts = await Contract.getUserActiveContracts();
    for (const contract of contracts) {
        if (!contract.user) {
            console.error('updateUserBalanceSchedule USER NOT FOUND', contract);
            continue;
        }
        const [{sum}, {userBalanceHistory}] = await Promise.all([
            Contract.checkSumAndPeriodOfContract(contract),
            Balance.getUserBalanceHistoryByContractId(contract.user._id, contract._id)
        ]);
        amount -= sum;
        if (!contract.user.balance || contract.user.balance < 0) {
            const text = 'Недостаточно средств на вашем счету! Пополните счет и возобновите поездку или отвезите самокат на ближайшую парковку!';
            await Contract.updateStatusOfContractToExit(contract.user, contract._id, null, null, true);
            if (contract.user.firebaseIds && contract.user.firebaseIds.length) await fcm(contract.user.firebaseIds, {}, text);
            if (contract.user.phone) await sendMessage([contract.user.phone], text);
        }
        if (userBalanceHistory) {
            amount += userBalanceHistory.amount;
            userBalanceHistory.amount += amount;
            await Promise.all([
                userBalanceHistory.save(),
                User.updateOne({_id: contract.user._id}, {$inc: {amount}})
            ]);
        } else {
            await Balance.putUserBalance(contract.user._id, - amount, 'contract', contract._id);
        }
    }
};

schedule.scheduleJob('*/10 * * * * *', updateUserBalance);