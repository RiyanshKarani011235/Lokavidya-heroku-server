var fs = require('fs');
var path = require('path');
var ffmpeg = require('fluent-ffmpeg');
var FileReader = require('filereader');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var FileAPI = require('file-api')
  , File = FileAPI.File
  , FileList = FileAPI.FileList
  , FileReader = FileAPI.FileReader
  ;
var fileUtils = require('../../utils/FileUtils.js');
var BaseParseClass = require('./BaseParseClass');
var exec = require('child_process').exec;

var configDir = path.join(__dirname, '..', '..', '..', 'config');
var data = fs.readFileSync(path.join(configDir, 'ffmpeg_config.json'));
var ffmpegConfig;

try {
	ffmpegConfig = JSON.parse(data);
} catch (err) {console.log(err);}

class BaseResourceClass extends BaseParseClass.BaseParseClass {

    // To be implemented by the implementing class
    stitch() {}

}

var stitchSlide = (slide, outputFileName, numSlide, duration) => {
    return new Promise((fulfill, reject) => {
        console.log('stitchSlide : called');
        console.log(slide);
        var childrenResources = slide.get('children_resources');
        console.log(childrenResources);
        childrenResources.fetch().then(
            () => {
                var childResource = childrenResources.get('elements')[0];
                childResource.fetch().then(
                    () => {
                        console.log(childResource);
                        if(childResource.className === 'Image') {
                            // stitch image
                            var c = childResource.get('children_resources');
                            c.fetch().then(
                                () => {
                                    var e = c.get('elements');
                                    if(e) {
                                        // elements is not falsey
                                        var audioResource = e[0];
                                        audioResource.fetch().then(
                                            () => {
                                                var audioFile = audioResource.get('file');
                                                var imageFile = childResource.get('file');
                                                console.log(audioFile);
                                                console.log(imageFile);

                                                // stitch
                                                ffmpeg()
                                                    // input
                                                    .input(audioFile.url())
                                                    .input(imageFile.url())

                                                    // output file
                                                    .output(outputFileName)
                                                    .size('800x?')
                                                    .aspect('4:3')
                                                    .autopad()
                                                    .videoCodec('libx264')
                                                    .fps(29.7)
                                                    .format('mp4')
                                                    .outputOptions([
                                                        '-c:v libx264',
                                                        '-preset slow',
                                                        '-crf 22',
                                                        '-c:a aac',
                                                        '-strict experimental',
                                                        '-pix_fmt yuv420p',
                                                        '-b:a 192k'
                                                    ])

                                                    // callbacks
                                                    .on('stderr', function(stderrLine) {
                                                        console.log('Stderr output: ' + stderrLine);
                                                    })
                                                    .on('end', function(stdout, stderr) {
                                                        console.log('Transcoding succeeded !');

                                                        // get duration of the video fileUtils
                                                        console.log('getting duration');
                                                        var commandString = ffmpegConfig.FFPROBE_PATH + ' -i ' + outputFileName + ' -show_entries format=duration -v quiet -of csv="p=0"';
                                                        exec(commandString, (error, stdout, stderr) => {
                                                            console.log('stdout: ' + stdout);
                                                            console.log('stderr: ' + stderr);
                                                            if (error !== null) {
                                                                 console.log('exec error: ' + error);
                                                            }

                                                            fulfill({
                                                                'type': 'video',
                                                                'data': outputFileName,
                                                                'duration': parseInt(stdout)
                                                            });
                                                        });
                                                    })
                                                    .run();
                                            }
                                        );
                                    } else {
                                        // no audio, so do nothing
                                        fulfill();
                                    }
                                }
                            );
                        } else if(childResource.className == 'Video') {
                            // stitch video
                            var file = childResource.get('file');
                            Parse.Cloud.httpRequest({ url: file.url() }).then(function(response) {
                                // The file contents are in response.buffer.
                                var extension = path.extname(file.url())
                                var newFileName = fileUtils.getNewUniqueFileName(extension);
                                try {
                                    fs.writeFile(newFileName, response.buffer, 'binary', (error) => {
                                        if(error) {
                                            console.log(error);
                                            reject(error);
                                        }

                                        var outputVideo = fileUtils.getNewUniqueFileName('mp4');

                                        // convert the video to a predefined format
                                        ffmpeg()
                                            // input
                                            .input(newFileName)

                                            // output file
                                            .output(outputVideo)
                                            .size('800x?')
                                            .aspect('4:3')
                                            .autopad()
                                            .videoCodec('libx264')
                                            .fps(29.7)
                                            .format('mp4')
                                            .outputOptions([
                                                '-c:v libx264',
                                                '-preset slow',
                                                '-crf 22',
                                                '-c:a aac',
                                                '-strict experimental',
                                                '-pix_fmt yuv420p',
                                                '-b:a 192k'
                                            ])

                                            // callbacks
                                            .on('stderr', function(stderrLine) {
                                                console.log('Stderr output: ' + stderrLine);
                                            })
                                            .on('end', function(stdout, stderr) {
                                                console.log('Transcoding succeeded !');
                                                fulfill({
                                                    'type': 'video',
                                                    'data': outputVideo
                                                })
                                            })
                                            .run();
                                    });
                                } catch (e) {
                                    console.log(e);
                                    reject(e);
                                }
                            });
                        } else if(childResource.className == 'Question') {
                            var questionObject = {};
                            questionObject.id = numSlide;
                            questionObject.type = 'mcq';
                            questionObject.time = duration;
                            questionObject.question = childResource.get('question_string');
                            questionObject.skippable = false;

                            var hintString = "";
                            for(var i=0; i<childResource.get('hints').length; i++) {
                                hintString += childResource.get('hints')[i] + '\n';
                            }
                            questionObject.hint = hintString;

                            questionObject.options = [];
                            for(var i=0; i<childResource.get('options').length; i++) {
                                questionObject.options.push({
                                    'id': i,
                                    'option': childResource.get('options')[i]
                                });
                            }

                            questionObject.answer = [];
                            for(var i=0; i<childResource.get('correct_options').length; i++) {
                                questionObject.answer.push(questionObject.options[childResource.get('correct_options')[i]]);
                            }

                            fulfill({
                                'type': 'question',
                                'data': questionObject
                            });
                        }
                    }
                );
            },
            (error) => {
                console.log(error);
            }
        );
    });
}

module.exports = {
    BaseResourceClass,
    stitchSlide
}
