'use strict';

// Users controller
angular.module('users').controller('UsersController', ['$scope', '$stateParams', '$location', 'Authentication', 'Users',
    function($scope, $stateParams, $location, Authentication, Users ) {
        $scope.authentication = Authentication;

        // Find a list of Users
        $scope.find = function() {
            $scope.users = Users.query();
        };

    }
]);