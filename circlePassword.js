 var getAuthPassword = function getAuthPassword(header) {
    if(!header.hasOwnProperty('authorization'))
        return false;

    return header.authorization;

 };

module.exports = function ensurePassword(circle, header) {
    if(circle.hasOwnProperty('password') && circle.password !== '') {
            var password = getAuthPassword(header);

            try {
                var res = yield bCompare(password, circle.password);

                if(!password || !res)
                    throw "Password not set/wrong";

            } catch(e) {
                console.log("Password error:", e);

                this.status = 403;
                return;
            }
        }

}