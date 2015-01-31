'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
    mongoose = require('mongoose'),
    async = require('async'),
    controller = require('../../app/controllers/games/games.cricket'),
    User = mongoose.model('User'),
    Game = mongoose.model('Game');

/**
 * Globals
 */
var expected_board, input_game, first_user, second_user;

/**
 * Unit tests
 */
describe('Cricket Game Controller Unit Tests:', function() {

    expected_board = {
        15: {
            player1_score: 0,
            player1_closes: 0,
            player2_score: 0,
            player2_closes: 0,
        },
        16: {
            player1_score: 0,
            player1_closes: 0,
            player2_score: 0,
            player2_closes: 0,
        },
        17: {
            player1_score: 0,
            player1_closes: 0,
            player2_score: 0,
            player2_closes: 0,
        },
        18: {
            player1_score: 0,
            player1_closes: 0,
            player2_score: 0,
            player2_closes: 0,
        },
        19: {
            player1_score: 0,
            player1_closes: 0,
            player2_score: 0,
            player2_closes: 0,
        },
        20: {
            player1_score: 0,
            player1_closes: 0,
            player2_score: 0,
            player2_closes: 0,
        },
        bull: {
            player1_score: 0,
            player1_closes: 0,
            player2_score: 0,
            player2_closes: 0,
        },
        total: {
            player1_score: 0,
            player2_score: 0,
        },
    };

    before(function(done) {

        // Need some sync here to :
        //  1. Create and save a user
        //  2. Create and save a second user
        //  3. Create and save a game using the two users.
        async.waterfall([
            function(callback) {
                first_user = new User({
                    firstName: 'First',
                    lastName: 'Name',
                    displayName: 'Full Name',
                    email: 'test@test.com',
                    username: 'first',
                    password: 'password',
                    provider: 'local'
                });
                first_user.save(callback(null, first_user));
            },
            function(first_user, callback) {
                second_user = new User({
                    firstName: 'Second',
                    lastName: 'Name',
                    displayName: 'Full Name',
                    email: 'test@test.com',
                    username: 'second',
                    password: 'password',
                    provider: 'local'
                });
                second_user.save(callback(null, first_user, second_user));
            },
            function(first_user, second_user, callback){
                input_game = new Game({
                    player1: first_user,
                    player2: second_user,
                    current_thrower: first_user,
                    scoreboard: expected_board
                });
                callback(null, input_game);
            },
            function(input_game, callback) {
                input_game.
                    populate('player1', 'displayName').
                    populate('player2', 'displayName').
                    populate({path: 'current_thrower', select: 'displayName'}, function(err, game){
                        done();
                    });
            }
        ]);
    });

    describe('Create Scoreboard', function() {
        it('should create a proper cricket scoreboard.', function() {
            var result_board = controller.createScoreboard();
            expected_board.should.be.eql(result_board);
        });
    });

    describe('Update Game with Round', function() {
        it('should not count non-cricket numbers', function() {
            var test_game = input_game;
            var round = {
                1: {
                    number: 1,
                    multiplier: 3
                },
                2: {
                    number: 14,
                    multiplier: 1
                },
                3: {
                    number: 10,
                    multiplier: 2
                }
            };

            var result_game = controller.updateGameWithRound(round, test_game);
            result_game.scoreboard.should.be.eql(test_game.scoreboard);
        });

        it('should not score if the opponent has already closed a number', function() {
            var test_game = input_game;
            test_game.scoreboard[20].player2_closes = 3;
            test_game.scoreboard[20].player1_closes = 3;

            var round = {
                1: {
                    number: 20,
                    multiplier: 1
                },
                2: {
                    number: 20,
                    multiplier: 1
                },
                3: {
                    number: 20,
                    multiplier: 1
                }
            };

            var result_game = controller.updateGameWithRound(round, test_game);
            result_game.scoreboard[20].player1_score.should.be.equal(0);
        });

        it('should score if an opponent has not closed a number', function() {
            var test_game = input_game;
            test_game.scoreboard[20].player2_closes = 0;
            test_game.scoreboard[20].player1_closes = 0;

            var round = {
                1: {
                    number: 20,
                    multiplier: 3
                },
                2: {
                    number: 20,
                    multiplier: 1
                },
                3: {
                    number: 20,
                    multiplier: 1
                }
            };

            var result_game = controller.updateGameWithRound(round, test_game);
            result_game.scoreboard[20].player1_score.should.be.equal(40);
        });

        it('should set a winner when a player closes all numbers and has a score at least the same as the opponent', function() {
            var test_game = input_game;
            test_game.scoreboard[20].player1_closes = 3;
            test_game.scoreboard[19].player1_closes = 3;
            test_game.scoreboard[18].player1_closes = 3;
            test_game.scoreboard[17].player1_closes = 3;
            test_game.scoreboard[16].player1_closes = 3;
            test_game.scoreboard[15].player1_closes = 3;
            test_game.scoreboard.bull.player1_closes = 0;

            var round = {
                1: {
                    number: 'bull',
                    multiplier: 2
                },
                2: {
                    number: 'bull',
                    multiplier: 1
                },
                3: {
                    number: null,
                    multiplier: null
                }
            };

            var result_game = controller.updateGameWithRound(round, test_game);
            result_game.winner.toString().should.be.equal(test_game.current_thrower.id);

        });
    });

    after(function(done) {
        Game.remove().exec();
        User.remove().exec();

        done();
    });
});