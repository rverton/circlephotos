/**
 * @jsx React.DOM
 */
/* jshint browser:true */
/* jshint devel:true */
/* global React, ReactBootstrap, app */

var Button = ReactBootstrap.Button;
var Modal = ReactBootstrap.Modal;
var ModalTrigger = ReactBootstrap.ModalTrigger;

var PasswordModal = React.createClass({

    savePassword: function() {
        var pw  = this.refs.password.getDOMNode().value;
        var pw2 = this.refs.password2.getDOMNode().value;

        if(pw != pw2)
            return alert('These passwords are not the same.');

        if(pw.length <= 2)
            return alert('Please use at least 3 charachters').

        this.props.onRequestHide();
        this.props.circleModel.savePassword(pw);
    },

    render: function() {
        return this.transferPropsTo(
            <Modal title="Set password" animation={false} className="passwordModal">
              <div className="modal-body">

                 <form className="form-horizontal">
                    <div className="form-group">
                        <label className="col-sm-4 control-label">
                            Choose a password:
                        </label>
                        <div className="col-sm-8">
                            <input ref="password" type="password" class="form-control" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="col-sm-4 control-label">
                            Repeat password:
                        </label>
                        <div className="col-sm-8">
                            <input ref="password2" type="password" class="form-control" />
                        </div>
                    </div>
                </form>
              </div>

              <div className="modal-footer">
                <a className="btn btn-primary btn-sm" onClick={this.savePassword}>Save</a>
              </div>
            </Modal>
        );
    }
});

var ShareModal = React.createClass({

    shareLink: function() {
        return 'http://' + app.BASE_URL + '/#/circles/' + this.props.circle._id;
    },

    render: function() {
        return this.transferPropsTo(
            <Modal title="Share this circle" animation={false} className="shareModal">
              <div className="modal-body">

                <a title="Circle Photos" className="btn btn-primary btn-sm" href={this.shareLink()}>Drag this button to your bookmarks bar</a>

                <p>
                    Send your friends this link:<br />
                    <input type="text" class="form-control" value={this.shareLink()} />
                </p>

              </div>
            </Modal>
        );
    }
});

var PasswordButton = React.createClass({

    render: function() {
        return (
            <ModalTrigger modal={<PasswordModal circleModel={this.props.circleModel} />}>
                <Button bsSize="small">
                    <span className="glyphicon glyphicon-lock"></span>{' '}
                    Set password
                </Button>
            </ModalTrigger>
        );
    }
});

var CircleShareButton = React.createClass({

    render: function() {
        return (
            <ModalTrigger modal={<ShareModal circle={this.props.model} />}>
                <Button bsSize="small">
                    <span className="glyphicon glyphicon-share-alt"></span>{' '}
                    Share
                </Button>
            </ModalTrigger>
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
    mixins: [GoogleAnalyticsMixin],

    addAlbum: function(name) {
        this.props.model.albumAdd(name);
    },

    render: function() {
        var circle      = this.props.model.circle;
        var circleModel = this.props.model;

        var albums = circle.albums.map(function(a) {
            return (
                <AlbumItem model={a} circle={circle} circleModel={circleModel} />
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

                    <div className="pull-right space-left">
                        <PasswordButton circleModel={circleModel}/>
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