require('../db')();
const {User} = require('../schemas');
const {sign} = require('../libs/jwt');
const a = async () => {
    console.log(User);
    return User.findOne()
        .then(async user => {
            if (!user) return console.error('User not found');
            const token = await sign({_id: user._id});
            console.log(token);
        })
        .catch(err => {
            console.error(err);
        });
};

a();