module.exports = () => { 
    const possible = '0123456789';
    let string = '';
    for (let i = 0; i < 4; i++) {
        string += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    string += string.substr(0,2);
    return string;
};