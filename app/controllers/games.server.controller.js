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
	var adapter = getGameAdapter(game.game_type.toLowerCase());
	res.jsonp(adapter.getPlayerRules());
}

/**
 * Create a Game
 */
exports.create = function(req, res) {
	var game = new Game(req.body);
	game.current_thrower = game.player1;

	// Verify that the current user is at least one of
	// the players in the game.
	if(parseInt(req.user._id) !== parseInt(req.body.player1) &&
		parseInt(req.user._id) !== parseInt(req.body.player2)) {
		return res.status(400).send({
			message: 'You must be one of the players in the created game.'
		});
	}

	var adapter = getGameAdapter(game.game_type.toLowerCase());
	var rules = adapter.getPlayerRules()
	game.scoreboard = adapter.createScoreboard();

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
    game.current_thrower = (game.current_thrower.id === game.player1.id) ? game.player2 : game.player1;

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
	populate('player1', 'displayName').
	populate('player2', 'displayName').
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
	populate('player1', 'displayName').
	populate('player2', 'displayName').
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
	if (req.game.player1.id !== req.user.id && req.game.player2.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};