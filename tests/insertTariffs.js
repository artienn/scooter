require('../db')();
const {Tariff} = require('../schemas');

const a = async () => {
    await Tariff.insertMany([{type: 'unlock', userType: 'normal', price: 20}]);
};

a();