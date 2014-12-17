'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors'),
	Game = mongoose.model('Game'),
	Round = mongoose.model('Round'),
	Throw = mongoose.model('Throw'),
	_ = require('lodash');

function getGameAdapter(type) {
	var path = './games/games.' + type;
	return require(path);
}

/**
 * Get the game player rules
 */
exports.createRules = function(req, res) {
	var game = new Game(req.body);
	var adapter = getGameAdapter(game.game_type.toLowerCase());
	res.jsonp(adapter.getPlayerRules());
};

/**
 * Create a Game
 */
exports.create = function(req, res) {
	var game = new Game(req.body);
	game.current_thrower = game.players[0];

	// Verify that the current user is at least one of
	// the players in the game.
	var a_player = false;
	_.forEach(game.players, function(player) {
		if (parseInt(player) === parseInt(req.user._id)) {
			a_player = true;
			return false;
		}
	});
	if (!a_player) {
		return res.status(400).send({
			message: 'You must be one of the players in the created game.'
		});
	}

	var adapter = getGameAdapter(game.game_type.toLowerCase());

	// Check the maximum number of players allowed.
	var rules = adapter.getPlayerRules();
	if (rules.max_players < _.size(game.players)) {
		return res.status(400).send({
			message: 'This type of game can only have ' + rules.max_players + ' players'
		});
	}

	game = adapter.createScoreboard(game);

	game.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(game);
		}
	});
};

/**
 * Show the current Game
 */
exports.read = function(req, res) {
	res.jsonp(req.game);
};



/**
 * Update a Game
 */
exports.update = function(req, res) {
	var game = req.game ;

	if(game.winner){
		res.jsonp(game);
		return;
	}

	var adapter = getGameAdapter(game.game_type.toLowerCase());
	game = adapter.updateGameWithRound(req.body.round, game);

	var old_thrower = game.current_thrower;
	// if the index of current_thrower in players is size-1,
	// then reset the current thrower to 0. Otherwise, set
	// the current thrower to players[current_thrower_index+1]
	console.log(game.players);
	console.log(game.current_thrower);
	var current_thrower_index = -1;
	_.forEach(game.players, function(player, key) {
		if(player.id === game.current_thrower.id) {
			current_thrower_index = key;
			return false;
		}
	});
	console.log(current_thrower_index);
	if ( current_thrower_index === _.size(game.players) - 1) {
		game.current_thrower = game.players[0];
	}
	else {
		game.current_thrower = game.players[current_thrower_index+1];
	}

	game.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			// If winner has just been set, we need to ensure we populate the
			// displayName value from the database.
			if(game.winner) {
				game.populate({path: 'winner', select: 'displayName'}, function(err, game) {
					res.jsonp(game);
				});
			}
			else {
				res.jsonp(game);
			}
		}
	});

	var round = new Round({game: game._id, user: old_thrower});
	round.save(function(err) {
		if (err) {
			console.log('Error saving the round: ' + errorHandler.getErrorMessage(err));
		}
		else {
			for (var index = 1; index <= _.size(req.body.round); index++) {
				req.body.round[index].round = round;
				var dart = new Throw(req.body.round[index]);
				// We'll ignore the issue of defining the function here since the
				// functionality is simple and performance in the async scenario
				// is of little concern.
				/* jshint loopfunc:true */
				dart.save(function(err) {
					if(err) {
						console.log('Error saving throw: ' + errorHandler.getErrorMessage(err));
					}
				});
			}
		}
	});
};

/**
 * Delete an Game
 */
exports.delete = function(req, res) {
	var game = req.game ;

	game.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(game);
		}
	});
};

/**
 * List of Games
 */
exports.list = function(req, res) { Game.find().sort('-created').
	populate('players', 'displayName').
	populate('current_thrower', 'displayName').
	populate('winner', 'displayName').
	exec(function(err, games) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(games);
		}
	});
};

/**
 * Game middleware
 */
exports.gameByID = function(req, res, next, id) { Game.findById(id).
	populate('players', 'displayName').
	populate('current_thrower', 'displayName').
	populate('winner', 'displayName').
	exec(function(err, game) {
		if (err) return next(err);
		if (! game) return next(new Error('Failed to load Game ' + id));
		req.game = game ;
		next();
	});
};

/**
 * Game authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	var a_player = false;
	_.forEach(req.game.players, function(player) {
		if (parseInt(player._id) === parseInt(req.user.id)) {
			a_player = true;
			return false;
		}
	});
	if (!a_player) {
		return res.status(403).send('User is not authorized');
	}
	next();
};