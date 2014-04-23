/**
 * @jsx React.DOM
 */
/* jshint browser:true */
/* jshint devel:true*/

/* global React, ReactBootstrap, PhotoWall, $ */

var Button = ReactBootstrap.Button;
var ProgressBar = ReactBootstrap.ProgressBar;

var getExtension = function (filename) {
    if(filename.indexOf('.') === -1 )
        return '';

    return filename.split('.').pop().toLowerCase();
};

var PhotoThumb = React.createClass({
    render: function() {

        return (
            <div className="photo">
                <a><img src={this.props.photo.th.src}/></a>
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

                    <h4>{album.name}</h4>

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