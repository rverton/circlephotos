var koa         = require('koa');
var router      = require('koa-router');
var logger      = require('koa-logger');
var serve       = require('koa-static');
var views       = require('koa-views');
var bodyParser  = require('koa-body-parser');
var app         = koa();

var db      = require('monk')('localhost/circlephotos');

/*
 * Circle: {_id, name, password}
 * Album {_id, name, circleId, photoCount}
 * Photo {_id, albumId, key}
 */

// sessions
var session = require('koa-sess');
app.keys    = ['CHANGE-ME'];
app.use(session());

// amazon aws s3 public url
var AWS_PUBLIC = process.env.AWS_PUBLIC_URL || '';

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

var port    = process.env.PORT || 3000;
var bindip  = process.env.BIND_IP || '0.0.0.0';

app.listen(port, bindip);
console.log('App started at ' + bindip + ':' + port);