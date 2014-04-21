/**
 * @jsx React.DOM
 */
/*global React, document, Router, Circle */

var app = app || {};

var cx = React.addons.classSet;

(function() {

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
                          <a href="#">Create circle</a>
                        </li>
                      </ul>
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
                circle: null
            };
        },

        componentDidMount: function () {
            var setState    = this.setState;
            var props       = this.props;

            var router = Router({
                '/': setState.bind(this, {page: '/'}),
                '/circles/:id': function(id) {
                    props.model.load(id);

                    this.setState({
                        page: 'viewCircle',
                        circle: props.model.circle
                    });
                }.bind(this)
            });

            router.init('/');
        },

        render: function () {

            switch(this.state.page) {
                case '/':
                    return (
                        <div>
                            <NavBar transparent={true} />
                            <Splash />
                            <DummyContent />
                        </div>
                    );
                case 'viewCircle':
                    return (
                        <div>
                            <NavBar />
                            <div className="container">
                                <Circle model={this.props.model} />
                            </div>
                        </div>
                    );
            }
        }
    });

    var circleModel = new app.Circle();

    function render() {
        React.renderComponent(
            <CFApp model={circleModel} />,
            document.getElementById('app')
        );
    }

    circleModel.subscribe(render);
    render();

})();