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
    childrenResources.fetch({
        success: (childrenResources) => {
            console.log('successsssssssssss');
            console.log(childrenResources);
            var childResource = childrenResources[0];
            if(childResource.className === 'Image') {
                // stitch image
                console.log('stitching Image slide');
            } else if(childResource.className == 'Video') {
                // stitch video
                console.log('stitching Video slide');
            } else if(childResource.className == 'Question') {
                // stitch question
                console.log('stitching Question slide');
            }
        },
        error: () => {
            console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaa');
        }
    });
}

module.exports = {
    BaseResourceClass,
    stitchSlide
}
