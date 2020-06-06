require('../db')();
const {Admin} = require('../schemas');
const auth = require('vvdev-auth');

const a = async () => {
    const password = 'js(AJKsndi292nISAd289iwd).Is82m89h3';
    const hash = await auth.hashPassword(password);
    await Admin({
        login: 'scooterAdmin',
        password: hash
    }).save();
    console.log('success');
};

a();