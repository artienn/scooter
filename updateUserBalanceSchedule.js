const schedule = require('node-schedule');
const Contract = require('./controllers/Contract');
const Balance = require('./controllers/Balance');
const User = require('./schemas/User');

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
        if (userBalanceHistory) {
            amount += userBalanceHistory.amount;
            userBalanceHistory.amount += amount;
            await Promise.all([
                userBalanceHistory.save(),
                User.updateOne({_id: contract.user}, {$inc: {amount}})
            ]);
        } else {
            await Balance.putUserBalance(contract.user, - amount, 'contract', contract._id);
        }
    }
};


schedule.scheduleJob('0 */1 * * * *', updateUserBalance);