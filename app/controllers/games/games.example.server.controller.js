'use strict';

var _ = require('lodash');

/**
 * All game controllers must implement the createScoreboard method.
 * This method is used in the game create method to generate the game specific
 * structure of the scoreboard. The scoreboard should be a multi-dimensional array
 * that the view will use. There are no restrictions on what the scoreboard
 * looks like since it will be parsed on the client-side using a custom view.
 *
 * The only requirement is that this method must return an object/array.
 */
exports.createScoreboard = function() {
    var board = {};

    return board;
};

/**
 * All game controllers must implement the updateGameWithRound method.
 * This method is used by the update method of the game controller to calculate
 * the results of a round, determine if the game is over (and name the winner),
 * and prepare for the next round.
 *
 * - An updated game object must be returned with the new score.
 * - The round object should be updated in place to match the Round Mongoose
 * schema.
 */
exports.updateGameWithRound = function( round, game ) {

    return game;
};