/**
 * @jsx React.DOM
 */
 /* jshint browser:true */
/*global React, document, Router, Circle */

var app = app || {};
var cx = React.addons.classSet;

(function() {

    app.BASE_URL = window.location.host;

    var NavBar = React.createClass({displayName: 'NavBar',

        render: function() {
            var classes = cx({
                'navbar': true,
                'navbar-default': true,
                'navbar-fixed-top':true,
                'navbar-transparent': (this.props.transparent ? true : false)
            });

            return (
                React.DOM.div( {className:classes}, 
                  React.DOM.div( {className:"container"}, 
                    React.DOM.div( {className:"navbar-header"}, 
                      React.DOM.a( {href:"../", className:"navbar-brand"}, "Circle Photos"),
                      React.DOM.button( {className:"navbar-toggle", type:"button", 'data-toggle':"collapse", 'data-target':"#navbar-main"}, 
                        React.DOM.span( {className:"icon-bar"}),
                        React.DOM.span( {className:"icon-bar"}),
                        React.DOM.span( {className:"icon-bar"})
                      )
                    ),
                    React.DOM.div( {className:"navbar-collapse collapse", id:"navbar-main"}, 
                      React.DOM.ul( {className:"nav navbar-nav"}, 
                        React.DOM.li( {className:"dropdown"}, 
                          React.DOM.a( {href:"#/"}, "Create circle")
                        )
                      )
                    )
                  )
                )
            );
        }
    });

    var CirclePassword = React.createClass({displayName: 'CirclePassword',

        setPassword: function() {
            this.props.circle.setPassword(this.refs.password.getDOMNode().value);
            this.props.album.setPassword(this.refs.password.getDOMNode().value);
            this.props.onSet();
        },

        render: function() {
            return (
                React.DOM.div( {className:"container"}, 
                    React.DOM.div( {className:"row"}, 
                        React.DOM.div( {className:"col-md-12 circle"}, 

                            React.DOM.h4(null, "This circles requires a password:"),

                            React.DOM.div( {className:"form-inline"}, 
                                React.DOM.div( {className:"form-group"}, 
                                    React.DOM.input( {ref:"password", type:"password", className:"form-control"} )
                                ),
                                Button( {bsStyle:"success", bsSize:"small", className:"space-left", onClick:this.setPassword}, "Procceed")
                            )
                        )
                    )
                )
            );
        }
    });

    var CFApp = React.createClass({displayName: 'CFApp',

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
                        React.DOM.div(null, 
                            NavBar( {transparent:true} ),
                            Splash(null )
                        )
                    );
                case 'viewCircle':
                    return (
                        React.DOM.div(null, 
                            NavBar(null ),
                            React.DOM.div( {className:"container"}, 
                                Circle( {model:this.props.circleModel} )
                            )
                        )
                    );
                case 'viewAlbum':
                    return (
                        React.DOM.div(null, 
                            NavBar(null ),
                            React.DOM.div( {className:"container"}, 
                                Album( {model:this.props.albumModel} )
                            )
                        )
                    );

                case 'setPassword':
                    return (
                        React.DOM.div(null, 
                            NavBar(null ),
                            CirclePassword(
                                {circle:this.props.circleModel,
                                album:this.props.albumModel,
                                onSet:this.passwordSet})
                        )
                    );
            }
        }
    });

    var circleModel = new app.Circle();
    var albumModel = new app.Album();

    function render() {
        React.renderComponent(
            CFApp( {circleModel:circleModel, albumModel:albumModel} ),
            document.getElementById('app')
        );
    }

    circleModel.subscribe(render);
    albumModel.subscribe(render);
    render();

})();