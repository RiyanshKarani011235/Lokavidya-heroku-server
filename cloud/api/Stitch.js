// FFMPEG installation for heroku
// ------------------------------------------------------------------------------
// https://elements.heroku.com/buildpacks/issueapp/heroku-buildpack-ffmpeg
// ------------------------------------------------------------------------------

var path = require('path');
var fs = require('fs');
var parse = require('parse')
var ffmpeg = require('fluent-ffmpeg');
var FileReader = require('filereader');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var FileAPI = require('file-api')
  , File = FileAPI.File
  , FileList = FileAPI.FileList
  , FileReader = FileAPI.FileReader
  ;
var exec = require('child_process').exec;
var fileUtils = require('../utils/FileUtils.js');

var BaseResourceClass = require('../model/interface/BaseResourceClass.js');

// constants
const tempOutputFilesDir = fileUtils.getNewUniqueTempFolder();
const VIDEO_FILE_EXTENSION = 'mp4';

// variables
var configDir = path.join(__dirname, '..', '..', 'config');
var data = fs.readFileSync(path.join(configDir, 'ffmpeg_config.json'));
var ffmpegConfig;

try {
	ffmpegConfig = JSON.parse(data);
    if(ffmpegConfig.FFMPEG_PATH) {
        console.log('setting ffmpeg path : ' + ffmpegConfig.FFMPEG_PATH);
        ffmpeg.setFfmpegPath(ffmpegConfig.FFMPEG_PATH);
    }
    if(ffmpegConfig.FFPROBE_PATH) {
        console.log('setting ffprobe path : ' + ffmpegConfig.FFPROBE_PATH);
        ffmpeg.setFfprobePath(ffmpegConfig.FFPROBE_PATH);
    }
} catch (err) {
    console.log(err);
}
var command = ffmpeg();

Parse.Cloud.define('stitch', (request, response) => {

	var query = new Parse.Query("Project");
	query.equalTo("objectId", request.params.project_id);
	query.first({
		success: (object) => {
			console.log('project lookup succedeed : ' + object.id);
			response.success('project lookup succedeed');
			stitchProject(object);
		},
		error: () => {
			console.log("no project with id : " + request.params.project_id);
			response.error("no project with id : " + request.params.project_id);
		}
	});
});

// TODO add promise here
var stitchProject = (projectObject) => {
	var slides = projectObject.get('slides');
    console.log(slides);
	slides.fetch({
		success: (slides) => {
            console.log('slides : fetch : success');
			var elements = slides.get('elements');

			console.log(elements);
			var stitchedFileNames = [];
            var questions = [];
			var count = 0;
			var numElements = elements.length;
			var slide = elements[count];
            var duration = 0;

			var stitchOneSlide = (slide) => {
                console.log('stitchOneSlide : called');
				slide.fetch().then(
					() => {
						var outputFileName = fileUtils.getNewUniqueFileName(VIDEO_FILE_EXTENSION);
						BaseResourceClass.stitchSlide(slide, outputFileName, count, duration).then(
                            (output) => {
                                if(output) {
                                    if(output.type === 'video') {
                                        stitchedFileNames.push(output.data);
                                        duration += output.duration;
                                    } else if(output.type === 'question') {
                                        questions.push(output.data);
                                    }
                                }
								count += 1;
								if(count !== numElements) {
									// stitch next element
									slide = elements[count];
									stitchOneSlide(slide);
								} else {
                                    console.log('--------------------------------');
                                    console.log(stitchedFileNames);
                                    console.log(questions);
                                    console.log('--------------------------------');
                                    stitchVideos(stitchedFileNames).then(
                                        // all elements done
										(stitchedVideoFile) => {
                                            stitchQuestions(questions).then(
                                                (stitchedQuestionsFile) => {
                                                    onPostStitch(stitchedVideoFile, stitchedQuestionsFile, projectObject).then(
                                                        () => {
                                                            onDone(projectObject);
                                                        }, (error) => {
                                                            console.log(error);
                                                        }
                                                    );

                                                }
                                            );
										}, (error) => {
											console.log(error);
										}
									);
								}
							}, (error) => {
								console.log(error);
							}
						);
					}
				);
			}

			stitchOneSlide(slide);
		}, error: () => {}
	});
}

