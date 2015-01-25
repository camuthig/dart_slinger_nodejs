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
 * Create a Game
 */
function createLogic(req, next) {
	var game = new Game(req.body);
	game.current_thrower = game.player1;

	// Verify that the current user is at least one of
	// the players in the game.
	if(req.user._id.toString() !== req.body.player1.toString() &&
		req.user._id.toString() !== req.body.player2.toString()) {
		return next({
			error: {
				message: 'You must be one of the players in the created game.'
			}
		});
	}

	var adapter = getGameAdapter(game.game_type.toLowerCase());
	game.scoreboard = adapter.createScoreboard();

	game.save(function(err) {
		if (err) {
			next({
				error: {
					message: errorHandler.getErrorMessage(err)
				}
			});
		} else {
			return next(game);
		}
	});
}

exports.create = function(req, res) {
	createLogic(req, function(result) {
		if ('error' in result) {
			return res.status(400).send(result);
		} else {
			res.jsonp(result);
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
 * Validate the update request input for the game.
 * @param  {Request}	req  	The Express request
 * @param  {Function} 	next 	The callback function to execute next
 */
function validateUpdateRequst(req, next) {
	var round = req.body.round;
	var errors = {error: {}};

	// Invalid round data would be:
	// 		Number not in 1-20 or 25
	// 		Multiplier not between 1 and 3
	// 		Number 25 and Multiplier 3
	// 		More than three throws in a round
	if (_.size(round) > 3) {
		errors = {
			error: {
				message: 'There can only be three throws per round.'
			}
		};
	}
	for (var index = 1; index <= _.size(round); index++) {
		var index_errors = [];
        console.log(round[index].number);
		if ( round[index].number &&
                !(round[index].number >= 1 && round[index].number <= 20) &&
                (round[index].number !== 25 && round[index.number !== 'bull'])) {
			index_errors.push({
				message: 'The number is not a valid value on a dart board.'
			});
		}
		if ( round[index].multiplier &&
                !(round[index].multiplier >=1 &&
                round[index].multiplier <= 3)) {
			index_errors.push({
				message: 'The multiplier is not a valid value on a dart board.'
			});
		}
		if ((round[index].number === 25 || round[index].number === 'bull') && round[index].multiplier === 3) {
			index_errors.push({
				message: 'There is no triple bulls eye on the board.'
			});
		}
        if ( (round[index].number && !round[index].multiplier) || (!round[index].number && round[index].multiplier)) {
            index_errors.push({
                message: 'Both the number and multiplier must be provided.'
            });
        }

		if (_.size(index_errors) !== 0) {
			errors.error[index] = index_errors;
		}
	}

	next(errors);
}

/**
 * Store the data on the round for performance tracking
 * @param   {Request}   req         The express request
 * @param   {Game}      game_id     The id of the Game object the round is part of
 * @param   {User}      user_id     The id of the User object the round is linked to
 */
function saveRound(req, game_id, user_id) {
    var round = new Round({game: game_id, user: user_id});
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
}

/**
 * Update the game using the game adapter and input round data.
 * @param  {Request}    req     The express request
 * @param  {Function}   next    The function to call next
 * @return {Game}               An update game object
 */
function updateLogic(req, next) {
    var game = req.game ;

    if(game.winner){
        return next(game);
    }

    validateUpdateRequst(req, function(errors) {
        if(!(_.isEmpty(errors.error))) {
            console.log('There was a validation error');
            return next(errors);
        } else{
            console.log('There was not a validation error');
            var adapter = getGameAdapter(game.game_type.toLowerCase());
            game = adapter.updateGameWithRound(req.body.round, game);

            var old_thrower = game.current_thrower;
            game.current_thrower = (game.current_thrower.id === game.player1.id) ? game.player2 : game.player1;

            game.save(function(err) {
                if (err) {
                    return next({
                        error: {
                            message: errorHandler.getErrorMessage(err)
                        }
                    });
                } else {
                    // If winner has just been set, we need to ensure we populate the
                    // displayName value from the database.
                    if(game.winner) {
                        game.populate({path: 'winner', select: 'displayName'}, function(err, game) {
                            if (err) {
                                return next({
                                    error: {
                                        message: errorHandler.getErrorMessage(err)
                                    }
                                });
                            } else {
                                return next(game);
                            }
                        });
                    }
                    else {
                        return next(game);
                    }
                }
            });

            // Save the round information
            saveRound(req, game._id, old_thrower.id);
        }
    });
}

/**
 * Update a Game
 */
exports.update = function(req, res) {
	updateLogic(req, function(result) {
        if ('error' in result) {
            console.log('There was an error updating');
            return res.status(400).send(result);
        } else {
            console.log('There was not an error updating');
            res.jsonp(result);
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