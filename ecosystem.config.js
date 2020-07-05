module.exports = {
    apps : [{
        name: 'scooter',
        script: 'index.js',
        env : {
            NODE_ENV: 'production',
            TZ: 'utc'
        }
    }, {
        name: 'scooters',
        script: 'schedule.js',
        env : {
            NODE_ENV: 'production',
            TZ: 'utc'
        }
    }, {
        name: 'scooter_user_balance',
        script: 'updateUserBalanceSchedule.js',
        env : {
            NODE_ENV: 'production',
            TZ: 'utc'
        }
    }]
};