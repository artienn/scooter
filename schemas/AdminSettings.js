const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const workTimeObject = {
    from: String,
    to: String
};

const AdminSettings = new Schema({
    phones: [String],
    scooterUserDistanceError: Number, //m
    UserBalanceMinAmount: {
        type: Number,
        default: 50
    },
    workTime: {
        0: workTimeObject,
        1: workTimeObject,
        2: workTimeObject,
        3: workTimeObject,
        4: workTimeObject,
        5: workTimeObject,
        6: workTimeObject
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('admin_settings', AdminSettings);