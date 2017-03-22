// FFMPEG installation for heroku
// ------------------------------------------------------------------------------
// heroku buildpacks:set https://github.com/shunjikonishi/heroku-buildpack-ffmpeg
// git add .
// git push heroku master
// ------------------------------------------------------------------------------

var parse = require('parse')

var ffmpeg = require('fluent-ffmpeg');
var command = ffmpeg();
console.log(command)
