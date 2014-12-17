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
	players: [
		{
			type: Schema.ObjectId,
			ref: 'User'
		}
	],
	scores: [
		{
			type: Number,
			default: 0
		}
	],
	game_type: {
		type: String,
		default: 'cricket',
		trim: true
	},
	current_thrower: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	scoreboard: {
		type: Schema.Types.Mixed
	},
	winner: {
		type: Schema.ObjectId,
		ref: 'User'
	}

});

mongoose.model('Game', GameSchema);