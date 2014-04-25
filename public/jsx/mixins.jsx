/**
 * @jsx React.DOM
 */
/* jshint browser:true */
/* jshint devel:true */

var GoogleAnalyticsMixin = {
    componentWillMount: function() {
        if(typeof window.ga !== 'undefined') {
            window.ga('send', 'pageview', window.location.hash);
        }
    }
};

