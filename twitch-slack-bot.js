var CronJob = require('cron').CronJob;

var https = require('https');

var _ = require('underscore');

var usernames = ['veeteetee', 'fungalpanic', 'pandoraproxy', 'rhuang01', 'samic_72'];

var baseOptions = {
	host: 'api.twitch.tv',
	path: '',
	port: 443,
	method: 'GET'
};

var postOptions = {
	host: 'ps4destinygroup.slack.com',
	port: 443,
	method: 'POST'
};

var onlineUsers = [];

baseOptions.path = 'herpderp';

// Every minute, check the list of twich users to see if they're online;
// If they are, add them to a small cache (so as to not to spam the chat)
// and post to our Slack channel that they're online
var job = new CronJob(
	'0 * * * * *', function() {

		usernames.forEach(function(twitchName) {
			var requestOptions = baseOptions;
			requestOptions.path =  '/kraken/streams/' + twitchName;

			https.request(requestOptions, function(response) {
				var str = '';

				response.on('data', function (chunk) {
					str += chunk;
				});

				response.on('end', function () {
					var twitchJsonResponse = JSON.parse(str);
					if (twitchJsonResponse.stream != null) {
						// User is online and hasn't been online; 
						// add user to the online list then post to Slack
						if (!_.contains(onlineUsers, twitchName)) {
							onlineUsers.push(twitchName);
							console.log(twitchName + ' is streaming!');
							// Post to Slack that someone has started streaming
							var postRequest = https.request(postOptions, function(name) {
								console.log('Post to slack complete');
							}); 

							postRequest.write('Someone has started streaming! Check them out: http://www.twitch.tv/' + twitchName);
							postRequest.end();
						} else {
							console.log(twitchName + ' has already been streaming');
						}
					} else {
						// User has been online and is no longer online;
						// remove user to online list then post to Slack
						if (_.contains(onlineUsers, twitchName)) {
							var index = onlineUsers.indexOf(twitchName);
							onlineUsers.splice(index, 1);
							console.log(twitchName + ' is no longer streaming!');
							// Post to Slack that someone has stopped streaming
							var postRequest = https.request(postOptions, function(name) {
								console.log('Post to slack complete');
							}); 

							postRequest.write('Aw, looks like http://www.twitch.tv/' + twitchName + ' has stopped streaming');
							postRequest.end();
						} else {
							console.log(twitchName + ' still is not streaming!');	
						}
					}
				});
			}).end();
		});
	},
	null,
	true,
	'America/Los_Angeles'
);

job.start();

// Set up a dummy server to appease the Heroku gods
var http = require('http');
http.createServer(function (request, result) {
	result.writeHead(200, {'Content-Type': 'text/plain'});
	result.send('I\'m running!\n');
}).listen(process.env.PORT || 5000);
