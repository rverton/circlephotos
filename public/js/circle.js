/**
 * @jsx React.DOM
 */
/* jshint browser:true */
/* jshint devel:true */
/* global React, ReactBootstrap, app */

var Button = ReactBootstrap.Button;
var Modal = ReactBootstrap.Modal;
var ModalTrigger = ReactBootstrap.ModalTrigger;

var ShareModal = React.createClass({displayName: 'ShareModal',

    shareLink: function() {
        return 'http://' + app.BASE_URL + '/#/circles/' + this.props.circle._id;
    },

    render: function() {
        return this.transferPropsTo(
            Modal( {title:"Share this circle", animation:false, className:"shareModal"}, 
              React.DOM.div( {className:"modal-body"}, 

                React.DOM.a( {title:"Circle Photos", className:"btn btn-primary btn-sm", href:this.shareLink()}, "Drag this button to your bookmarks bar"),

                React.DOM.p(null, 
                    "Send your friends this link:",React.DOM.br(null ),
                    React.DOM.input( {type:"text", class:"form-control", value:this.shareLink()} )
                )

              )
            )
        );
    }
});

var CircleShareButton = React.createClass({displayName: 'CircleShareButton',

    render: function() {
        return (
            ModalTrigger( {modal:ShareModal( {circle:this.props.model} )}, 
                Button( {bsSize:"small"}, 
                    React.DOM.span( {className:"glyphicon glyphicon-share-alt"}),' ',
                    "Share"
                )
            )
        );
    }
});

var AlbumAddButton = React.createClass({displayName: 'AlbumAddButton',

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
            React.DOM.div(null, 
                React.DOM.div( {className:this.state.active ? '' : 'hide'}, 
                    React.DOM.form( {className:"form-inline", onSubmit:this.addAlbum}, 
                        React.DOM.div( {className:"form-group"}, 
                            React.DOM.input( {type:"text", className:"form-control", placeholder:"Name of Album", ref:"albumName"} )
                        ),' ',
                        Button( {bsStyle:"default", bsSize:"small", onClick:this.addAlbum}, "Add")
                    )
                ),
                React.DOM.div( {className:this.state.active ? 'hide' : ''}, 
                    Button( {bsStyle:"default", bsSize:"small", onClick:this.clickHandler}, 
                        React.DOM.span( {className:"glyphicon glyphicon-plus"}),' ',
                        "New Album"
                    )
                )
            )
        );
    }
});

var Circle = React.createClass({displayName: 'Circle',

    addAlbum: function(name) {
        this.props.model.albumAdd(name);
    },

    render: function() {
        var circle      = this.props.model.circle;
        var circleModel = this.props.model;

        var albums = circle.albums.map(function(a) {
            return (
                AlbumItem( {model:a, circle:circle, circleModel:circleModel} )
            );
        });

        if(albums.length === 0) {
            albums.push(React.DOM.li(null, React.DOM.h4(null, "Currently no album added.")));
        }

        return (
            React.DOM.div( {className:"row"}, 
                React.DOM.div( {className:"col-md-12 circle"}, 

                    React.DOM.div( {className:"pull-right space-left"}, 
                        CircleShareButton( {model:this.props.model.circle})
                    ),

                    React.DOM.div( {className:"pull-right"}, 
                        AlbumAddButton( {addAlbum:this.addAlbum} )
                    ),

                    React.DOM.h2(null, circle.name),

                    React.DOM.ul( {className:"list-unstyled albums"}, 
                    albums
                    )
                )
            )

        );
    }
});