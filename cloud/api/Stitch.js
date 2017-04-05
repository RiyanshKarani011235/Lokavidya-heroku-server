// FFMPEG installation for heroku
// ------------------------------------------------------------------------------
// https://elements.heroku.com/buildpacks/issueapp/heroku-buildpack-ffmpeg
// ------------------------------------------------------------------------------

var path = require('path');
var fs = require('fs');
var parse = require('parse')
var ffmpeg = require('fluent-ffmpeg');
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
			var stitchedSlides = [];
			elements.forEach((slide) => {
				slide.fetch().then(
					() => {
						var stitchedFile = BaseResourceClass.stitchSlide(slide);
						if(stitchedFile) {
							stitchedSlides.push(stitchedFile);
						}
					}
				);
			});
			console.log(stitchedSlides);
		}, error: () => {
		}
	});
}
