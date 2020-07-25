const {fcmKey} = require('../config');
const rpn = require('request-promise-native');
const NODE_ENV = process.env.NODE_ENV;

module.exports = async (firebaseIds, body, text) => {
    if (NODE_ENV === 'develop') return;
    let options = {
        url: 'https://fcm.googleapis.com/fcm/send',
        method: 'POST',
        json: {
            registration_ids: firebaseIds,
            notification: {
                body: text,
                sound: 'default'
            },
            data: {
                body
            },
            'content_available':true,
            'priority':'high'
        },
        headers: {
            'Content-Type':'application/json',
            'Authorization':'key=' + fcmKey
        }
    };
    return rpn(options);
};

