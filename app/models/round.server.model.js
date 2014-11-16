'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Game Schema
 */
var RoundSchema = new Schema({
	created: {
		type: Date,
		default: Date.now
	},
	game: {
		type: Schema.ObjectId,
		ref: 'Game',
		required: true
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User',
		required: true
	}

});

mongoose.model('Round', RoundSchema);