'use strict';
/**
 * Create the scoreboard. Each player starts out with a target of 20.
 * The only important number on the Around the World scoreboard is the player's
 * current target.
 */
var _ = require('lodash');

exports.createScoreboard = function() {
    var board = {
        player1_target: 20,
        player2_target: 20
    };
    return board;
};

/**
 * Update the scoreboard with the results of the round. This function will
 * receive the round from the body of the request as well as the
 * stored game.
 */
exports.updateGameWithRound = function( round, game ) {
    var board = game.scoreboard;
    var thrower = (game.current_thrower.id === game.player1.id) ? 'player1' : 'player2';
    var opponent = (game.current_thrower.id === game.player1.id) ? 'player2' : 'player1';

    /*
     For each throw the possibilities are:
        1. You did not hit your target. Do nothing
        2. You hit your target.
            1. You hit a single - go to the next number
            2. You hit a double - skip a number
                1. Can't skip the bull
            3. You hit a triple - skip two numbers
                1. Can't skip the bull
    */for (var index = 1; index <= _.size(round); index++) {
        var dart = round[index];
        var scored = false;
        if (dart.number === board[thrower + '_target']) {
            // Hit our target
            scored = true;

            // Determine if this was a winning throw
            if (dart.number === 25) {
                game.winner = game.current_thrower;
            }

            // Figure out what we hit now and what we aim for next.
            if (dart.multiplier === 1) {
                if (board[thrower + '_target'] === 1) {
                    board[thrower + '_target'] = 25;
                }
                else {
                    board[thrower + '_target'] -= 1;
                }
            }
            else if (dart.multiplier === 2) {
                if (board[thrower + '_target'] <= 2) {
                    board[thrower + '_target'] = 25;
                }
                else {
                    board[thrower + '_target'] -= 2;
                }
            }
            else {
                // Hit a triple
                if (board[thrower + '_target'] <= 3) {
                    board[thrower + '_target'] = 25;
                }
                else {
                    board[thrower + '_target'] -= 3;
                }
            }
            round[index] = {
                order: index,
                target: dart.number,
                multiplier: dart.multiplier,
                score: scored,
                close: scored
            };
        }
        else {
            // Missed the target
            // Log analytics data
            round[index] = {
                order: index,
                target: dart.number,
                multiplier: dart.multiplier,
                score: false,
                close: false
            };
        }

    }

    return game;
};