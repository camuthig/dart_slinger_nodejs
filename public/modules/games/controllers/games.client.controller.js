'use strict';

// Games controller
angular.module('games').controller('GamesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Games', 'Friends',
	function($scope, $stateParams, $location, Authentication, Games, Friends) {
		$scope.authentication = Authentication;
		$scope.friends = Friends.friends;
		$scope.round = {
			1: {
				number: null,
				multiplier: null
			},
			2: {
				number: null,
				multiplier: null
			},
			3: {
				number: null,
				multiplier: null
			},
		};
		$scope.supported_types = {
			cricket: 'Cricket',
		};

		// Create new Game
		$scope.create = function() {
			// Create new Game object

			var game = new Games ({
				name: this.name,
				game_type: this.game_type,
				player1: this.player1,
				player2: this.player2
			});

			// Redirect after save
			game.$save(function(response) {
				$location.path('games/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Game
		$scope.remove = function( game ) {
			if ( game ) { game.$remove();

				for (var i in $scope.games ) {
					if ($scope.games [i] === game ) {
						$scope.games.splice(i, 1);
					}
				}
			} else {
				$scope.game.$remove(function() {
					$location.path('games');
				});
			}
		};

		// Update existing Game
		$scope.update = function() {
			var game = $scope.game ;

			game.$update(function() {
				$location.path('games/' + game._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Add a round of throws to a game
		$scope.addRound = function() {
			var game = $scope.game ;

			for(var index = 1; index < 4; index++) {
				$scope.round[index].number =
					($scope.round[index].number === 'bull') ? 'bull' : parseInt($scope.round[index].number);
				$scope.round[index].multiplier = parseInt($scope.round[index].multiplier);
			}
			game.round = $scope.round;

			game.$update(function() {
				$location.path('games/' + game._id + '/play');
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});

			$scope.round = {
				1: {
					number: 16,
					multiplier: 2
				},
				2: {
					number: 16,
					multiplier: 2
				},
				3: {
					number: 16,
					multiplier: 2
				},
			};
		};

		// Find a list of Games
		$scope.find = function() {
			$scope.games = Games.query();
		};

		// Find existing Game
		$scope.findOne = function() {
			$scope.game = Games.get({
				gameId: $stateParams.gameId
			});
		};

		$scope.getScoreboard = function() {
			var type = angular.lowercase($scope.game.game_type);
			return 'modules/games/views/games/' + type + '-scoreboard.client.view.html';

		};

		$scope.isOver = function() {
			if(typeof $scope.game.winner === 'undefined') {
				return false;
			}
			else {
				return true;
			}
		};
	}
]);