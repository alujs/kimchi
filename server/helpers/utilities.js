var db = require('firebase');

module.exports = function( type, args ) { 
	var ut = {};

	ut.resync = function() {
	  
  };

	ut.seeds = function() {
		// takes a bunch of random values
		// seeds an array and sends it to the AI , the AI then uses the array
		// all new things will be initialized using that array. 
		// feeds it into the client
	   // everything is done in order
	   
	};

	ut.nukeRoom = function( room ) {
		var target =  new db('https://hrproj.firebaseio.com/' + room);
		target.remove();
		// if a room has zero users, write the scores to the profile
	    // drop the room from database
	};

	ut.gameOver = function() {
		// Check to see if all the players are dead
		// redirect page or show a pop up
		// call nukeRoom 
	};

	ut.killPlayer = function() {
		
	};



  utilities[type](args);   
}