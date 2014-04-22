var wrap        = require('co-monk');

module.exports = function(router, db) {

    var circlesCollection  = wrap(db.get('circles'));
    var albumsCollection   = wrap(db.get('albums'));

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

        var circle = yield circlesCollection.findOne({_id: id});

        this.set('Content-Type', 'application/json');
        this.body = JSON.stringify(circle);

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