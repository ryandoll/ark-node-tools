var Gamedig = require('gamedig');
Gamedig.query(
    {
        type: 'arkse',
        host: 'rhino.game-server.cc'
    },
    function(state) {
        if(state.error) console.log("ARK server is offline.");
        else console.log(state);
    }
);
