var fs = require('fs');
var watch = require('node-watch');
var request = require('request');
var parseArgs = require('minimist')(process.argv, { 'string': 'webhook-id'}); // Even though webhook-id comes in as a NUMBER, convert to a string.
var logDir;
var webHookUrl = 'https://discordapp.com/api/webhooks/{{webhook-id}}/{{webhook-token}}';
var missingParameters = false;

if(parseArgs['webhook-id']){
  webHookUrl = webHookUrl.replace('{{webhook-id}}', parseArgs['webhook-id']);
} else {
  console.log('Parameter --webhook-id not found!');
  missingParameters = true;
}

if(parseArgs['webhook-token']){
  webHookUrl = webHookUrl.replace('{{webhook-token}}', parseArgs['webhook-token']);
} else {
  console.log('Parameter --webhook-token not found!');
  missingParameters = true;
}

if(parseArgs['logs']){
  logDir = parseArgs['logs'];
} else {
  console.log('Parameter --logs not found!');
  missingParameters = true;
}

if(missingParameters){
  process.exit(1);
}

console.log('webHookUrl: ' + webHookUrl);
console.log('logDir: ' + logDir);

// Watch ServerGame files
var filter = function(fn) {
  return function(filename) {
    if (filename.indexOf('ServerGame') >= 0) {
      fn(filename);
    }
  }
}

watch(logDir, filter(function(filename) {
  var fs = require('fs');
  fs.readFile(filename, 'utf-8', function(err, data) {
      if (err) throw err;
      var lines = data.trim().split('\n');
      var lastLine = lines.slice(-1)[0];
      processLogEntry(lastLine);
  });
}));

function processLogEntry(line){
  // Split on the last colon (best guess for now)
  var lineArray = line.split(':');
  var message = lineArray[lineArray.length - 1].trim();
  console.log('New line added: ' + message);
  analyzeLine(message);
}

var defaultImage = 'http://rhino.game-server.cc/ark/images/ark-logo.jpg';
//var dinoImage = 'http://rhino.game-server.cc/ark/images/dinos/$$$.png'; // I will update this later.
var dinoImage = defaultImage;
var messageTypes = {
  death : {
    enabled : true,
    condition : 'was killed by',
    title : 'Kill shot!',
    icon : 'http://rhino.game-server.cc/ark/images/skull.png'
  },
  suicide : {
    enabled : true,
    condition : 'was killed!',
    title : 'Well, that didn\'t work out...',
    icon : 'http://rhino.game-server.cc/ark/images/darwin.jpg'
  },
  tame : {
    enabled : true,
    condition : 'Tamed a',
    title : 'Dino Whisperer',
    icon : defaultImage,
    process : function(message){ // Example of writing a custom rule for a specific condition.
      var dinoArray = message.split('(');
      var dino = dinoArray[dinoArray.length - 1].split(')')[0];
      this.icon = dinoImage.replace('$$$', dino).toLowerCase();
      message += '\n http://ark.gamepedia.com/' + dino;
      return message;
    }
  },
  reboot : {
    enabled : true,
    condition : 'Log file open',
    title : 'Server was restarted!',
    icon : defaultImage
  },
  leave : {
    enabled : true,
    condition : 'left this ARK!',
    title : '',
    icon : defaultImage
  },
  join : {
    enabled : true,
    condition : 'joined this ARK!',
    title : '',
    icon : defaultImage
  }
};

function analyzeLine(line){
  var found = false;
  var result = { enabled: false};
  for (var key in messageTypes) {
    if (messageTypes.hasOwnProperty(key)) {
      if(line.indexOf(messageTypes[key].condition) >= 0 ){
        found = true;
        result = messageTypes[key];
        break;
      }
    }
  }
  if(result.enabled){
    postToDiscord(result, line);
  }
}

function postToDiscord(messageObj, message){
  var title = 'Ark Server';
  if(messageObj.title != ''){
    title += ': ' +  messageObj.title;
  }
  if(messageObj.process){
    message = messageObj.process(message);
  }
  var body = {
      'username': title,
      'avatar_url': messageObj.icon,
      'content': message,
      'tts': false,
      'file': null,
      'embeds': []
  };
  request.post(webHookUrl, {form:body}, function (error, response, body) {
    if(error){
      console.log(error);
    }
  })
}
