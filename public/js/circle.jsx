/**
 * @jsx React.DOM
 */
/*jshint quotmark:false */
/*jshint white:false */
/*jshint trailing:false */
/*jshint newcap:false */
/*jshint devel:true */
/*jshint browser:true */
/* global React, ReactBootstrap */

var Button = ReactBootstrap.Button;

var AlbumItem = React.createClass({
    render: function() {
        var album = this.props.model;

        return (
            <li className="well">
                <h4>{album.name}</h4>
            </li>
        );
    }
});

var Circle = React.createClass({
    render: function() {
        var circle = this.props.model;

        var albums = circle.albums.map(function(a) {
            return (
                <AlbumItem model={a} />
            );
        });

        return (
            <div className="row">
                <div className="col-md-10 circle">
                    <div className="pull-right">
                        <Button bsStyle="default">
                            <span className="glyphicon glyphicon-plus"></span>{' '}
                            New Album
                        </Button>
                    </div>
                    <h2>{circle.name}</h2>

                    <ul className="list-unstyled albums">
                    {albums}
                    </ul>
                </div>
            </div>

        );
    }
});