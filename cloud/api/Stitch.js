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

var BaseResourceClass = require('../model/interface/BaseResourceClass.js');

// constants
var tempOutputFilesDir = path.join(__dirname, '..', '..', 'outputFiles');
console.log('tempOutputFilesDir : ' + tempOutputFilesDir);

// variables
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
	slides.fetch({
		success: (slides) => {
			var elements = slides.get('elements');

			console.log(elements);
			var stitchedFileNames = [];
			var count = 0;
			var numElements = elements.length;
			var slide = elements[count];

			var stitchOneSlide = (slide) => {
				slide.fetch().then(
					() => {
						var outputFileName = path.join(tempOutputFilesDir, 'output' + count + '.mp4');
						BaseResourceClass.stitchSlide(slide, outputFileName).then(
							(stitchedFileName) => {
								if(stitchedFileName) {
									// not falsey
                                    if(stitchedFileName) {
                                        console.log('pushing')
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
									// // all elements done
									// stitchFinalVideo(stitchedFileNames).then(
										(file) => {
                                            onPostStitch(file).then(
                                                (file) => {
                                                    console.log('fulfilled');
        											console.log(file);
        											file.save().then(
        												() => {
        													console.log('thenthen');
        													console.log(projectObject);
        													projectObject.set('project_video', file);
        													console.log('thenthen');

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

			console.log(stitchedSlides);
		}, error: () => {
		}
	});
}

var binaryStitch = (fileUrls) => {
    console.log('binaryStitch called with fileUrls : ');
    console.log(fileUrls);
    return new Promise((fulfill, reject) => {
        if(fileUrls.length > 2) {
            binaryStitch(fileUrls.slice(0, fileUrls.legth/2)).then(
                (filename1) => {
                    binaryStitch(fileUrls.slice(fileUrls.length/2, fileUrls.length)).then(
                        (filename2) => {
                            binaryStitch([filename1, filename2]).then(
                                (resultFileName) => {
                                    fulfill(resultFileName);
                                }
                            );
                        }
                    );
                }
            );
        } else if(fileUrls.length == 1) {
            fulfill(fileUrls[0]);
        } else {
            var outputFile = getNewUniqueFileName('mp4');
            ffmpeg()
                .input(fileUrls[0])
                .input(fileUrls[1])
                .videoCodec('libx264')
                .size('640x480')
                .output(outputFile)
                .on('stderr', function(stderrLine) {
                    console.log('Stderr output: ' + stderrLine);
                })
                .on('end', function(stdout, stderr) {
                    console.log('Transcoding succeeded !');
                    fulfill(outputFile);
                })
                .run();
        }
    });
}

var onPostStitch = (finalOutputFile) => {
    var reader = new FileReader();
    reader.onload = () => {
        var base64String = reader.result.split(',')[1];
        var file = new Parse.File("myfile.mp4", { base64: base64String});
        console.log('before fulfilling');
        fulfill(file);
    }
    reader.readAsDataURL(finalOutputFile);
}

var getNewUniqueFileName = (extension) => {
    var filePath = path.join(tempOutputFilesDir, randomString(32, 'aA#'));
    if(extension) {
        filePath += '.' + extension;
    }
    while(fs.existsSync(filePath)) {
        var filePath = path.join(tempOutputFilesDir, randomString(32, 'aA#'));
        if(extension) {
            filePath += '.' + extension;
        }
    }
    console.log('generated new unique file : ' + filePath);
    return filePath;
}

var deleteAllTempFiles = () => {
    var files = fs.readdirSync(tempOutputFilesDir);
    files.foreach((file) => {
        console.log('deleting file : ' + file);
        fs.unlinkSync(file);
    });
}

var randomString = (length, chars) => {
    var mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
    var result = '';
    for (var i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
    return result;
}

var stitchFinalVideo = (stitchedFileNames) => {
	return new Promise((fulfill, reject) => {
		inputOptionsArray = [];
		for(var i=1; i<stitchedFileNames.length; i++) {
			inputOptionsArray.push('-i ' + stitchedFileNames[i]);
		}
		ffmpeg()
			.input(stitchedFileNames[0])
			.inputOptions(inputOptionsArray)
			.videoCodec('libx264')
			.size('640x480')
			.output('./outputFiles/finalvideo.mp4')
			.on('stderr', function(stderrLine) {
				console.log('Stderr output: ' + stderrLine);
			})
			.on('end', function(stdout, stderr) {
				console.log('Transcoding succeeded !');

				var reader = new FileReader();
				reader.onload = function () {
					var base64String = reader.result.split(',')[1];
					var file = new Parse.File("myfile.mp4", { base64: base64String});
					console.log('before fulfilling');
					fulfill(file);
				}
				reader.readAsDataURL(new File('./outputFiles/finalvideo.mp4'));
			})
			// .mergeToFile('./outputFiles/finalvideo.mp4', './outputFiles');
			.run();
	})
}

var onStitchComplete = (projectObject) => {
	console.log('onStitchComplete : called');
  	var user = projectObject.get('user');
  	console.log('fetching user');
  	user.fetch().then(
	  	() => {
		  	console.log('sending push notification');
		  	var pushQuery = new Parse.Query(Parse.Installation);
		  	pushQuery.equalTo('user', user);

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
					console.log('##### PUSH OK');
					},
					error: function(error) {
					console.log('##### PUSH ERROR');
				},
				useMasterKey: true
			});

	  }
  )
}
