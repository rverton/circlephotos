var wrap        = require('co-monk');
var auth        = require('../authorization');

var bcrypt      = require('bcrypt-nodejs');

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

        var authenticated = yield auth(circle, this.request.header);
        if(!authenticated) {
            this.status = 403;
            return;
        }

        circle.albums = yield albumsCollection.find({circleId: circle._id});

        this.set('Content-Type', 'application/json');
        this.body = JSON.stringify(circle);

    });

    router.post('/circles/:id/pw', function*() {
        var id          = this.params.id;
        var password    = this.request.body.password || '';

        password = bcrypt.hashSync(password);

        var circle = yield circlesCollection.findById(id);

        if(!circle) {
            this.status = 404;
            return;
        }

        var authenticated = yield auth(circle, this.request.header);
        if(!authenticated) {
            this.status = 403;
            return;
        }

        yield circlesCollection.updateById(circle._id, {'$set': { password: password }});

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

        var authenticated = yield auth(circle, this.request.header);
        if(!authenticated) {
            this.status = 403;
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