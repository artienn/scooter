const {smsService} = require('../config');
const rpn = require('request-promise-native');

exports.sendMessage = async (recipients, text) => {
    const options = {
        uri: `${smsService.uri}/message/send.json`,
        method: 'POST',
        json: true,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${smsService.token}`
        },
        body: {
            sms: {
                text,
                sender: smsService.sender || 'Market'
            },
            recipients
        }
    };
    return rpn(options)
        .then(result => {
            console.log('SEND SMS', result);
            return result;
        });
};