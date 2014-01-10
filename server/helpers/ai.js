var Firebase = require('firebase')
var trigger = false;
exports.ai = {

   'render': function( io, socket ) { 
    var result = [];
    var posit;
      for(var i = 0; i < 40; i++) { 
        posit = randomizer(1,6)
           result.push({     
             x: posit.x,
             y: posit.y,
             animation: 'idle',
             health: 400,
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
             health: 400,
             settings: {tag: i}
           });
         } 
       }
   }
}


var randomizer = function (min, max) {
  var val =  Math.floor(Math.random() * (max - min + 1) + min);
      val =  String(val);
  return options[val];
};


var options = {};
options['1'] = {x: 651, y: 1148};
options['2']= {x: 921, y: 1131};
options['3']=  {x: 1371, y: 1085};
options['4']=  {x: 1639, y: 1056};
options['5']=  {x: 1723, y: 490};
options['6']=  {x: 1322, y: 485};