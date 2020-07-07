require('../db')();
const {Scooter} = require('../schemas');
const {lockScooter} = require('../libs/flespi');

const a = async () => {
    const scooters = await Scooter.find({lock: false});
    for (const scooter of scooters) {
        await lockScooter(scooter.id, true);
    }
};

a();