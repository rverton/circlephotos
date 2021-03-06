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

var Splash = React.createClass({
    mixins: [GoogleAnalyticsMixin],

    render: function() {
        return (
            <div className="splash">
              <div className="container">
                <div className="row">
                  <div className="col-md-8 col-md-offset-2">
                    <h1>Create a photocircle, share photo albums.</h1>
                    <p>Invite friends, create albums and collaborative upload photos.</p>

                    <TryField />

                  </div>
                </div>
              </div>
            </div>
        );
    }
});

var TryField = React.createClass({
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
            <div className="try">
                <Button bsStyle="primary" className={btnClasses} onClick={this.clickHandler}>
                    Try now
                </Button>
                <div className={this.state.active ? '' : 'hide'}>
                    <form className="form-inline" onSubmit={this.createCircle}>
                        <div className="form-group">
                            <input type="text" className="form-control form-input-big" placeholder="Name of Circle" ref="name" />
                        </div>{' '}
                        <Button bsStyle="primary" onClick={this.createCircle}>Create</Button>
                    </form>
                </div>
            </div>
        );
    }
});
