const express = require('express');
const app = express();

const config = require('./config');
const port = process.env.PORT || config.port;

const {notFound} = require('boom');
const mongooseValidationErrors = require('./libs/mongooseValidationErrors');

require('./db')();
const {checkUser} = require('./libs/jwt');

app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use(require('cors')({
    'origin': true,
    'methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'allowedHeaders': ['Content-Type','x-access-token', 'user-agent'],
    'optionsSuccessStatus': 200
}) );

app.use((req, _res, next) => {
    console.log(`${new Date()} ${req.ip}:${req.method} ${req.url}`);
    next();
});

app.use('/public', checkUser,express.static('./public'));

app.use('/api', require('./routes'));

app.use((_req, _res, next) => {
    next(notFound('Not found'));
});

app.use((error, _req, res, next) => {
    if(error.name === 'ValidationError' && error.errors) {
        return res.status(400).send(mongooseValidationErrors(error.errors));
    }
    next(error);
});


app.use((error, _req, res, _next) => {
    const status = (error && error.output) ? error.output.statusCode : 500;
    console.error(error);
    res.status(status).send({message: error.message});
});

app.listen(port, () => {
    console.log('Listen on ' + port);
});

