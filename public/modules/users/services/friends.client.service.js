'use strict';

// Authentication service for user variables
angular.module('users').factory('Friends', [ 'Users',

	// Find a list of Users
    function(Users) {
        var _this = this;
         return {
            friends: Users.query()
        };
    }
]);