var koa         = require('koa');
var router      = require('koa-router');
var logger      = require('koa-logger');
var serve       = require('koa-static');
var formidable  = require('koa-formidable');
var views       = require('koa-views');
var bodyParser  = require('koa-body-parser');
var app         = koa();

var wrap    = require('co-monk');
var db      = require('monk')('localhost/circlefriends');

var circlesCollection  = wrap(db.get('circles'));

// sessions
var session = require('koa-sess');
app.keys = ['3k4fal3t4gr!kflael'];
app.use(session());

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

    var circle = yield circlesCollection.insert({name: name, albums: [{name:'Silvester 2014'}, {name:'Sommertrip 2013'}]});

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

    circle.albums.push({name: name});

    yield circlesCollection.updateById(circle._id, circle);

    this.set('Content-Type', 'application/json');
    this.body = JSON.stringify(circle);

});

app.use(secured.middleware());

app.listen(3000);
console.log('App started at :3000');
