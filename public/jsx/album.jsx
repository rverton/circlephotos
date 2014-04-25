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

var MagnifyImage = React.createClass({
    mixins: [ReactLayeredComponentMixin],

    handleClick: function() {
        this.setState({shown: !this.state.shown});
    },

    getInitialState: function() {
        return {shown: false, modalShown: false};
    },

    renderLayer: function() {
        if (!this.state.shown) {
            return <span />;
        }
        return (
            <ModalSimple onRequestClose={this.handleClick}>
                <img src={this.props.img} className="img-responsive magnify" onClick={this.handleClick} />
            </ModalSimple>
        );
    },

    render: function() {
        return this.transferPropsTo(
            <a onClick={this.handleClick}>
                {this.props.children}
            </a>
        );
    }
});

var PhotoThumb = React.createClass({
    render: function() {

        return (
            <div className="photo">
                <MagnifyImage img={this.props.photo.src}>
                    <img src={this.props.photo.th.src}/>
                </MagnifyImage>
            </div>
        );
    }
});

var FileUpload = React.createClass({
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
            <div className="row file-upload">
                <form ref="uploadform" className="col-md-12">
                    <h5>Choose your files to upload:</h5>
                    <input type="file" ref="fileselect" name="photos[]" multiple="multiple" onChange={this.uploadSelect} disabled={this.state.uploadInProgress} />
                    <div
                        className={React.addons.classSet(dragClasses)}
                        ref="filedrag"
                        onDrop={this.uploadDrag}
                        onDragOver={this.uploadDragHover}
                        onDragLeave={this.uploadDragHover}>
                        {this.state.uploadInProgress ? 'Upload in progress...' : 'or drag files here'}<br />
                        {this.state.uploadInProgress ? this.state.uploadedFiles + ' files uploaded.' : ''}
                    </div>
                    <ProgressBar active now={this.state.uploadProgress} />
                </form>
            </div>
        );
    }
});

var Album = React.createClass({
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
                <PhotoThumb photo={p} />
            );
        });

        return (
            <div className="row">
                <div className="col-md-12 circle">

                    <div className="pull-right space-left">
                        <Button bsStyle="default" bsSize="small" onClick={this.openCircle}>
                            <span className="glyphicon glyphicon-arrow-left"></span>{' '}
                            Back
                        </Button>
                    </div>

                    <div className="pull-right">
                        <Button bsStyle="default" bsSize="small" onClick={this.addPhotos}>
                            <span className="glyphicon glyphicon-upload"></span>{' '}
                            Upload Photos
                        </Button>
                    </div>

                    <div className="visible-sm"><br /></div>

                    <h4>{model.album.name}, <small>{model.album.photos.length} photos.</small></h4>

                    <div className={this.state.upload ? '' : 'hide'}>
                        <FileUpload model={model} uploaded={this.uploadFinished}/>
                    </div>

                    <div className="photos">
                        {photos}
                    </div>
                </div>
            </div>

        );
    }
});

var AlbumItem = React.createClass({
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
            <li style={this.state.albumStyle} className={classes} onClick={this.openAlbum}>
                <div style={this.state.imageStyle} className="art-wrap">
                    <img ref="examplePhoto" src={album.examplePhoto} className="img-thumbnail" />
                </div>
                <h4 style={this.state.textStyle}>{album.name}, <small>{album.photoCount} photos.</small></h4>
            </li>
        );
    }
});