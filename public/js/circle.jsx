/**
 * @jsx React.DOM
 */
/* jshint browser:true */
/* global React, ReactBootstrap */

var Button = ReactBootstrap.Button;

var AlbumItem = React.createClass({
    openAlbum: function() {
        var album = this.props.model;

        window.location.hash = '#/albums/' + album.albumId;
    },

    render: function() {
        var album = this.props.model;

        return (
            <li className="well album-item" onClick={this.openAlbum}>
                <h4>{album.name}, <small>{album.photos} photos.</small></h4>
            </li>
        );
    }
});

var AlbumAddButton = React.createClass({

    getInitialState: function() {
        return {
            active: false
        };
    },

    clickHandler: function() {
        this.setState({active: true}, function() {
            this.refs.albumName.getDOMNode().focus();
        });
    },

    addAlbum: function() {
        var name = this.refs.albumName.getDOMNode().value;
        this.props.addAlbum(name);

        this.setState({active: false});
        this.refs.albumName.getDOMNode().value = '';
        return false;
    },

    render: function() {
        return (
            <div>
                <div className={this.state.active ? '' : 'hide'}>
                    <form className="form-inline" onSubmit={this.addAlbum}>
                        <div className="form-group">
                            <input type="text" className="form-control form-input-big" placeholder="Name of Album" ref="albumName" />
                        </div>{' '}
                        <Button bsStyle="default" onClick={this.addAlbum}>Add</Button>
                    </form>
                </div>
                <div className={this.state.active ? 'hide' : ''}>
                    <Button bsStyle="default" onClick={this.clickHandler}>
                        <span className="glyphicon glyphicon-plus"></span>{' '}
                        New Album
                    </Button>
                </div>
            </div>
        );
    }
});

var Circle = React.createClass({

    addAlbum: function(name) {
        this.props.model.albumAdd(name);
    },

    render: function() {
        var circle = this.props.model.circle;

        var albums = circle.albums.map(function(a) {
            return (
                <AlbumItem model={a} circle={circle} />
            );
        });

        if(albums.length === 0) {
            albums.push(<li><h4>Currently no album added.</h4></li>);
        }

        return (
            <div className="row">
                <div className="col-md-12 circle">

                    <div className="pull-right">
                        <AlbumAddButton addAlbum={this.addAlbum}/>
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