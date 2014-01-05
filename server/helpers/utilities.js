var db = require('firebase');

module.exports = function( type, args ) { 
	var ut = {};

	ut.resync = function( arr ) { // room and list of entities
	  var bound = arr.length; 
		var selection = Math.floor(Math.random()*bound);
	  return syncArray[selection];
  };


	ut.nukeRoom = function( room ) {
		var target =  new db('https://hrproj.firebaseio.com/' + room);
		target.remove();
	};

	ut.gameOver = function() {
		// Check to see if all the players are dead
		// redirect page or show a pop up
		// call nukeRoom 
	};

	ut.killPlayer = function() {
		
	};



  ut[type](args);   
}