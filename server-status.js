var Gamedig = require('gamedig');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var server = app.listen(3000, function () {
    console.log('Listening on port %s...', server.address().port);
});

app.get('/ark-status', function(req, res) {
  Gamedig.query(
      {
          type: 'arkse',
          host: 'rhino.game-server.cc'
      },
      function(state) {
          var message;
          if(state.error){
            message = {
              'error' : 'Server is offline.'
            }
          } else {
            message = state;
          }
          res.send(message);
      }
  );
});

app.get('/minecraft-status', function(req, res) {
  Gamedig.query(
      {
          type: 'minecraftping',
          host: 'rhino.game-server.cc'
      },
      function(state) {
          var message;
          if(state.error){
            message = {
              'error' : 'Server is offline.'
            }
          } else {
            message = state;
          }
          res.send(message);
      }
  );
});
