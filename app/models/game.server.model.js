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
	name: {
		type: String,
		default: '',
		required: 'Please fill Game name',
		trim: true
	},
	created: {
		type: Date,
		default: Date.now
	},
	player1: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	player2: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	game_type: {
		type: String,
		default: 'Cricket',
		trim: true
	}

});

mongoose.model('Game', GameSchema);