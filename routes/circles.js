var wrap        = require('co-monk');

/*
 * Circle: {_id, name}
 * Album {_id, name, circleId, photoCount}
 * Photo {_id, albumId}
 */

module.exports = function(router, db) {

    var circlesCollection  = wrap(db.get('circles'));
    var albumsCollection   = wrap(db.get('albums'));

    router.post('/circles', function*() {
        var name = this.request.body.name;

        if(typeof name === 'undefined' || name === '')
            name = 'Unnamed';

        var circle = yield circlesCollection.insert({
            name: name
        });

        this.set('Content-Type', 'application/json');
        this.body = JSON.stringify(circle);

    });

    router.get('/circles/:id', function*() {
        var id = this.params.id;

        var circle = yield circlesCollection.findById(id);

        if(!circle) {
            this.status = 404;
            return;
        }

        circle.albums = yield albumsCollection.find({circleId: circle._id});

        this.set('Content-Type', 'application/json');
        this.body = JSON.stringify(circle);

    });

    router.post('/circles/:id/albums', function*() {
        var id      = this.params.id;
        var name    = this.request.body.name || 'Unnamed';

        var circle = yield circlesCollection.findById(id);

        if(!circle) {
            this.status = 404;
            return;
        }

        yield albumsCollection.insert({
            name:name,
            circleId: circle._id,
            photoCount: 0
        });

        circle.albums = yield albumsCollection.find({circleId: circle._id});

        this.set('Content-Type', 'application/json');
        this.body = JSON.stringify(circle);

    });

};