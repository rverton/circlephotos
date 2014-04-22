var koa         = require('koa');
var router      = require('koa-router');
var logger      = require('koa-logger');
var serve       = require('koa-static');
var formidable  = require('koa-formidable');
var views       = require('koa-views');
var bodyParser  = require('koa-body-parser');
var parse       = require('co-busboy');
var s3          = require('./amazons3');
var fs          = require('fs');
var ObjectId    = require('mongodb').ObjectID;
var app         = koa();

var wrap    = require('co-monk');
var db      = require('monk')('localhost/circlefriends');

var circlesCollection  = wrap(db.get('circles'));
var albumsCollection   = wrap(db.get('albums'));
var photosCollection   = wrap(db.get('photos'));

// sessions
var session = require('koa-sess');
app.keys = ['3k4fal3t4gr!kflael'];
app.use(session());

// amazon aws s3 public url
var AWS_PUBLIC = process.env.AWS_PUBLIC_URL || '';

// auth
require('./auth');
var passport = require('koa-passport');
app.use(passport.initialize());
app.use(passport.session());

app.use(serve('./public/'));

app.use(logger());
app.use(bodyParser());
app.use(router(app));

app.use(views('./templates', 'html', {
    html: 'underscore'
}));

// routes
var publicRoutes = new router();
var secured = new router();

// POST /login
publicRoutes.post('/login',
    formidable(),
    passport.authenticate('local', {
        successRedirect: '/app',
        failureRedirect: '/'
    })
);

publicRoutes.get('/logout', function*() {
    this.req.logout();
    this.redirect('/');
});

publicRoutes.get('/auth/facebook', passport.authenticate('facebook', {scope: 'email'}));

publicRoutes.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect: '/app',
        failureRedirect: '/'
    })
);

app.use(publicRoutes.middleware());

publicRoutes.get('/', function*() {
    this.locals = {
        session: this.session
    };

    yield this.render('index.html');
});

publicRoutes.post('/circles', function*() {
    var name = this.request.body.name;

    if(typeof name === 'undefined' || name === '')
        name = 'Unnamed';

    var circle = yield circlesCollection.insert({name: name, albums: [], createdAt: new Date()});

    this.set('Content-Type', 'application/json');
    this.body = JSON.stringify(circle);

});

publicRoutes.get('/circles/:id', function*() {
    var id = this.params.id;

    var circle = yield circlesCollection.findOne({_id: id});

    this.set('Content-Type', 'application/json');
    this.body = JSON.stringify(circle);

});

publicRoutes.post('/circles/:id/albums', function*() {
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

publicRoutes.get('/albums/:id', function*() {
    var id = this.params.id;

    var album = yield albumsCollection.findOne({_id: id});

    var photos = yield photosCollection.find({albumId: ObjectId(id)});

    photos = photos.map(function(p) {
        return {
            url: AWS_PUBLIC + album._id + '_' + p._id + '.' + p.extension,
            uploaded: p.uploaded
        }
    });

    album.photos = photos;

    this.set('Content-Type', 'application/json');
    this.body = JSON.stringify(album);

});

publicRoutes.post('/albums/:id/photos', function*() {
    var id = this.params.id;

    var album = yield albumsCollection.findOne({_id: id});

    if(!album) {
        this.status = 404;
        this.body = '';
        return;
    }

    // multipart upload
    var parts = parse(this);
    var part;

    var handleUpload = function(photo, file) {
        var fileExtension = part.filename.split('.').pop();
        var filepath = '/tmp/' + photo.albumId + '_' + photo._id + '.' + fileExtension;
        var mimeType = file.mimeType;

        saveFile(file, filepath, function() {

            s3.uploadFile(filepath, mimeType, function() {
                photo.uploaded = true;
                photo.extension = fileExtension;
                photosCollection.updateById(photo._id, photo);
                //TODO: Unlink file
            });
        });
    };

    var saveFile = function saveFile(file, filepath, cb) {
        var stream = fs.createWriteStream(filepath);
        var p = file.pipe(stream);

        p.on('finish', function() {
            cb();
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
    }

    this.set('Content-Type', 'application/json');
    this.body = JSON.stringify(album);

});

app.use(secured.middleware());

app.listen(3000);
console.log('App started at :3000');