var wrap        = require('co-monk');
var async       = require('async');

module.exports = function(router, db, AWS_PUBLIC) {

    var circlesCollection  = wrap(db.get('circles'));
    var albumsCollection   = wrap(db.get('albums'));
    var photosCollection   = wrap(db.get('photos'));

    router.post('/circles', function*() {
        var name = this.request.body.name;

        if(typeof name === 'undefined' || name === '')
            name = 'Unnamed';

        var circle = yield circlesCollection.insert({name: name, albums: [], createdAt: new Date()});

        this.set('Content-Type', 'application/json');
        this.body = JSON.stringify(circle);

    });

    router.get('/circles/:id', function*() {
        var id = this.params.id;
        var _this = this;

        var circle = yield circlesCollection.findOne({_id: id});

        async.map(circle.albums, function(album, callback) {
            photosCollection.findOne({albumId: album.albumId}, function(err, result) {
                if(err)
                    album.examplePhoto = '';
                else
                    album.examplePhoto = AWS_PUBLIC + album.albumId + '_' + result._id + '_tn.' + result.extension;

                callback(err, album);
            });

        }, function(err) {
            if(err)
                console.log(err);

            _this.set('Content-Type', 'application/json');
            _this.body = JSON.stringify(circle);

        });

    });

    router.post('/circles/:id/albums', function*() {
        var id = this.params.id;
        var name = this.request.body.name;

        if(typeof name === 'undefined' || name === '')
            name = 'Unnamed';

        var circle = yield circlesCollection.findOne({_id: id});

        if(!circle) {
            this.status = 404;
            return;
        }

        var album = yield albumsCollection.insert({
            name:name,
            circleId: circle._id,
            photos: []
        });

        circle.albums.push({
            name: name,
            albumId: album._id,
            photos: 0
        });

        yield circlesCollection.updateById(circle._id, circle);

        this.set('Content-Type', 'application/json');
        this.body = JSON.stringify(circle);

    });

};