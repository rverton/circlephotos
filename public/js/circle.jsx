/**
 * @jsx React.DOM
 */
/* jshint browser:true */
/* jshint devel:true */
/* global React, ReactBootstrap, app */

var Button = ReactBootstrap.Button;
var ButtonToolbar = ReactBootstrap.ButtonToolbar;

var CircleShareButton = React.createClass({
    share: function() {
        var url = app.BASE_URL + '/circles/' + this.props.model._id;

        prompt('Share this link with your friends:', url);
    },

    render: function() {
        return (
            <Button bsSize="small" onClick={this.share}>
                <span className="glyphicon glyphicon-share-alt"></span>{' '}
                Share
            </Button>
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
                            <input type="text" className="form-control" placeholder="Name of Album" ref="albumName" />
                        </div>{' '}
                        <Button bsStyle="default" bsSize="small" onClick={this.addAlbum}>Add</Button>
                    </form>
                </div>
                <div className={this.state.active ? 'hide' : ''}>
                    <Button bsStyle="default" bsSize="small" onClick={this.clickHandler}>
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

                    <div className="pull-right space-left">
                        <CircleShareButton model={this.props.model.circle}/>
                    </div>

                    <div className="pull-right">
                        <AlbumAddButton addAlbum={this.addAlbum} />
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