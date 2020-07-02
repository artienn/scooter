const schedule = require('node-schedule');
const {SystemQueue} = require('./schemas');
const fcm = require('./libs/fcm');

const queueSend = async () => {
    try {
        const message = await SystemQueue.findOne();
        if (!message) return;
        if (message.type === 'push') {
            const {firebaseIds, body, text} = message;
            if (firebaseIds && firebaseIds.length && text)
                await fcm(firebaseIds, body || {}, text || '');
        }
        return SystemQueue.deleteOne({_id: message._id});
    } catch (err) {
        console.error(err);
        return;
    }
};

schedule.scheduleJob('*/5 * * * * *', queueSend);