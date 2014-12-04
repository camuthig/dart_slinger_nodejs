'use strict';

// Authentication service for user variables
angular.module('users').service('Friends', [ 'Users', function(Users) {

	// Find a list of Users
    this.getFriends = function() {
        return Users.query();
    };
}

]);