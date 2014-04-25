/**
 * @jsx React.DOM
 */
/* jshint browser:true */
/* jshint devel:true*/

/* global React, ReactBootstrap, $, ModalSimple, ReactLayeredComponentMixin, async, ColorThief */

var Button = ReactBootstrap.Button;
var ProgressBar = ReactBootstrap.ProgressBar;

var getExtension = function (filename) {
    if(filename.indexOf('.') === -1 )
        return '';

    return filename.split('.').pop().toLowerCase();
};

var MagnifyImage = React.createClass({displayName: 'MagnifyImage',
    mixins: [ReactLayeredComponentMixin],

    handleClick: function() {
        this.setState({shown: !this.state.shown});
    },

    getInitialState: function() {
        return {shown: false, modalShown: false};
    },

    renderLayer: function() {
        if (!this.state.shown) {
            return React.DOM.span(null );
        }
        return (
            ModalSimple( {onRequestClose:this.handleClick}, 
                React.DOM.img( {src:this.props.img, className:"img-responsive magnify", onClick:this.handleClick} )
            )
        );
    },

    render: function() {
        return this.transferPropsTo(
            React.DOM.a( {onClick:this.handleClick}, 
                this.props.children
            )
        );
    }
});

var PhotoThumb = React.createClass({displayName: 'PhotoThumb',
    render: function() {

        return (
            React.DOM.div( {className:"photo"}, 
                MagnifyImage( {img:this.props.photo.src}, 
                    React.DOM.img( {src:this.props.photo.th.src})
                )
            )
        );
    }
});

var FileUpload = React.createClass({displayName: 'FileUpload',
    getInitialState: function() {
        return {
            uploadProgress: 0,
            filedragHover: false,
            uploadInProgress: false,
            uploadedFiles: 0
        };
    },

    // Single file was successfull uploaded
    fileUploaded: function() {
        this.setState({
            uploadedFiles: this.state.uploadedFiles + 1,
            uploadProgress: 0
        });
    },

    clearFile: function () {
        this.refs.uploadform.getDOMNode().reset();
    },

    handleUploadProgress: function(e) {
        var pc = parseInt((e.loaded / e.total * 100));
        this.setState({uploadProgress: pc});
    },

    // All files were uploaded successfully
    handleUploadFinished: function() {
        this.setState({
            uploadProgress: 0,
            filedragHover: false,
            uploadInProgress: false,
            uploadedFiles: 0
        });

        this.clearFile();
        this.props.uploaded();
    },

    // Upload all files
    uploadFiles: function(files) {
        this.setState({uploadInProgress: true});

        var upHandler       = this.handleUploadProgress;
        var fileUploaded    = this.fileUploaded;
        var albumId         = this.props.model.album._id;

        var circlePassword  = this.props.model.password;

        var filesToUpload = [];

        for (var i = 0; i < files.length; i++) {
            var file = files[i];

            if (!file.type.match('image.*')) {
                continue;
            }

            var ext = getExtension(file.name);

            if(['jpg', 'png', 'jpeg', 'tiff'].indexOf(ext) === -1) {
                continue;
            }

            filesToUpload.push(file);

        }

        if(filesToUpload.length === 0)
            this.handleUploadFinished();

        async.eachSeries(filesToUpload, function(file, callback) {
            var formData    = new FormData();
            formData.append('photos[]', file, file.name);

            $.ajax({
                url: '/albums/' + albumId + '/photos',
                type: 'POST',
                xhr: function() {
                    var myXhr = $.ajaxSettings.xhr();
                    if(myXhr.upload) {
                        myXhr.upload.addEventListener('progress', function(e) {
                            upHandler(e);
                        }.bind(this), false);
                    }
                    return myXhr;
                },

                headers: {
                    "Authorization": circlePassword
                },

                success: function() {
                    console.log('Uploaded ', file.name);

                    fileUploaded();
                    callback();
                }.bind(this),

                error: function(request, status, err) {
                    console.log('Error while uploading:', request, status, err);

                    callback(err);
                },

                data: formData,
                cache: false,
                contentType: false,
                processData: false
            }, 'json');

        }, function(err) {
            if(err)
                alert('Error: ', err);

            console.log('Upload finished');
            this.handleUploadFinished();
        }.bind(this));

    },

    uploadSelect: function() {
        var files = this.refs.fileselect.getDOMNode().files;
        this.uploadFiles(files);
    },

    uploadDrag: function(e) {
        e.preventDefault();

        var files = e.target.files || e.dataTransfer.files;
        this.uploadFiles(files);
    },

    uploadDragHover: function(e) {
        if(e.type === 'dragover')
            this.setState({filedragHover: true});
        else
            this.setState({filedragHover: false});

        return false;
    },

    render: function() {
        var dragClasses = {
            'filedrag': true,
            'filedrag-hover': this.state.filedragHover,
            'filedrag-uploading': this.state.uploadInProgress
        };

        return (
            React.DOM.div( {className:"row file-upload"}, 
                React.DOM.form( {ref:"uploadform", className:"col-md-12"}, 
                    React.DOM.h5(null, "Choose your files to upload:"),
                    React.DOM.input( {type:"file", ref:"fileselect", name:"photos[]", multiple:"multiple", onChange:this.uploadSelect, disabled:this.state.uploadInProgress} ),
                    React.DOM.div(
                        {className:React.addons.classSet(dragClasses),
                        ref:"filedrag",
                        onDrop:this.uploadDrag,
                        onDragOver:this.uploadDragHover,
                        onDragLeave:this.uploadDragHover}, 
                        this.state.uploadInProgress ? 'Upload in progress...' : 'or drag files here',React.DOM.br(null ),
                        this.state.uploadInProgress ? this.state.uploadedFiles + ' files uploaded.' : ''
                    ),
                    ProgressBar( {active:true, now:this.state.uploadProgress} )
                )
            )
        );
    }
});

