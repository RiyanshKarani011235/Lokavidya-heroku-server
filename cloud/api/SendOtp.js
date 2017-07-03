var path = require('path');
var fs = require('fs');
var plivo = require('plivo');

// CONSTANTS
const NUMBER_OF_OTP_DIGITS = 4;
const OTP_MESSAGE = 'Hello from Lokavidya. Your OTP is ';
const PHONE_NUMBER_REGEX = /^(?:\+91)([\d]){10}$/;
// const PHONE_NUMBER_REGEX = /^(?:\+91|\+90)([\d]){10}$/;

// VARIABLES
var configDir = path.join(__dirname, '..', '..', 'config');
var data = fs.readFileSync(path.join(configDir, 'plivo_config.json'));
var config;

try {
	config = JSON.parse(data);
} catch (err) {
	console.log('config.json is corrputed')
	throw(err);
}

const authId = config.AUTH_ID;
const authToken = config.AUTH_TOKEN;

// initializing plivo REST API
var plivoRestApi = plivo.RestAPI({
  authId: authId,
  authToken: authToken
});

var validatePhoneNumber = function(phoneNumber) {
    phoneNumber = phoneNumber || null;
    if(phoneNumber === null) {
        return false;
    }
    if(!phoneNumber.match(PHONE_NUMBER_REGEX)) {
        return false;
    }
    return true;
}

Parse.Cloud.define('sendOtp', (request, response) => {

    var phoneNumber = request.params.phone_number;
    // validate phone number
    if(!validatePhoneNumber(phoneNumber)) {
        response.error('Invalid Phone Number');
        return;
    }

    // var otp = Math.floor((Math.random() * Math.pow(10, NUMBER_OF_OTP_DIGITS)) + 1);
    var otp = 1000 + Math.floor(Math.random() * (9999 - 1000 + 1));
    var otpMessage = OTP_MESSAGE + otp.toString();
   
    plivoRestApi.send_message({
        'src': '+919999999999',
        'dst': phoneNumber,
        'text': otpMessage
    }, function(status, res) {
        console.log('Status: ', status);
        console.log('API Response:\n', res);
        // yes the '==' operator is deliberately used
        if(status == 202) {
            response.success(otp);
        } else {
            response.error('Could not generate OTP');
        }
    });
});
