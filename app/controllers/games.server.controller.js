'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors'),
	Game = mongoose.model('Game'),
	_ = require('lodash');

function getGameAdapter(type) {
	var path = './games/games.' + type;
	return require(path);
}

/**
 * Create a Game
 */
exports.create = function(req, res) {
	var game = new Game(req.body);
	game.current_thrower = game.player1;

	var adapter = getGameAdapter(game.game_type.toLowerCase());
	game.scoreboard = adapter.createScoreboard();

	game.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			// For the frontend, we need the populated values
			// for the display name as well now that we know
			// the ID of the winning player.
			if (game.winner !== null) {

				// todo Figure out how to properly get this when the game
				// just finishes
				game.winner = game.current_thrower;
			}
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

	var adapter = getGameAdapter(game.game_type.toLowerCase());
	game = adapter.updateGameWithRound(req.body.round, game);


	game.player1_score += 25;

	//game = _.extend(game , updated_game);

	game.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			console.log(game);
			res.jsonp(game);
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
		console.log(game);
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