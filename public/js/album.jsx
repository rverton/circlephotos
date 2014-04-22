/**
 * @jsx React.DOM
 */
/* jshint browser:true */
/* jshint devel:true*/

/* global React, ReactBootstrap, $ */

var Button = ReactBootstrap.Button;
var ProgressBar = ReactBootstrap.ProgressBar;

var PhotoThumb = React.createClass({
    render: function() {

        return (
            <div className="photo">
                <img src={this.props.photo.url} className="img-thumbnail" />
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

    handleUploadProgress: function(e) {
        var pc = parseInt((e.loaded / e.total * 100));
        this.setState({uploadProgress: pc});
    },

    handleUploadFinished: function() {
        this.setState({
            uploadProgress: 0,
            filedragHover: false
        });

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
                <div className="col-md-12">
                    <h5>Choose your files to upload:</h5>
                    <input type="file" ref="fileselect" name="photos[]" multiple="multiple" onChange={this.uploadSelect}/>
                    <div
                        className={React.addons.classSet(dragClasses)}
                        ref="filedrag"
                        onDrop={this.uploadDrag}
                        onDragOver={this.uploadDragHover}
                        onDragLeave={this.uploadDragHover}
                    >
                        or drag files here
                    </div>
                    <ProgressBar active now={this.state.uploadProgress} />
                </div>
            </div>
        );
    }
});

var Album = React.createClass({
    getInitialState: function() {
        return {
            upload: false
        };
    },

    addPhotos: function() {
        this.setState({upload: true});
    },

    uploadFinished: function() {
        this.props.model.inform();
        this.setState({upload: false});
    },

    openCircle: function() {
        window.location.hash = '#/circles/' + this.props.model.album.circleId;
    },

    render: function() {
        var album = this.props.model.album;

        var photos = [
            <div className="col-md-3">
                <div className="photo photos-add" onClick={this.addPhotos}>
                    <img src="/img/add_photo.png" className="img-thumbnail" />
                </div>
            </div>,

            album.photos.map(function(p) {
                return (
                    <div className="col-md-3">
                        <PhotoThumb photo={p} />
                    </div>
                );
            })
        ];

        if(photos.length === 0) {
            photos.push();
        }

        return (
            <div className="row">
                <div className="col-md-12 circle">

                    <div className="pull-right">
                        <Button bsStyle="default" bsSize="small" onClick={this.openCircle}>
                            <span className="glyphicon glyphicon-arrow-left"></span>{' '}
                            zurück
                        </Button>
                    </div>

                    <h4>{album.name}</h4>

                    <div className={this.state.upload ? '' : 'hide'}>
                        <FileUpload album={album} uploaded={this.uploadFinished}/>
                    </div>

                    <div className="row photos">
                    {photos}
                    </div>
                </div>
            </div>

        );
    }
});