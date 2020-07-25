const {conflict} = require('boom');

exports.existsMany = async (model, queries) => {
    let message = 'Сущность с такими данным ';
    let flag = false;
    const essences = await Promise.all(queries.map(q => {
        return model.findOne(q);
    }));
    for (const e of essences) {
        if (e) {
            message += JSON.stringify(e) + ',';
            flag = true;
        }
    }
    message += ' уже существует';
    message = message.replace(/\"/gi, '');
    message = message.replace(/{/gi, '');
    message = message.replace(/}/gi, '');
    if (flag) throw conflict(message);
    return essences;
};