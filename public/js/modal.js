/**
 * @jsx React.DOM
 */
 /* jshint devel:true */
 /* jshint browser:true */
 /* global React */

var ReactLayeredComponentMixin = {
    componentWillUnmount: function() {
        this._unrenderLayer();
        document.body.removeChild(this._target);
    },

    componentDidUpdate: function() {
        this._renderLayer();
    },

    componentDidMount: function() {
        // Appending to the body is easier than managing the z-index of everything on the page.
        // It's also better for accessibility and makes stacking a snap (since components will stack
        // in mount order).
        this._target = document.createElement('div');
        document.body.appendChild(this._target);
        this._renderLayer();
    },

    _renderLayer: function() {
        // By calling this method in componentDidMount() and componentDidUpdate(), you're effectively
        // creating a "wormhole" that funnels React's hierarchical updates through to a DOM node on an
        // entirely different part of the page.
        React.renderComponent(this.renderLayer(), this._target);
    },

    _unrenderLayer: function() {
        React.unmountComponentAtNode(this._target);
    }
};

var ModalSimple = React.createClass({displayName: 'ModalSimple',
    killClick: function(e) {
        // clicks on the content shouldn't close the modal
        e.stopPropagation();
    },

    handleBackdropClick: function() {
        // when you click the background, the user is requesting that the modal gets closed.
        // note that the modal has no say over whether it actually gets closed. the owner of the
        // modal owns the state. this just "asks" to be closed.
        this.props.onRequestClose();
    },

    render: function() {
        return this.transferPropsTo(
            React.DOM.div( {className:"ModalBackdrop", onClick:this.handleBackdropClick}, 
                React.DOM.div( {className:"ModalContent", onClick:this.killClick}, 
                    this.props.children
                )
            )
        );
    }
});
