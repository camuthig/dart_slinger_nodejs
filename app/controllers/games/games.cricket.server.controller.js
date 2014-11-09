'use strict';
/**
 * Create the scoreboard. Cricket requires tracker scores as well as
 * closes for each target 20 to 15 and Bull. A total score should
 * also be provided for each player.
 */
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

    console.log(board);
    return board;
};

/**
 * Update the scoreboard with the results of the round. The entire
 * body game object will be provided to this function.
 */
exports.updateBoardWithRound = function( round, game ) {

};