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

var AlbumAddButton = React.createClass({

    getInitialState: function() {
        return {
            active: false
        };
    },

    clickHandler: function() {
        this.setState({active: true});
    },

    addAlbum: function() {
        var name = this.refs.albumName.getDOMNode().value;

        this.props.addAlbum(name);
    },

    render: function() {
        return (
            <div>
                <div className={this.state.active ? '' : 'hide'}>
                    <div className="form-inline">
                        <div className="form-group">
                            <input type="text" className="form-control form-input-big" placeholder="Name of Album" ref="albumName" />
                        </div>{' '}
                        <Button bsStyle="default" onClick={this.addAlbum}>Add</Button>
                    </div>
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
                <AlbumItem model={a} />
            );
        });

        return (
            <div className="row">
                <div className="col-md-10 circle">

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