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
const tempOutputFilesDir = path.join(__dirname, '..', '..', 'outputFiles');
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

var stitchProject = (projectObject) => {
	var slides = projectObject.get('slides');
    console.log(slides);
	slides.fetch({
		success: (slides) => {
            console.log('slides : fetch : success');
			var elements = slides.get('elements');

			console.log(elements);
			var stitchedFileNames = [];
			var count = 0;
			var numElements = elements.length;
			var slide = elements[count];

			var stitchOneSlide = (slide) => {
                console.log('stitchOneSlide : called');
				slide.fetch().then(
					() => {
                        console.log('before get new unique file name');
						var outputFileName = fileUtils.getNewUniqueFileName(VIDEO_FILE_EXTENSION);
                        console.log('after get new unique file name');
						BaseResourceClass.stitchSlide(slide, outputFileName).then(
							(stitchedFileName) => {
								if(stitchedFileName) {
									// not falsey
                                    if(stitchedFileName) {
                                        stitchedFileNames.push(stitchedFileName);
                                    } else {

                                    }
									console.log(stitchedFileNames);
								}
								count += 1;
								if(count !== numElements) {
									// stitch next element
									slide = elements[count];
									stitchOneSlide(slide);
								} else {
                                    console.log(stitchedFileNames);
                                    binaryStitch(stitchedFileNames).then(
                                        // all elements done
										(file) => {
                                            // TODO here, instead of getting a new Parse File,
                                            // we have to send the video file to server, get back
                                            // the Video URL and save it in our database
                                            onPostStitch(file).then(
                                                (file) => {
        											file.save().then(
        												() => {
        													console.log(projectObject);
        													projectObject.set('project_video', file);
                                                            projectObject.set('video_path', file.url());
        													projectObject.save().then(
        														() => {
        															console.log('stitching complete ;)');
        															onStitchComplete(projectObject);
        														}, (error) => {
        															console.log(error);
        														}
        													);
        													console.log('thenthen');

        												}, (error) => {
        													console.log(error);
        												}
        											);
                                                }, (error) => {
                                                    console.log(error);
                                                }
                                            )
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

var binaryStitch = (fileUrls) => {

    // var stitchCommandString = 'ls ' + fileUrls[0] + ' ' + fileUrls[1] + ' | perl -ne \'print "file $_"\' | ' + ffmpegConfig.FFMPEG_PATH + ' -y -f concat -safe 0 -i - -c copy ' + outputFile;

    return new Promise((fulfill, reject) => {
        var outputFile = fileUtils.getNewUniqueFileName(VIDEO_FILE_EXTENSION);
        var stitchCommandString = ffmpegConfig.FFMPEG_PATH + ' -y -f concat -safe 0 -i\n';
        for(var i=0; i<fileUrls.length; i++) {
            stitchCommandString += ' file \'' + fileUrls[i] + '\'\n';
        }
        stitchCommandString += ' -c copy ' + outputFile;
        console.log('stitch command string : ' + stitchCommandString);
        try {
            exec(stitchCommandString, (error, stdout, stderr) => {
                console.log('stdout: ' + stdout);
                console.log('stderr: ' + stderr);
                if (error !== null) {
                     console.log('exec error: ' + error);
                }
                fulfill(outputFile);
            });
        } catch (e) {
            console.log(e);
            reject(e);
        }
    });

    // console.log('binaryStitch called with fileUrls : ');
    // console.log(fileUrls);
    // return new Promise((fulfill, reject) => {
    //     if(fileUrls.length > 2) {
    //         binaryStitch(fileUrls.slice(0, fileUrls.length/2)).then(
    //             (filename1) => {
    //                 binaryStitch(fileUrls.slice(fileUrls.length/2, fileUrls.length)).then(
    //                     (filename2) => {
    //                         binaryStitch([filename1, filename2]).then(
    //                             (resultFileName) => {
    //                                 fulfill(resultFileName);
    //                             }
    //                         );
    //                     }
    //                 );
    //             }
    //         );
    //     } else if(fileUrls.length == 1) {
    //         fulfill(fileUrls[0]);
    //     } else {
    //         var outputFile = fileUtils.getNewUniqueFileName(VIDEO_FILE_EXTENSION);
    //         console.log('stitching files : ' + fileUrls[0] + ' and ' + fileUrls[1] + ' to : ' + outputFile);
    //
    //         try {
    //             var stitchCommandString = 'ls ' + fileUrls[0] + ' ' + fileUrls[1] + ' | perl -ne \'print "file $_"\' | ' + ffmpegConfig.FFMPEG_PATH + ' -y -f concat -safe 0 -i - -c copy ' + outputFile;
    //             console.log(stitchCommandString);
    //             exec(stitchCommandString, (error, stdout, stderr) => {
    //                 console.log('stdout: ' + stdout);
    //                 console.log('stderr: ' + stderr);
    //                 if (error !== null) {
    //                      console.log('exec error: ' + error);
    //                 }
    //                 fulfill(outputFile);
    //             });
    //         } catch (e) {console.log(e)}
    //     }
    // });
}

var onPostStitch = (finalOutputFile) => {
    return new Promise((fulfill, reject) => {
        var reader = new FileReader();
        reader.onload = () => {
            var base64String = reader.result.split(',')[1];
            var file = new Parse.File("myfile.mp4", { base64: base64String});
            console.log('before fulfilling');
            fulfill(file);
        }
        reader.readAsDataURL(new File(finalOutputFile));
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

var onStitchComplete = (projectObject) => {
    // deleteAllTempFiles();

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
