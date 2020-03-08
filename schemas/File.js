const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const File = new Schema({
    name: String,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('file', File);