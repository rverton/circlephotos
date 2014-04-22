var wrap        = require('co-monk');
var ObjectId    = require('mongodb').ObjectID;
var parse       = require('co-busboy');
var easyimg     = require('easyimage');
var s3          = require('../amazons3');
var fs          = require('fs');
var async       = require('async');

var generateThumbnail = function generateThumbnail(filepath, filepath_tn, cb) {

    easyimg.thumbnail({
        src: filepath,
        dst: filepath_tn,
        width:204, height:204,
        x:0, y:0
    }, function(err) {
        if (err)
            console.log(err);

        cb();
    });
};

var saveFile = function saveFile(file, filepath, cb) {
    var stream = fs.createWriteStream(filepath);
    var p = file.pipe(stream);

    p.on('finish', function() {
        cb();
    });
};

module.exports = function(router, db, AWS_PUBLIC) {

    var circlesCollection  = wrap(db.get('circles'));
    var albumsCollection   = wrap(db.get('albums'));
    var photosCollection   = wrap(db.get('photos'));

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
        var part;
        var uploadedPhotos = 0;

        var handleUpload = function(photo, file) {
            var fileExtension   = part.filename.split('.').pop();
            var filepath        = '/tmp/' + photo.albumId + '_' + photo._id + '.' + fileExtension;
            var filepath_tn     = '/tmp/' + photo.albumId + '_' + photo._id + '_tn.' + fileExtension;

            var mimeType = file.mimeType;

            async.series([
                function save(callback) {
                    saveFile(file, filepath, callback);
                },
                function generateThumb(callback) {
                    generateThumbnail(filepath, filepath_tn, callback);
                },
                function uploadPhoto(callback) {
                    s3.uploadFile(filepath, mimeType, callback);
                },
                function uploadThumb(callback) {
                    s3.uploadFile(filepath_tn, mimeType, callback);
                }

            ], function(err) {
                if(err)
                    console.log(err);

                // Save photo state
                photo.uploaded = true;
                photo.extension = fileExtension;
                photosCollection.updateById(photo._id, photo);

                // Unlink files
                fs.unlink(filepath);
                fs.unlink(filepath_tn);
            });

        };

        while (part = yield parts) { // jshint ignore:line

            var photo = yield photosCollection.insert({
                albumId: album._id,
                createdAt: new Date(),
                uploaded: false,
                extension: ''
            });

            handleUpload(photo, part);

            uploadedPhotos += 1;
        }

        for(var i = 0; i < circle.albums.length; i++) {
            if(album._id.equals(circle.albums[i].albumId))
                circle.albums[i].photos += uploadedPhotos;
        }

        yield circlesCollection.updateById(circle._id, circle);

        this.set('Content-Type', 'application/json');
        this.body = JSON.stringify(album);

    });

};