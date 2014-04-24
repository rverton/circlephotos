/**
 * @jsx React.DOM
 */
/*jshint quotmark:false */
/*jshint white:false */
/*jshint trailing:false */
/*jshint newcap:false */
/*jshint devel:true */
/*jshint browser:true */
/*global React, ReactBootstrap, $ */

var app = app || {};

var cx = React.addons.classSet;
var Button = ReactBootstrap.Button;

var Splash = React.createClass({displayName: 'Splash',
    render: function() {
        return (
            React.DOM.div( {className:"splash"}, 
              React.DOM.div( {className:"container"}, 
                React.DOM.div( {className:"row"}, 
                  React.DOM.div( {className:"col-md-8 col-md-offset-2"}, 
                    React.DOM.h1(null, "Create a photocircle, share photo albums."),
                    React.DOM.p(null, "Invite friends, create albums and collaborative upload photos."),

                    TryField(null )

                  )
                )
              )
            )
        );
    }
});

var TryField = React.createClass({displayName: 'TryField',
    getInitialState: function() {
        return {active: false};
    },

    clickHandler: function() {
        this.setState({active:true}, function() {
          this.refs.name.getDOMNode().focus();
        });
    },

    createCircle: function() {
        var c = new app.Circle();
        c.new(this.refs.name.getDOMNode().value, function(id) {
            window.location.hash = '#/circles/' + id;
        });
        return false;
    },

    render: function() {
        var btnClasses = cx({
            'hide': this.state.active
        });

        return (
            React.DOM.div( {className:"try"}, 
                Button( {bsStyle:"primary", className:btnClasses, onClick:this.clickHandler}, 
                    "Try now"
                ),
                React.DOM.div( {className:this.state.active ? '' : 'hide'}, 
                    React.DOM.form( {className:"form-inline", onSubmit:this.createCircle}, 
                        React.DOM.div( {className:"form-group"}, 
                            React.DOM.input( {type:"text", className:"form-control form-input-big", placeholder:"Name of Circle", ref:"name"} )
                        ),' ',
                        Button( {bsStyle:"primary", onClick:this.createCircle}, "Create")
                    )
                )
            )
        );
    }
});
