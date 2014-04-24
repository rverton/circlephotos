var koa         = require('koa');
var router      = require('koa-router');
var logger      = require('koa-logger');
var serve       = require('koa-static');
var views       = require('koa-views');
var bodyParser  = require('koa-body-parser');
var app         = koa();

var db      = require('monk')('localhost/circlephotos');

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

publicRoutes.get('/', function*() {
    this.locals = {
        session: this.session
    };

    yield this.render('index.html');
});

require('./routes/albums')(publicRoutes, db, AWS_PUBLIC);
require('./routes/circles')(publicRoutes, db);

app.use(publicRoutes.middleware());

var port = process.env.PORT || 3000;

app.listen(port);
console.log('App started at :', port);