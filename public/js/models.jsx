/* jshint devel:true */
/* global $ */

var app = app || {};

(function() {

    app.Circle = function () {
        this.onChanges = [];
        this.circle = {
            name: '',
            albums: []
        };
    };

    app.Circle.prototype.subscribe = function (onChange) {
        this.onChanges.push(onChange);
    };

    app.Circle.prototype.inform = function() {
        this.onChanges.forEach(function (cb) { cb(); });
    };

    app.Circle.prototype.load = function(id) {

        $.ajax({
            type: 'GET',
            url: '/circles/'+id,
            success: function(data) {
                this.circle = data;
                this.inform();
            }.bind(this),
            error: function() {
                alert('Server error. Please try again later!');
            }
        });

    };

    app.Circle.prototype.new = function(name, cb) {
        $.ajax({
            type: 'POST',
            url: '/circles',
            data: JSON.stringify({ name: name }),
            contentType: 'application/json',
            success: function(data) {
                var id = data._id;
                cb(id);
            },
            error: function() {
                alert('Server error. Please try again later!');
            }
        });
    };

    app.Circle.prototype.albumAdd = function(name) {
        $.ajax({
            type: 'POST',
            url: '/circles/' + this.circle._id + '/albums',
            data: JSON.stringify({name: name}),
            contentType: 'application/json',

            success: function(data) {
                this.circle = data;
                this.inform();
            }.bind(this),

            error: function() {
                alert('Server error. Please try again later!');
            }
        });
    };

    app.Album = function () {
        this.onChanges = [];
        this.album = {
            name: '',
            photos: []
        };
    };

    app.Album.prototype.subscribe = function (onChange) {
        this.onChanges.push(onChange);
    };

    app.Album.prototype.inform = function() {
        this.onChanges.forEach(function (cb) { cb(); });
    };

    app.Album.prototype.load = function(id) {

        $.ajax({
            type: 'GET',
            url: '/albums/' + id,
            success: function(data) {
                this.album = data;
                this.inform();
            }.bind(this),
            error: function() {
                alert('Server error. Please try again later!');
            }
        });

    };


})();

