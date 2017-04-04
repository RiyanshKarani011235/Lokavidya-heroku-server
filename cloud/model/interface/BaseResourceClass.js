var ffmpeg = require('fluent-ffmpeg');

var BaseParseClass = require('./BaseParseClass');

class BaseResourceClass extends BaseParseClass.BaseParseClass {

    // To be implemented by the implementing class
    stitch() {}

}

var stitchSlide = (slide) => {

    if(slide.className === 'Image') {
        // stitch image
        console.log('stitching Image slide');
    } else if(slide.className == 'Video') {
        // stitch video
        console.log('stitching Video slide');
    } else if(slide.className == 'Question') {
        // stitch question
        console.log('stitching Question slide');
    }

}

module.exports {
    BaseResourceClass,
    stitchSlide
}
