const schedule = require('node-schedule');
const Contract = require('./controllers/Contract');
const Balance = require('./controllers/Balance');

const updateUserBalance = async () => {
    const contracts = await Contract.getUserActiveContracts();
    for (const contract of contracts) {
        const {sum} = await Contract.checkSumAndPeriodOfContract(contract);
        await Balance.putUserBalance(contract.user, - sum, 'contract', contract._id);
    }
};