const {SystemQueue} = require('../schemas');

exports.addToSystemQueue = async (type = 'push', phone = '', firebaseIds = [], text = '', body = {}) => {
    await SystemQueue({
        type,
        phone,
        firebaseIds,
        text,
        body
    }).save();
    return;
};