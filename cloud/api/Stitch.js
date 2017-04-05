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
						var outputFileName = './outputFiles/output' + count + '.mp4';
						BaseResourceClass.stitchSlide(slide, outputFileName).then(
							(stitchedFileName) => {
								if(stitchedFileName) {
									// not falsey
									stitchedFileNames.push(stitchedFileName);
									console.log(stitchedFileNames);
								}
								count += 1;
								if(count !== numElements) {
									// stitch next element
									slide = elements[count];
									stitchOneSlide(slide);
								} else {
									// all elements done
									stitchFinalVideo(stitchedFileNames).then(
										(file) => {
											console.log('fulfilled');
											console.log(file);
											file.save().then(
												() => {
													console.log('thenthen');
													console.log(projectObject);
													projectObject.put('project_video', file);
													console.log('thenthen');

													projectObject.save().then(
														() => {
															console.log('stitching complete ;)');
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
			.run();
	})
}
