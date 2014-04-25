var thunkify    = require('thunkify');
var bcrypt      = require('bcrypt-nodejs');
var bCompare    = thunkify(bcrypt.compare);

var getAuthPassword = function getAuthPassword(header) {
    if(!header.hasOwnProperty('authorization'))
        return false;

    return header.authorization;

};

module.exports = function*(circle, header) {
    if(circle.hasOwnProperty('password') && circle.password !== '') {
        var password = getAuthPassword(header);

        try {
            var res = yield bCompare(password, circle.password);

            if(!password || !res)
                return false;

        } catch(e) {
            return false;
        }

        return true;
    }
};