/**
 * @jsx React.DOM
 */
/* jshint browser:true */
/* global React, ReactBootstrap */

var Button = ReactBootstrap.Button;

var PhotoThumb = React.createClass({
    render: function() {
        return (
            <div className="photo">
                <img src={this.props.photo.url} className="img-thumbnail" />
            </div>
        );
    }
});

var Album = React.createClass({

    openCircle: function() {
        window.location.hash = '#/circles/' + this.props.model.album.circleId;
    },

    render: function() {
        var album = this.props.model.album;

        var photos = [<div className="photo photos-add"><img src="/img/add_photo.png" className="img-thumbnail" onClick={this.addPhotos} /></div>];

        photos.concat(
            album.photos.map(function(p) {
                return (
                    <PhotoThumb photo={p} />
                );
            })
        );

        if(photos.length === 0) {
            photos.push();
        }

        return (
            <div className="row">
                <div className="col-md-10 circle">

                    <div className="pull-right">
                        <Button bsStyle="default" bsSize="small" onClick={this.openCircle}>
                            <span className="glyphicon glyphicon-arrow-left"></span>{' '}
                            zurück
                        </Button>
                    </div>

                    <h4>{album.name}</h4>
                    <div className="list-unstyled photos">
                    {photos}
                    </div>
                </div>
            </div>

        );
    }
});