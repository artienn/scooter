const mqtt = require('mqtt');
const schedule = require('node-schedule');
const {Scooter} = require('./schemas');
require('./db')();

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
let data = {};

const client = mqtt.connect('mqtt://mqtt.flespi.io', option);


client.on('connect', () => {
    console.log('connect');
    client.subscribe('flespi/message/gw/devices/+', {qos: 0}, (err) => {
        if (err) console.error(err);
    });
    client.subscribe('flespi/state/gw/devices/+/telemetry/+', {qos: 0}, (err) => {
        if (err) console.error(err);
    });
});

client.on('message', (topic, message) => {
    if (/telemetry/.test(topic)) parseTelemetry(topic, message);
    else if (/flespi\/message\/gw\/devices/.test(topic)) deviseName(topic, message);
});

const deviseName = (topic, message) => {
    const topics = topic.split('/');
    const deviceId = topics[4];
    const json = JSON.parse(message.toString());
    const name = json['device.name'];
    if (!data[deviceId]) data[deviceId] = {};
    data[deviceId].name = name;
};

const keysValues = {
    'position.longitude': 'lon',
    'battery.level': 'battery',
    'position.latitude': 'lat',
    'lock.status': 'lock'
};

const parseTelemetry = (topic, message) => {
    const topics = topic.split('/');
    const deviceId = topics[4];
    const key = topics.slice(6)[0];
    if (!keysValues[key]) return;
    if (!data[deviceId]) data[deviceId] = {};
    data[deviceId][keysValues[key]] = message.toString();
    if (key === 'lock.status') data[deviceId][keysValues[key]] = data[deviceId][keysValues[key]] === 'true' ? true : false;
};

const updateData = async () => {
    const newData = JSON.parse(JSON.stringify(data));
    for (const key in newData) {
        const scooter = await Scooter.findOne({id: key});
        if (!scooter) {
            await Scooter({
                id: key,
                lock: newData[key].lock === true || newData[key].lock === false ? newData[key].lock : true,
                coords: {
                    lat: newData[key].lat,
                    lon: newData[key].lon,
                    updatedAt: new Date()
                },
                battery: newData[key].battery,
                free: newData[key].lock === true || newData[key].lock === false ? newData[key].lock : true,
                name: newData[key].name
            }).save();
            continue;
        }
        scooter.name = newData[key].name || scooter.name || null;
        scooter.coords = {
            lat: newData[key].lat,
            lon: newData[key].lon,
            updatedAt: new Date()
        };
        scooter.battery = newData[key].battery;
        scooter.lock = newData[key].lock === true || newData[key].lock === false ? newData[key].lock : scooter.lock || true;
        scooter.name = newData[key].name || scooter.name || null;
        await scooter.save();
    }
};


schedule.scheduleJob('*/10 * * * * *', updateData);