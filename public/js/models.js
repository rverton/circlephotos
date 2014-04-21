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

    app.Circle.prototype.inform = function () {
        this.onChanges.forEach(function (cb) { cb(); });
    };

    app.Circle.prototype.load = function (id) {

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


})();

