'use strict';
/**
 * Create the scoreboard. Cricket requires tracker scores as well as
 * closes for each target 20 to 15 and Bull. A total score should
 * also be provided for each player.
 */
var _ = require('lodash');

exports.getPlayerRules = function() {
    var player_rules = {
        max_players: 2
    };

    return player_rules;
}

exports.createScoreboard = function() {
    var board = {};
    //var board = new Array ( );
    for(var index = 20; index > 14; index--) {
        board[index] = {
            player1_score: 0,
            player1_closes: 0,
            player2_score: 0,
            player2_closes: 0,
        };
    }
    board.bull = {
        player1_score: 0,
        player1_closes: 0,
        player2_score: 0,
        player2_closes: 0,
    };
    board.total = {
        player1_score: 0,
        player2_score: 0
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
    var
    var thrower = (game.current_thrower.id === game.player1.id) ? 'player1' : 'player2';
    var opponent = (game.current_thrower.id === game.player1.id) ? 'player2' : 'player1';

    for (var index = 1; index <= _.size(round); index++) {
        var dart = round[index];
        var over = 0;
        var closes = 0;
        var score = 0;
        if (_.has(board, dart.number)) {
            // We know that they hit a number that matters

            /* Possible Cricket Scenarios:
                1. You haven't closed the number
                    1. We don't close or get to exactly 3 (do nothing)
                    2. We close and have a total of more than 3
                        1. And your opponent hasn't closed.
                        2. And your opponent has closed. (do nothing)
                2. You have closed the number
                    1. And your opponent hasn't
                    2. And your opponent has
            */
            if (board[dart.number][thrower + '_closes'] < 3) {
                closes = parseInt(board[dart.number][thrower + '_closes']) + dart.multiplier;
                over = closes - 3;
                if (over > 0){
                    closes = closes - over;
                    // Set closes to 3 and determine what we went over.
                    board[dart.number][thrower + '_closes'] = 3;

                    // If our opponent hasn't closed, start scoring.
                    if (board[dart.number][opponent + '_closes'] < 3) {
                        score = ((dart.number === 'bull') ? 25 : dart.number) * over;
                        board[dart.number][thrower + '_score'] += score;
                        board.total[thrower + '_score'] += score;
                    }
                }
                else {
                    board[dart.number][thrower + '_closes'] = closes;
                }
            }
            else {
                if (board[dart.number][opponent + '_closes'] < 3) {
                    // Our opponent hasn't closed, so you're scoring.
                    score = ((dart.number === 'bull') ? 25 : dart.number) * dart.multiplier;
                    board[dart.number][thrower + '_score'] += score;
                    board.total[thrower + '_score'] += score;
                }
            }

            // Log the determined score information about the round
            round[index] = {
                order: index,
                target: ((dart.number === 'bull') ? 25 : dart.number),
                multiplier: dart.multiplier,
                score: (score > 0),
                score_amount: score,
                close: (closes > 0),
                close_amount: closes
            };
        }
        else {
            // Just log simple information for the throw
            round[index] = {
                order: index,
                target: ((dart.number === 'bull') ? 25 : dart.number),
                multiplier: dart.multiplier,
                score: false,
                score_amount: 0,
                close: false,
                close_amount: 0
            };
        }

    }
    game[thrower + '_score'] = board.total[thrower + '_score'];

    /*
        Check to see if we have won the game based on:
            1. Have we closed everything
            2. And do we have more points than our opponenet
    */
    var allClosed = true;
    _.forIn(board, function(value, key) {
        if (key !== 'total' && board[key][thrower + '_closes'] !== 3) {
            allClosed = false;
            return false;
        }
    });
    if (allClosed && board.total[thrower + '_score'] >= board.total[opponent + '_score']) {
        game.winner = game.current_thrower;
    }

    game.scoreboard = board;
    game.markModified('scoreboard');
    return game;
};