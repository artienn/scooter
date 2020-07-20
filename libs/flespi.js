const mqtt = require('mqtt');
const option = {
    wsOptions : {
        objectMode : false,
        perMessageDeflate : true,
    },
    host : 'wss://mqtt.flespi.io:443',
    keepalive : 60,
    protocolVersion : 5,
    reconnectPeriod: 10000,
    resubscribe : false,
    clean : true,
    username : 'hOcM18lL3ElPrRZ7jVbUbH6MV4CckBNqdQ23McEFENiVu8QBRRlSofu87UagmNwn',
    properties : {
        requestResponseInformation : false,
        requestProblemInformation : false,
        topicAliasMaximum : 65535
    }
};

const client = mqtt.connect('mqtt://mqtt.flespi.io', option);



client.on('connect', () => {
    client.subscribe('flespi/rest/put/gw/devices/+/settings/sclockctrl', {qos: 0}, (err) => {
        if (err) console.error(err);
    });
    
});

exports.lockScooter = (scooterId, lock) => {
    console.log('Publish lock', scooterId, lock);
    client.publish(`flespi/rest/put/gw/devices/${scooterId}/settings/sclockctrl`, `{"address":"connection","properties":{"lock": ${lock === true ? 1 : 0}}}`);
};

client.on('message', (topic, message) => {
    console.log(topic, message.toString());
});