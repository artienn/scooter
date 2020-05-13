require('../db')();
const {Scooter, Tariff} = require('../schemas');
console.log(Tariff)
const f = async () => {
    await Scooter({lockId: 1,
        free: true,
        coords: {
            lat: 50,
            lon: 50,
            updatedAt: new Date()
        },
        battery: 90
    }).save();
    await Tariff({
        type: 'stop',
        name: 'stop',
        price: 1
    }).save();
    await Tariff({
        type: 'start',
        name: 'start',
        price: 0
    }).save();
    await Tariff({
        type: 'pause',
        name: 'pause',
        price: 5
    }).save();
    await Tariff({
        type: 'exit',
        name: 'exit',
        price: 0
    }).save();
    await Tariff({
        type: 'normal',
        name: 'normal',
        price: 10
    }).save();
};

f();