var stitchVideos = (fileUrls) => {

    // var stitchCommandString = 'ls ' + fileUrls[0] + ' ' + fileUrls[1] + ' | perl -ne \'print "file $_"\' | ' + ffmpegConfig.FFMPEG_PATH + ' -y -f concat -safe 0 -i - -c copy ' + outputFile;

    return new Promise((fulfill, reject) => {
        var outputFile = fileUtils.getNewUniqueFileName(VIDEO_FILE_EXTENSION);
        var textFile = fileUtils.getNewUniqueFileName('txt');
        var fileNamesList = '';
        for(var i=0; i<fileUrls.length; i++) {
            fileNamesList += 'file ' + fileUrls[i] + '\n';
        }
        try {
            var commandString = 'echo \"' + fileNamesList + '\" >> ' + textFile;
            console.log(commandString);
            exec(commandString , (error, stdout, stderr) => {
                console.log('stdout: ' + stdout);
                console.log('stderr: ' + stderr);
                if (error !== null) {
                     console.log('exec error: ' + error);
                }

                var stitchCommandString = ffmpegConfig.FFMPEG_PATH + ' -y -f concat -safe 0 -i ' + textFile + ' -c copy ' + outputFile;
                console.log('stitch command string : ' + stitchCommandString);
                exec(stitchCommandString, (error, stdout, stderr) => {
                    console.log('stdout: ' + stdout);
                    console.log('stderr: ' + stderr);
                    if (error !== null) {
                         console.log('exec error: ' + error);
                    }
                    fulfill(outputFile);
                });
            });
        } catch (e) {
            console.log(e);
            reject(e);
        }
    });
}

var stitchQuestions = (questionsArray) => {
    return new Promise((fulfill, reject) => {
        quizJsonFile = fileUtils.getNewUniqueFileName('json');
        fs.writeFileSync(
            quizJsonFile,
            JSON.stringify(
                {
                    'quiz': {
                        'questions': questionsArray
                    }
                }
            )
        );
        fulfill(quizJsonFile);
    });
}

var onPostStitch = (videoFile, questionFile, projectObject) => {

    return new Promise((fulfill, reject) => {
        saveVideoFileAsParseFile(videoFile).then(
            (parseVideoFile) => {
                saveJsonFileAsParseFile(questionFile).then(
                    (parseQuestionsFile) => {
                        projectObject.set('project_video', parseVideoFile);
                        projectObject.set('video_path', parseVideoFile.url());          // TODO
                        projectObject.set('project_quiz', parseQuestionsFile);
                        projectObject.set('questions_path', parseQuestionsFile.url());  // TODO
                        projectObject.save().then(
                            () => {
                                fulfill();
                            }, (error) => {
                                reject(error);
                            }
                        );
                    }
                )
            }, (error) => {
                reject(error);
            }
        )
    });
}

var saveVideoFileAsParseFile = (file) => {
    return new Promise((fulfill, reject) => {
        var reader = new FileReader();
        reader.onload = () => {
            var base64String = reader.result.split(',')[1];
            var parseFile = new Parse.File('file.mp4', { base64: base64String});
            fulfill(parseFile);
        }
        reader.readAsDataURL(new File(file));
    });
}

var saveJsonFileAsParseFile = (file) => {
    return new Promise((fulfill, reject) => {
        var reader = new FileReader();
        reader.onload = () => {
            var base64String = reader.result.split(',')[1];
            var parseFile = new Parse.File('file.json', { base64: base64String});
            fulfill(parseFile);
        }
        reader.readAsDataURL(new File(file));
    });
}

var deleteAllTempFiles = () => {
    try {
        var files = fs.readdirSync(tempOutputFilesDir);
        files.forEach((file) => {
            var f = path.join(tempOutputFilesDir, file);
            console.log('deleting file : ' + f);
            fs.unlinkSync(f);
        });
    } catch (e) {console.log(e)}
}

var onDone = (projectObject) => {
    // delete all temporary files created in the process of stitching
    deleteAllTempFiles();

  	var user = projectObject.get('user');
  	user.fetch().then(
	  	() => {
		  	var pushQuery = new Parse.Query(Parse.Installation);
		  	pushQuery.equalTo('user', user);
            pushQuery.equalTo('deviceType', 'android');

		  	//Set push query
			Parse.Push.send({
				where: pushQuery,
				data: {
					alert: 'Your project has been stitched successfully. ',
					badge: 1,
					sound: 'default'
				}
				}, {
					success: function() {
					console.log('PUSH NOTIFICATION SENT');
					},
					error: function(error) {
					console.log('PUSH NOTIFICATION ERROR');
				},
				useMasterKey: true
			});

	  }
  )
}
