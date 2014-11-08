'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Game Schema
 */
var GameSchema = new Schema({
	created: {
		type: Date,
		default: Date.now
	},
	player1: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	player1_score: {
		type: Number,
		default: 0
	},
	player2: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	player2_score: {
		type: Number,
		default: 0
	},
	game_type: {
		type: String,
		default: 'Cricket',
		trim: true
	},
	current_thrower: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	scoreboard: {
		type: Array
	}

});

mongoose.model('Game', GameSchema);