var Album = React.createClass({displayName: 'Album',
    mixins: [GoogleAnalyticsMixin],

    getInitialState: function() {
        return {
            upload: false,
            photos: null
        };
    },

    addPhotos: function() {
        this.setState({upload: true});
    },

    uploadFinished: function() {
        this.props.model.refresh();
        this.setState({upload: false});
    },

    openCircle: function() {
        window.location.hash = '#/circles/' + this.props.model.album.circleId;
    },

    render: function() {
        var model = this.props.model;

        var photos = model.album.photos.map(function(p) {
            return (
                PhotoThumb( {photo:p} )
            );
        });

        return (
            React.DOM.div( {className:"row"}, 
                React.DOM.div( {className:"col-md-12 circle"}, 

                    React.DOM.div( {className:"pull-right space-left"}, 
                        Button( {bsStyle:"default", bsSize:"small", onClick:this.openCircle}, 
                            React.DOM.span( {className:"glyphicon glyphicon-arrow-left"}),' ',
                            "Back"
                        )
                    ),

                    React.DOM.div( {className:"pull-right"}, 
                        Button( {bsStyle:"default", bsSize:"small", onClick:this.addPhotos}, 
                            React.DOM.span( {className:"glyphicon glyphicon-upload"}),' ',
                            "Upload Photos"
                        )
                    ),

                    React.DOM.div( {className:"visible-sm"}, React.DOM.br(null )),

                    React.DOM.h4(null, model.album.name,", ", React.DOM.small(null, model.album.photos.length, " photos.")),

                    React.DOM.div( {className:this.state.upload ? '' : 'hide'}, 
                        FileUpload( {model:model, uploaded:this.uploadFinished})
                    ),

                    React.DOM.div( {className:"photos"}, 
                        photos
                    )
                )
            )

        );
    }
});

var AlbumItem = React.createClass({displayName: 'AlbumItem',
    getInitialState: function() {
        return {
            albumStyle: {},
            imageStyle: {},
            textStyle: {}
        };
    },

    openAlbum: function() {
        var album = this.props.model;

        window.location.hash = '#/albums/' + album._id;
    },

    setColors: function() {

        if(this.props.model.examplePhoto === '' || typeof this.props.model.examplePhoto === 'undefined') {
            this.setState({
                albumStyle: { backgroundColor: '#eeeeee'}
            });
            return;
        }

        var colorThief  = new ColorThief();
        var img = document.createElement('img');
        img.crossOrigin = 'Anonymous';
        img.src = this.props.model.examplePhoto;

        img.onload = function() {
            var color = colorThief.getColor(img);
            var colorRgb = 'rgb(' + color.join(',') + ')';

            var albumStyle = {
                backgroundColor: colorRgb
            };

            var imageStyle = {
                boxShadow: colorRgb + ' 12px 15px 20px inset, ' + colorRgb + ' -1px -1px 150px inset'
            };

            var textStyle = {
                color: 'rgb(' + (255 - color[0]) + ',' + (255 - color[1]) + ',' + (255 - color[2]) + ')'
            };

            this.setState({
                albumStyle: albumStyle,
                imageStyle: imageStyle,
                textStyle: textStyle
            });
        }.bind(this);
    },

    componentDidMount: function() {
        //this.setColors();

        this.setState({
                albumStyle: { backgroundColor: '#eeeeee'}
        });
    },

    render: function() {
        var album = this.props.model;

        var classes = React.addons.classSet({
            'hide': (typeof this.state.albumStyle.backgroundColor === 'undefined'),
            'album-item':true
        });

        return (
            React.DOM.li( {style:this.state.albumStyle, className:classes, onClick:this.openAlbum}, 
                React.DOM.div( {style:this.state.imageStyle, className:"art-wrap"}, 
                    React.DOM.img( {ref:"examplePhoto", src:album.examplePhoto, className:"img-thumbnail"} )
                ),
                React.DOM.h4( {style:this.state.textStyle}, album.name,", ", React.DOM.small(null, album.photoCount, " photos."))
            )
        );
    }
});