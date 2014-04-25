/**
 * @jsx React.DOM
 */
 /* jshint browser:true */
/*global React, document, Router, Circle */

var app = app || {};
var cx = React.addons.classSet;

(function() {

    app.BASE_URL = window.location.host;

    var NavBar = React.createClass({

        render: function() {
            var classes = cx({
                'navbar': true,
                'navbar-default': true,
                'navbar-fixed-top':true,
                'navbar-transparent': (this.props.transparent ? true : false)
            });

            return (
                <div className={classes}>
                  <div className="container">
                    <div className="navbar-header">
                      <a href="../" className="navbar-brand">Circle Photos</a>
                      <button className="navbar-toggle" type="button" data-toggle="collapse" data-target="#navbar-main">
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                      </button>
                    </div>
                    <div className="navbar-collapse collapse" id="navbar-main">
                      <ul className="nav navbar-nav">
                        <li className="dropdown">
                          <a href="#/">Create circle</a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
            );
        }
    });

    var CirclePassword = React.createClass({

        setPassword: function() {
            this.props.circle.setPassword(this.refs.password.getDOMNode().value);
            this.props.album.setPassword(this.refs.password.getDOMNode().value);
            this.props.onSet();
        },

        render: function() {
            return (
                <div className="container">
                    <div className="row">
                        <div className="col-md-12 circle">

                            <h4>This circles requires a password:</h4>

                            <div className="form-inline">
                                <div className="form-group">
                                    <input ref="password" type="password" className="form-control" />
                                </div>
                                <Button bsStyle="success" bsSize="small" className="space-left" onClick={this.setPassword}>Procceed</Button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    });

    var CFApp = React.createClass({

        getInitialState: function() {
            return {
                page: '/',
                circle: {},
                album: {}
            };
        },

        componentDidMount: function () {
            var setState    = this.setState;
            var props       = this.props;

            var router = Router({
                '/': setState.bind(this, {page: '/'}),

                '/circles/:id': function(id) {
                    props.circleModel.load(id);

                    this.setState({
                        page: 'viewCircle',
                        circle: props.circleModel.circle
                    });
                }.bind(this),

                '/circles/:id/pw': function(id) {
                    this.setState({
                        page: 'setPassword',
                        circle: {_id: id}
                    });
                }.bind(this),

                '/albums/:id': function(id) {
                    props.albumModel.load(id);

                    this.setState({
                        page: 'viewAlbum',
                        album: props.albumModel.album
                    });
                }.bind(this),

                '/albums/:id/pw': function(id) {
                    this.setState({
                        page: 'setPassword',
                        circle: {_id: id},
                        album: {_id: id}
                    });
                }.bind(this),
            });

            router.init('/');
        },

        passwordSet: function() {
            if(typeof this.state.album._id !== 'undefined')
                window.location.hash = '#/albums/' + this.state.album._id;
            else
                window.location.hash = '#/circles/' + this.state.circle._id;
        },

        render: function () {

            switch(this.state.page) {
                case '/':
                    return (
                        <div>
                            <NavBar transparent={true} />
                            <Splash />
                        </div>
                    );
                case 'viewCircle':
                    return (
                        <div>
                            <NavBar />
                            <div className="container">
                                <Circle model={this.props.circleModel} />
                            </div>
                        </div>
                    );
                case 'viewAlbum':
                    return (
                        <div>
                            <NavBar />
                            <div className="container">
                                <Album model={this.props.albumModel} />
                            </div>
                        </div>
                    );

                case 'setPassword':
                    return (
                        <div>
                            <NavBar />
                            <CirclePassword
                                circle={this.props.circleModel}
                                album={this.props.albumModel}
                                onSet={this.passwordSet}/>
                        </div>
                    );
            }
        }
    });

    var circleModel = new app.Circle();
    var albumModel = new app.Album();

    function render() {
        React.renderComponent(
            <CFApp circleModel={circleModel} albumModel={albumModel} />,
            document.getElementById('app')
        );
    }

    circleModel.subscribe(render);
    albumModel.subscribe(render);
    render();

})();