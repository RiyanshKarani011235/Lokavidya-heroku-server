var ffmpeg = require('fluent-ffmpeg');

var BaseParseClass = require('./BaseParseClass');

class BaseResourceClass extends BaseParseClass.BaseParseClass {

    // To be implemented by the implementing class
    stitch() {}

}

var stitchSlide = (slide) => {
    console.log('stitchSlide : called');
    console.log(slide);
    var childrenResources = slide.get('children_resources');
    console.log(childrenResources);
    childrenResources.fetch().then(
        (object) => {
            console.log('hurray');
        },
        (error) => {
            console.log('hmmm');
        }
    );
}

module.exports = {
    BaseResourceClass,
    stitchSlide
}
