var wrap        = require('co-monk');
var ObjectId    = require('mongodb').ObjectID;
var parse       = require('co-busboy');
var easyimg     = require('easyimage');
var s3          = require('../amazons3');
var fs          = require('fs');
var async       = require('async');
var devnull     = require('dev-null');

var circlesCollection;
var albumsCollection;
var photosCollection;

var photoQueue = async.queue(function (task, callback) {

    var paths   = task.paths;
    var photo   = task.photo;

    async.series([
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

        callback();
    });

}, 2);

var generateThumbnail = function generateThumbnail(filepath, filepath_tn, cb) {

    easyimg.thumbnail({
        src: filepath,
        dst: filepath_tn,
        width:204, height:204,
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

module.exports = function(router, db, AWS_PUBLIC) {

    circlesCollection  = wrap(db.get('circles'));
    albumsCollection   = wrap(db.get('albums'));
    photosCollection   = wrap(db.get('photos'));

    router.get('/albums/:id', function*() {
        var id = this.params.id;

        var album = yield albumsCollection.findOne({_id: id});
        var photos = yield photosCollection.find({albumId: ObjectId(id)});

        photos = photos.map(function(p) {
            return {
                url: AWS_PUBLIC + album._id + '_' + p._id + '.' + p.extension,
                tn: AWS_PUBLIC + album._id + '_' + p._id + '_tn.' + p.extension,
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
        var circle = yield circlesCollection.findOne({_id: album.circleId});

        if(!album) {
            this.status = 404;
            this.body = '';
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

        for(var i = 0; i < circle.albums.length; i++) {
            if(album._id.equals(circle.albums[i].albumId))
                circle.albums[i].photos += uploadedFiles;
        }

        yield circlesCollection.updateById(circle._id, circle);

        this.set('Content-Type', 'application/json');
        this.body = JSON.stringify(album);

    });

};