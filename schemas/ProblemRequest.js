const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProblemRequest = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    scooter: {
        type: Schema.Types.ObjectId,
        ref: 'scooter'
    },
    description: String
}, {
    timestamps: true
});

module.exports = mongoose.model('problem_request', ProblemRequest);