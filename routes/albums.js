var wrap        = require('co-monk');
var parse       = require('co-busboy');
var easyimg     = require('easyimage');
var s3          = require('../amazons3');
var fs          = require('fs');
var async       = require('async');
var devnull     = require('dev-null');

var auth        = require('./authorization');

var circlesCollection;
var albumsCollection;
var photosCollection;

var THUMB_HEIGHT = 180;
var AWS_PUBLIC;

var photoQueue = async.queue(function (task, callback) {

    var paths   = task.paths;
    var photo   = task.photo;

    async.series([
        function autoRotate(callback) {
            var command = 'convert ' + paths.path + ' -auto-orient ' + paths.path;
            easyimg.exec(command, function(err) {
                if (err)
                    console.log('Auto-orient failed: ', err);
                callback();
            });
        },
        function generateThumb(callback) {
            generateThumbnail(paths.path, paths.path_tn, callback);
        },
        function uploadPhoto(callback) {
            s3.uploadFile(paths.path, paths.mimeType, callback);
        },
        function uploadThumb(callback) {
            s3.uploadFile(paths.path_tn, paths.mimeType, callback);
        }

    ], function(err) {
        if(err)
            console.log('Error while processing file: ', err);

        // Save photo state
        photo.uploaded = true;
        photo.extension = paths.extension;
        photosCollection.updateById(photo._id, photo);

        // Unlink files
        if (fs.existsSync(paths.path))
            fs.unlink(paths.path);
        if (fs.existsSync(paths.path_tn))
            fs.unlink(paths.path_tn);

        var examplePhoto = AWS_PUBLIC + photo.albumId + '_' + photo._id + '_tn.' + photo.extension;
        albumsCollection.updateById(photo.albumId, {'$set': { examplePhoto: examplePhoto }}, callback);

    });

}, 2);

var generateThumbnail = function generateThumbnail(filepath, filepath_tn, cb) {

    easyimg.thumbnail({
        src: filepath,
        dst: filepath_tn,
        height: THUMB_HEIGHT, width: THUMB_HEIGHT*2,
        x:0, y:0
    }, function(err) {
        if (err)
            cb('Thumbnail generation error:' + err);

        cb();
    });
};

var saveFile = function saveFile(file, cb) {

    var stream = fs.createWriteStream(file.paths.path);
    var p = file.content.pipe(stream);

    p.on('finish', function() {
        cb(file);
    });
};

var getExtension = function (filename) {
    if(filename.indexOf('.') === -1 )
        return '';

    return filename.split('.').pop().toLowerCase();
};

var getPaths = function getPaths(photo, file) {

    var fileExtension   = getExtension(file.filename);
    var filepath        = '/tmp/' + photo.albumId + '_' + photo._id + '.' + fileExtension;
    var filepath_tn     = '/tmp/' + photo.albumId + '_' + photo._id + '_tn.' + fileExtension;

    return {
        extension: fileExtension,
        path: filepath,
        path_tn: filepath_tn,
        mimeType: file.mimeType
    };

};

module.exports = function(router, db, AWS_URI) {

    AWS_PUBLIC = AWS_URI;

    circlesCollection  = wrap(db.get('circles'));
    albumsCollection   = wrap(db.get('albums'));
    photosCollection   = wrap(db.get('photos'));

    router.get('/albums/:id', function*() {
        var id = this.params.id;

        var album   = yield albumsCollection.findById(id);
        var circle  = yield circlesCollection.findById(album.circleId);

        if(!album || !circle) {
            this.status = 404;
            return;
        }

        var authenticated = yield auth(circle, this.request.header);
        if(!authenticated) {
            this.status = 403;
            return;
        }

        var photos  = yield photosCollection.find({albumId: album._id});

        photos = photos.map(function(p) {
            var tn_path;

            if(p.uploaded)
                tn_path = AWS_PUBLIC + album._id + '_' + p._id + '_tn.' + p.extension;
            else
                tn_path = '/img/uploading.png';

            return {
                src: AWS_PUBLIC + album._id + '_' + p._id + '.' + p.extension,
                th: {
                    src: tn_path,
                    height: THUMB_HEIGHT
                },
                uploaded: p.uploaded
            };
        });

        album.photos = photos;

        this.set('Content-Type', 'application/json');
        this.body = JSON.stringify(album);
    });

    router.post('/albums/:id/photos', function*() {
        var id = this.params.id;

        var album = yield albumsCollection.findOne({_id: id});
        var circle  = yield circlesCollection.findById(album.circleId);

        if(!album || !circle) {
            this.status = 404;
            this.body = '';
            return;
        }

        var authenticated = yield auth(circle, this.request.header);
        if(!authenticated) {
            this.status = 403;
            return;
        }

        // multipart upload
        var parts = parse(this);
        var part, uploadedFiles = 0;

        while (part = yield parts) { // jshint ignore:line

            var ext = getExtension(part.filename);

            if(['jpg', 'png', 'jpeg', 'tiff'].indexOf(ext) === -1) {
                part.pipe(devnull());
                continue;
            }

            var photo = yield photosCollection.insert({
                albumId: album._id,
                createdAt: new Date(),
                uploaded: false,
                extension: ''
            });

            var paths = getPaths(photo, part);

            var file = {
                photo: photo,
                paths: paths,
                content: part
            };

            saveFile(file, photoQueue.push);

            uploadedFiles += 1;
        }

        album.photoCount += uploadedFiles;

        yield albumsCollection.updateById(album._id, album);

        this.set('Content-Type', 'application/json');
        this.body = JSON.stringify(album);

    });

};