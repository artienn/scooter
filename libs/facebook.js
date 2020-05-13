const rpn = require('request-promise-native');
const {facebook} = require('../config');

exports.checkCode = async (code) => {
    const options = {
        uri: `https://graph.facebook.com/v6.0/oauth/access_token?client_id=${facebook.appID}&redirect_uri=${facebook.callbackUrl}&client_secret=${facebook.appSecret}&code=${code}`,
        json: true
    };
    return rpn(options)
        .then(result => {
            return result;
        });
};

exports.data = async (token) => {
    const options = {
        uri: `https://graph.facebook.com/debug_token?input_token=${token}
        &access_token=${facebook.accessToken}`,
        json: true
    };
    return rpn(options) 
        .then(result => {
            return result;
        });
};