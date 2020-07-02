const mongoose = require('mongoose');

module.exports = () => {
    mongoose.Promise = global.Promise;
    mongoose.connect('mongodb://localhost:27017/scooter', { useNewUrlParser: true, useUnifiedTopology: true});
    mongoose.set('useCreateIndex', true);
};