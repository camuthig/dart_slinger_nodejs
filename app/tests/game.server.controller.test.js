'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
    proxyquire = require('proxyquire').noPreserveCache(),
    cricket_stub = {},
    controller = proxyquire('../../app/controllers/games', {'./games/games.cricket': cricket_stub}),
	//controller = require('../../app/controllers/games'),
	User = mongoose.model('User'),
	Game = mongoose.model('Game');

/**
 * Globals
 */
var player1, player2, game, req_game;

/**
 * Unit tests
 */
describe('Game Controller Unit Tests:', function() {
	before(function() {

		player1 = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: 'username',
			password: 'password',
            provider: 'local'
		});

		player2 = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: 'username2',
			password: 'password',
            provider: 'local'
		});

        player1.save();
        player2.save();
	});

	describe('Create Logic', function() {
		it('should not be able to create a game if the requesting user is not in it', function() {
			var req = {
				user: player1,
				body: {
					name: 'Cricket',
					game_type: 'cricket',
					player1: 'ab181392923829398aljasdkj',
					player2: player2._id
				}
			};
			var error;

			controller.createLogic(req, function(result){
				error = result;
				error.should.have.property('error');
				error.should.not.have.property('_id');
			});
		});

		it('should be able to create a game without problems', function() {
			var req = {
				user: player1,
				body: {
					name: 'Cricket',
					game_type: 'cricket',
					player1: player1._id,
					player2: player2._id
				}
			};

			controller.createLogic(req, function(result){
				game = result;
				game.should.not.have.property('error');
				game.should.have.property('_id');
				game.should.have.property('scoreboard');
			});
		});
	});

	describe('Play Logic', function() {
		//var req_game = {};
		var req = {};
		var test_round = {};

		var checkCreated = function(done) {
			if(req_game) {
				done();
			} else {
				setTimeout( function() {
					checkCreated(done);}, 1000);
			}
		};

		before(function createGame(done) {
			var build_req = {
				user: player1,
				body: {
					name: 'Cricket',
					game_type: 'cricket',
					player1: player1._id,
					player2: player2._id
				}
			};

			controller.createLogic(build_req, function(result){
				Game.findById(result.id).
                    populate('player1', 'displayName').
                    populate('player2', 'displayName').
                    populate('current_thrower', 'displayName').
                    exec(function(err, game) {
                        req_game = game ;
                    });
			});

			checkCreated(done);
		});

		it('should not allow more than three throws per round', function() {
			test_round = {
				1: {
					number: 1,
					multiplier: 1,
				},
				2: {
					number: 1,
					multiplier: 1,
				},
				3: {
					number: 1,
					multiplier: 1,
				},
				4: {
					number: 1,
					multiplier: 1,
				},
			};
			req_game.round = test_round;
			req = {
				user: player1,
				game: game,
				body: req_game
			};

			controller.updateLogic(req, function(result){
				result.should.have.property('error');
				result.error.should.have.property('message', 'There can only be three throws per round.');
			});
		});

		it('should not allow a number without a multiplier or vice versa', function() {
			test_round = {
				1: {
					number: null,
					multiplier: 1,
				},
				2: {
					number: 1,
					multiplier: null,
				},
				3: {
					number: null,
					multiplier: null,
				}
			};
			req_game.round = test_round;
			req = {
				user: player1,
				game: game,
				body: req_game
			};

			controller.updateLogic(req, function(result) {
				result.should.have.property('error');
				result.error['1'][0].should.have.property('message', 'Both the number and multiplier must be provided.');
				result.error['2'][0].should.have.property('message', 'Both the number and multiplier must be provided.');
				result.error.should.not.have.property('3');
			});
		});

		it('should not allow a a triple bulls eye', function() {
			test_round = {
				1: {
					number: 25,
					multiplier: 3,
				},
				2: {
					number: 'bull',
					multiplier: 3,
				},
				3: {
					number: null,
					multiplier: null,
				}
			};
			req_game.round = test_round;
			req = {
				user: player1,
				game: game,
				body: req_game
			};

			controller.updateLogic(req, function(result) {
				result.should.have.property('error');
				result.error['1'][0].should.have.property('message', 'There is no triple bulls eye on the board.');
				result.error['2'][0].should.have.property('message', 'There is no triple bulls eye on the board.');
				result.error.should.not.have.property('3');
			});
		});

        it('should not allow changes to a game with a winner', function() {
            test_round = {
                1: {
                    number: 25,
                    multiplier: 3,
                },
                2: {
                    number: 'bull',
                    multiplier: 3,
                },
                3: {
                    number: null,
                    multiplier: null,
                }
            };
            game.winner = player1;
            req_game.round = test_round;
            req = {
                user: player1,
                game: game,
                body: req_game
            };

            controller.updateLogic(req, function(result) {
                result.should.have.property('error');
                result.error.message.should.be.equal('This game is already completed.');
            });

            game.winner = null;
        });

        it('should increment the current thrower on a successful round', function() {
            test_round = {
                1: {
                    number: 20,
                    multiplier: 1,
                },
                2: {
                    number: 'bull',
                    multiplier: 1,
                },
                3: {
                    number: null,
                    multiplier: null,
                }
            };
            req_game.round = test_round;
            req = {
                user: player1,
                game: req_game,
                body: req_game
            };

            cricket_stub.updateGameWithRound = function(round, game) {
                return game;
            };

            controller.updateLogic(req, function(result) {
                result.current_thrower.should.be.equal(result.player2);
            });
        });

        it('should populate the winner display name if the game was just won', function() {
            cricket_stub.updateGameWithRound = function () {
                game.winner = game.current_thrower;
                return game;
            };

            test_round = {
                1: {
                    number: 20,
                    multiplier: 1,
                },
                2: {
                    number: 'bull',
                    multiplier: 1,
                },
                3: {
                    number: null,
                    multiplier: null,
                }
            };
            req_game.round = test_round;
            req_game.current_thrower = req_game.player1;
            req = {
                user: player1,
                game: req_game,
                body: req_game
            };

            cricket_stub.updateGameWithRound = function(round, input_game) {
                input_game.winner = player1;
                return input_game;
            };

            controller.updateLogic(req, function(result) {
                result.winner.should.have.property('id');
                result.winner.should.have.property('displayName');
                req_game.winner = null;
            });
        });
	});

	after(function(done) {
		Game.remove().exec();
		User.remove().exec();
		done();
	});
});