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
        () => {
            var childResource = childrenResources.get('elements')[0];
            childResource.fetch().then(
                () => {
                    if(childResource.className === 'Image') {
                        console.log('a');
                        // stitch image
                        var c = childResource.get('children_resources');
                        c.fetch().then(
                            () => {
                                console.log('b');
                                var e = c.get('elements');
                                e.fetch().then(
                                    () => {
                                        console.log('c');
                                        if(e) {
                                            // elements is not falsey
                                            var audioResource = e[0];
                                            audioResource.fetch().then(
                                                () => {
                                                    console.log('d');
                                                    var audioFile = audioResource.get('file');
                                                    audioFile.fetch().then(
                                                        () => {
                                                            console.log('e');
                                                            // we have the audio file now
                                                            var imageFile = childResource.get('file');
                                                            imageFile.fetch().then(
                                                                () => {
                                                                    console.log('f');
                                                                    // we have the image file now
                                                                    var audioFileUrl = audioFile.url();
                                                                    var imageFileUrl = imageFile.url();
                                                                    console.log('audioFileUrl : ' + audioFileUrl);
                                                                    console.log('imageFileUrl : ' + imageFileUrl);
                                                                }
                                                            )
                                                        }
                                                    )
                                                }
                                            )
                                        }
                                    }
                                )
                            }
                        )
                    } else if(childResource.className == 'Video') {
                        // stitch video
                        var file = childResource.get('file');
                    } else if(childResource.className == 'Question') {
                        // stitch question
                    }
                }
            );
        },
        (error) => {
            console.log(error);
        }
    );
}

module.exports = {
    BaseResourceClass,
    stitchSlide
}
