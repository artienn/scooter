const rpn = require('request-promise-native');
const {facebook} = require('../config');

module.exports = async (code) => {
    const options = {
        uri: `https://graph.facebook.com/v6.0/oauth/access_token?client_id=${facebook.appID}&redirect_uri=${facebook.callbackUrl}&client_secret=${facebook.appSecret}&code=${code}`
    };
    return rpn(options)
        .then(result => {
            console.log(result);
        });
};