# Circlephotos

Host your own Photo-Cloud and allow friends to create circles and albums to collaborative upload photos.

Based on [koajs](http://koajs.com/) and [reactjs](http://facebook.github.io/react/).

Demo: [http://circlephotos.robinverton.de/](http://circlephotos.robinverton.de/)

## Requirements

* node.js ^0.11.12
* imagemagick

## Installation & Usage

### Compatible node.js version

    npm install -g n    # Install node version manager
    n latest            # Switch to latest node version

### Installation

    git clone https://github.com/rverton/circlephotos
    bower install
    npm install

### Usage

    npm start

Do not forget to set your Amazon S3 credentials!

## Amazon S3
Use your environment variables to configure Amazon S3 access:

    export AWS_ACCESS_KEY_ID=
    export AWS_SECRET_ACCESS_KEY=
    export AWS_PUBLIC_URL=

## Developing with reactjs
When working with the .jsx file compile them on-the-fly with:

    jsx --extension jsx --watch public/jsx/ public/js/

More information can be found [here](http://facebook.github.io/react/docs/tooling-integration.html#jsx).

## Credits

Code by [Robin Verton](http://robinverton.de).

Frontpage image by [Billy Lam](http://www.flickr.com/photos/billy_lam/).

