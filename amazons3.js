var AWS     = require('aws-sdk');
var fs      = require('fs');
var s3      = new AWS.S3();

if( !('AWS_ACCESS_KEY_ID' in process.env))
    console.log('No AWS credentials set!');

module.exports.uploadFile = function(path, mimeType, cb) {

    var filename = path.replace(/^.*[\\\/]/, '');

    readFile(path, function(err, data) {
        if(err)
            return console.log(err);

        var params = {
            Bucket: 'circlephotos',
            Key: 'photos/' + filename,
            ACL: 'public-read',
            ContentType: mimeType,
            Body: data,
            ServerSideEncryption: 'AES256'
        };

        s3.putObject(params, function(err) {
            if (err)
                console.log(err);

            cb();
        });

    });

};

var readFile = function readFile(path, cb) {

    fs.readFile(path, function read(err, data) {
        if (err)
            cb(err, null);

        cb(null, data);

    });

};

