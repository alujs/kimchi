var Firebase = require('firebase')
var trigger = false;
exports.ai = {

   'render': function( io, socket ) { 
    var result = [];
      for(var i = 0; i < 20; i++) { // or not. 
           result.push({     // Note: GAME_CLIENT JS IS SUPER IMPORTANT READ THAT. 
             x: Math.floor(Math.random()*1350),
             y: Math.floor(Math.random()*900),
             animation: 'idle',
             health: 500,
             settings: {tag: i}
           });
         }
    io.sockets.socket(socket).emit('zrender', result);
   },

   'spawner': function( fb ) { // This is called once somewhere. This fills a room/instance with
       if(!trigger) {          // zombies.  Right now it's on client side detection that will change.. soon. 
         for(var i = 0; i < 20; i++) { // or not. 
           fb.child(i).set({     // Note: GAME_CLIENT JS IS SUPER IMPORTANT READ THAT. 
             x: Math.floor(Math.random()*1350),
             y: Math.floor(Math.random()*900),
             animation: 'idle',
             health: 500,
             settings: {tag: i}
           });
         } 
       }
   }
}
