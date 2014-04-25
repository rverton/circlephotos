/* jshint devel:true */
/* jshint browser:true */
/* global $ */

var app = app || {};

(function() {

    app.Circle = function () {
        this.onChanges = [];
        this.circle = {
            name: '',
            albums: []
        };
        this.password = '';
    };

    app.Circle.prototype.subscribe = function (onChange) {
        this.onChanges.push(onChange);
    };

    app.Circle.prototype.inform = function() {
        this.onChanges.forEach(function (cb) { cb(); });
    };

    app.Circle.prototype.setPassword = function(password) {
        this.password = password;
    };

    app.Circle.prototype.savePassword = function(password) {
        $.ajax({
            type: 'POST',
            url: '/circles/' + this.circle._id + '/pw',

            data: JSON.stringify({ password: password }),
            contentType: 'application/json',

            headers: {
                "Authorization": this.password
            },

            success: function() {
                this.password = password;
                alert('Password was updated.');
            }.bind(this),

            error: handleError
        });
    };

    app.Circle.prototype.load = function(id) {

        $.ajax({
            type: 'GET',
            url: '/circles/' + id,

            headers: {
                "Authorization": this.password
            },

            success: function(data) {
                this.circle = data;
                this.inform();
            }.bind(this),
            error: handleError
        });

    };

    app.Circle.prototype.refresh = function() {
        this.load(this.circle._id);
    };

    app.Circle.prototype.new = function(name, cb) {
        $.ajax({
            type: 'POST',
            url: '/circles',
            data: JSON.stringify({ name: name }),
            contentType: 'application/json',

            headers: {
                "Authorization": this.password
            },

            success: function(data) {
                var id = data._id;
                cb(id);
            },
            error: handleError
        });
    };

    app.Circle.prototype.albumAdd = function(name) {
        $.ajax({
            type: 'POST',
            url: '/circles/' + this.circle._id + '/albums',
            data: JSON.stringify({name: name}),
            contentType: 'application/json',

            headers: {
                "Authorization": this.password
            },

            success: function(data) {
                this.circle = data;
                this.inform();
            }.bind(this),

            error: handleError
        });
    };

    app.Album = function () {
        this.onChanges = [];
        this.album = {
            name: '',
            photoCount: 0,
            photos: []
        };
        this.password = '';
    };

    app.Album.prototype.setPassword = function(password) {
        this.password = password;
    };

    app.Album.prototype.subscribe = function (onChange) {
        this.onChanges.push(onChange);
    };

    app.Album.prototype.inform = function() {
        this.onChanges.forEach(function (cb) { cb(); });
    };

    app.Album.prototype.refresh = function() {
        this.load(this.album._id);
    };

    app.Album.prototype.load = function(id) {
        this.doRequest(id, function() {

            this.inform();

            var photosUploaded = 0;
            for(var i = 0; i < this.album.photos.length; i++) {
                if(this.album.photos[i].uploaded)
                    photosUploaded += 1;
            }

            if(this.album.photos.length !== photosUploaded) {
                setTimeout(function () {
                    this.refresh();
                }.bind(this), 5000);
            }

        }.bind(this));

    };

    app.Album.prototype.doRequest = function(id, cb) {
        $.ajax({
            type: 'GET',
            url: '/albums/' + id,

            headers: {
                "Authorization": this.password
            },

            success: function(data) {
                this.album = data;
                cb();
            }.bind(this),
            error: handleError
        });

    };

    var handleError = function(request, status, err) {
        if(request.status === 403) {
            window.location.hash = window.location.hash + '/pw';
            return;
        }

        if(!err)
            alert('Unrecognized error. Please try again later.');
        else
            alert('Error: ' + err);
    };


})();

