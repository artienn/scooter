module.exports = {
    apps : [{
        name: 'scooter',
        script: 'index.js',
        env : {
            NODE_ENV: 'production',
            TZ: 'utc'
        }
    }, {
        name: 'flespi',
        script: 'scheduleFlespi.js',
        env : {
            NODE_ENV: 'production',
            TZ: 'utc'
        }
    }, {
        name: 'schedule',
        script: 'schedule.js',
        env : {
            NODE_ENV: 'production',
            TZ: 'utc'
        }
    }]
};