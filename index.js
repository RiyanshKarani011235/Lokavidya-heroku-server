// https://elements.heroku.com/buildpacks/issueapp/heroku-buildpack-ffmpeg

var fs = require('fs');
var path = require('path');
var ParseServer = require('parse-server').ParseServer;
var express = require('express');

var configDir = path.join(__dirname, 'config');
var data = fs.readFileSync(path.join(configDir, 'config.json'));
var config;

try {
	config = JSON.parse(data);
} catch (err) {
	console.log('config.json is corrputed')
	throw(err);
}

// Heroku dynamically assigns your app a port, so you can't set the port
// to a fixed number. Heroku adds the port to the env, so you can pull it from there.
const PORT = process.env.PORT || 5000;
// const DATABASE_URI =  config.MONGO_DB_URL;
const DATABASE_URI = process.env.DATABASE_URI || process.env.MONGODB_URI || config.MONGO_DB_URL;
const CLOUD_URL = process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js';
const APP_ID = process.env.APP_ID || config.APP_ID;
const MASTER_KEY = process.env.masterKey || config.MASTER_KEY;
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:' + PORT + '/parse';

if (!DATABASE_URI) {
  throw new Error('DATABASE_URI not specified');
}

// generate parse-server middleware
var api = new ParseServer({
	databaseURI: DATABASE_URI,
	cloud: CLOUD_URL,
	appId: APP_ID,
	masterKey: MASTER_KEY,
	serverURL: SERVER_URL,
	liveQuery: {
		classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
	},
	push: {}
});

// initialize parse
var Parse = require('parse/node');
Parse.initialize('app', 'master');

// instantiate express
var app = express();
app.set('port', PORT);

// default route
app.get('/', (req, res) => {
	console.log('request on default route');
	res.sendFile(path.join(__dirname, 'index.html'));
});

// instantiate express route for parse
app.use('/parse', api);

// start http server
app.listen(PORT, function() {
  console.log('Node app is running on port : ' + PORT);
  console.log('Server Config : ');
  console.log('----------------');
  console.log('database URI : ' + DATABASE_URI);
  console.log('app ID : ' + APP_ID);
  console.log('master key : ' + MASTER_KEY);
  console.log('server URL : ' + SERVER_URL);
});
