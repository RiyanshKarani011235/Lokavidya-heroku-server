var path = require('path');
var fs = require('fs');

var tempOutputFilesDir = path.join(__dirname, '..', '..', '..', 'outputFiles');
var getNewUniqueFileName = (extension) => {
    var filePath = path.join(tempOutputFilesDir, randomString(16, 'aA#'));
    if(extension) {
        filePath += '.' + extension;
    }
    while(fs.existsSync(filePath)) {
        var filePath = path.join(tempOutputFilesDir, randomString(16, 'aA#'));
        if(extension) {
            filePath += '.' + extension;
        }
    }
    return filePath;
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

module.exports = {
    getNewUniqueFileName
}
