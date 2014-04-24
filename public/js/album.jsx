/**
 * @jsx React.DOM
 */
/* jshint browser:true */
/* jshint devel:true*/

/* global React, ReactBootstrap, $, Modal, ReactLayeredComponentMixin, ColorThief */

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
            <Modal onRequestClose={this.handleClick}>
                <img src={this.props.img} className="img-responsive magnify" onClick={this.handleClick} />
            </Modal>
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
            filedragHover: false
        };
    },

    clearFile: function () {
        this.refs.uploadform.getDOMNode().reset();
    },

    handleUploadProgress: function(e) {
        var pc = parseInt((e.loaded / e.total * 100));
        this.setState({uploadProgress: pc});
    },

    handleUploadFinished: function() {
        this.setState({
            uploadProgress: 0,
            filedragHover: false
        });

        this.clearFile();
        this.props.uploaded();
    },

    uploadFiles: function(files) {
        var upHandler   = this.handleUploadProgress;
        var formData    = new FormData();
        var files_count = 0;

        for (var i = 0; i < files.length; i++) {
            var file = files[i];

            if (!file.type.match('image.*')) {
                continue;
            }

            var ext = getExtension(file.name);

            if(['jpg', 'png', 'jpeg', 'tiff'].indexOf(ext) === -1) {
                continue;
            }

            files_count += 1;

            formData.append('photos[]', file, file.name);
        }

        if(files_count === 0)
            this.handleUploadFinished();

        $.ajax({
            url: '/albums/' + this.props.album._id + '/photos',
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

            success: function() {
                this.handleUploadFinished();
            }.bind(this),

            error: function() {
                alert('Server error. Please try again later.');
            },

            data: formData,
            cache: false,
            contentType: false,
            processData: false
        }, 'json');

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
            'filedrag-hover': this.state.filedragHover
        };

        return (
            <div className="row file-upload">
                <form ref="uploadform" className="col-md-12">
                    <h5>Choose your files to upload:</h5>
                    <input type="file" ref="fileselect" name="photos[]" multiple="multiple" onChange={this.uploadSelect}/>
                    <div
                        className={React.addons.classSet(dragClasses)}
                        ref="filedrag"
                        onDrop={this.uploadDrag}
                        onDragOver={this.uploadDragHover}
                        onDragLeave={this.uploadDragHover}>
                        or drag files here
                    </div>
                    <ProgressBar active now={this.state.uploadProgress} />
                </form>
            </div>
        );
    }
});

var Album = React.createClass({
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
        var album = this.props.model.album;

        var photos = album.photos.map(function(p) {
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
                            zurück
                        </Button>
                    </div>

                    <div className="pull-right">
                        <Button bsStyle="default" bsSize="small" onClick={this.addPhotos}>
                            <span className="glyphicon glyphicon-upload"></span>{' '}
                            Upload Photos
                        </Button>
                    </div>

                    <h4>{album.name}, <small>{album.photos.length} photos.</small></h4>

                    <div className={this.state.upload ? '' : 'hide'}>
                        <FileUpload album={album} uploaded={this.uploadFinished}/>
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
                    <img ref="examplePhoto" src={album.examplePhoto} />
                </div>
                <h4 style={this.state.textStyle}>{album.name}, <small>{album.photoCount} photos.</small></h4>
            </li>
        );
    }
});