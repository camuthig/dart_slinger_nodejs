'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Game Schema
 */
var ThrowSchema = new Schema({
	created: {
		type: Date,
		default: Date.now
	},
	round: {
		type: Schema.ObjectId,
		ref: 'Round',
		required: true
	},
	order: {
		type: Number,
		required: true
	},
	target: {
		type: Number,
		required: true
	},
	multiplier: {
		type: Number,
		required: true
	},
	score: {
		type: Boolean,
		required: true
	},
	score_amount: {
		type: Number
	},
	close: {
		type: Boolean,
		required: true
	},
	close_amount: {
		type: Number
	}

});

mongoose.model('Throw', ThrowSchema);