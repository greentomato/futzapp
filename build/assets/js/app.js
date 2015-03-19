(function() {
	'use strict';

	var futzApp = angular.module('futzApp', [
		//'ui.router',
		'ngRoute',
		'ngAnimate',
		'ngSanitize',
		
		'fulboControllers',
		'fulboFilters',
		'fulboServices',
		'fulboDirectives',
		'flow',
		
		//foundation
		'foundation',
		//'foundation.dynamicRouting',
		//'foundation.dynamicRouting.animations'
	]);
	
	futzApp.value('redirectToUrlAfterLogin', { url: '/home' });
	
	futzApp.config(['$routeProvider', '$locationProvider', '$compileProvider', 'flowFactoryProvider', 
		function($routeProvider, $locationProvider, $compileProvider, flowFactoryProvider) {
			$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|whatsapp):/);
		
			$routeProvider.
			  when('/', {
				templateUrl: 'templates/landing.html',
				controller: 'HomeController'
			  }).
			  when('/home', {
				templateUrl: 'templates/home.html',
				controller: 'MatchesController'
			  }).
			  when('/step-1', {
				templateUrl: 'templates/step-1.html'
			  }).
			  when('/step-2', {
				templateUrl: 'templates/step-2.html'
			  }).
			  when('/step-3', {
				templateUrl: 'templates/step-3.html'
			  }).
			  when('/match/:matchId', {
				templateUrl: 'templates/match.html',
				controller: 'MatchController'
			  }).
			  when('/help', {
				templateUrl: 'templates/help.html'
			  }).
			  /*when('/group/:groupId', {
				controller: 'GroupController'
			  }).
			  when('/groups', {
				templateUrl: 'templates/groups.html',
				controller: 'GroupsController'
			  }).*/
			  when('/settings', {
				templateUrl: 'templates/settings.html',
				controller: 'ProfileController'
			  }).
			  otherwise('/');
		
			$locationProvider.html5Mode({
			  enabled:false,
			  requireBase: false
			});

			//$locationProvider.hashPrefix('!');
		
			flowFactoryProvider.defaults = {
				target: 'upload.php',
				permanentErrors: [404, 500, 501],
				maxChunkRetries: 1,
				chunkRetryInterval: 5000,
				simultaneousUploads: 4,
				singleFile: true
			};
			flowFactoryProvider.on('catchAll', function (event) {
				console.log('catchAll', arguments);
			});
		}
	]);
	
	futzApp.run(['$rootScope', '$filter', '$sanitize', '$window', '$location', 'Fields', 'Matches', 'MatchTypes', 'UsersAuth', 'Towns', 'States', 
     	function($rootScope, $filter, $sanitize, $window, $location, Fields, Matches, MatchTypes, UsersAuth, Towns, States) {
			FastClick.attach(document.body);
			
			/* ROUTING LOGIC */
			$rootScope.routeChanges = 0;
		
			/* FACEBOOK LOGIN VARIABLES */
			$rootScope.fbUser = null;
			$rootScope.user = null;
			$rootScope.fbAppId = "1517377388534738"; //DEV
			//$rootScope.fbAppId = "1450926871846457"; //PRD
			
			/* GLOBAL VARIABLES */
			$rootScope.fields = Fields.query();
			$rootScope.matchTypes = MatchTypes.query();
			$rootScope.towns = Towns.query();
			$rootScope.states = States.query();
			
			/* NEW/EDIT MATCH VARIABLES */
			$rootScope.newMatch = {
				date: '',
				partialDate: '',
				partialTime: '',
				fieldId: 0,
				comments: "",
				cancelled: 0,
				matchTypeId: "",
				admin_userId: 0,
				id: 0
			};
			$rootScope.matchShareURL = "";
			
			/* NEW/EDIT MATCH METHODS */
			$rootScope.$watch('newMatch.partialDate', function() {
			   tryCombineDateTime(); 
			});

			$rootScope.$watch('newMatch.partialTime', function() {
			   tryCombineDateTime();
			});
			
			function tryCombineDateTime() {
				if($rootScope.newMatch.partialDate && $rootScope.newMatch.partialTime) {
					var dateParts = $rootScope.newMatch.partialDate;
					var yyyy = dateParts.getFullYear().toString();
					var mm = (dateParts.getMonth()+1).toString(); // getMonth() is zero-based
					var dd  = dateParts.getDate().toString();
					var fullDate = yyyy + "-" + (mm[1]?mm:"0"+mm[0])+ "-" + (dd[1]?dd:"0"+dd[0]); // padding
										
					var timeParts = $rootScope.newMatch.partialTime;
					var HH = timeParts.getHours().toString();
					var MM = timeParts.getMinutes().toString();
					var ss = timeParts.getSeconds().toString();
					fullDate += " " + (HH[1]?HH:"0"+HH[0]) + ":" + (MM[1]?MM:"0"+MM[0]) + ":" + (ss[1]?ss:"0"+ss[0]);
					
					$rootScope.newMatch.date = fullDate;
				}
			}
			
			$rootScope.createMatch = function(){
				$rootScope.newMatch.admin_userId = $rootScope.user.id;
				
				if($rootScope.newMatch.id != 0) {
					Matches.update($rootScope.newMatch, function(updatedMatch){
						$rootScope.newMatch = updatedMatch;
						$rootScope.matchShareURL = $sanitize("http://" + $location.host() + "?token=" + $rootScope.newMatch.token);
						console.log("Match updated, id:" + updatedMatch.id);
						$location.path( "/step-3" );
					}, function(){
						console.log("Failed updating match!");
						showAlert("Error", "Hubo un error al actualizar el partido! Intente nuevamente.");
					});
				} else {
					Matches.save($rootScope.newMatch, function(newMatch){
						$rootScope.newMatch = newMatch;
						$rootScope.matchShareURL = $sanitize("http://" + $location.host() + "?token=" + $rootScope.newMatch.token);
						
						console.log("Match saved, id:" + newMatch.id);
						$location.path( "/step-3" );
					}, function(){
						console.log("Failed saving match!");
						showAlert("Error", "Hubo un error al crear el partido! Intente nuevamente.");
					});
				}
			};
			
			$rootScope.shareFB = function(match){
				var url = $rootScope.matchShareURL;
				var field = {};
				for (var i=0, len=$rootScope.fields.length; i<len; i++) {
					if (+$rootScope.fields[i].id == +match.fieldId) {
						field = $rootScope.fields[i];
						break;
					}
				}
				FB.ui( {
					method: 'feed',
					name: "Futzapp",
					link: url,
					picture: "http://futzapp.com/images/field.jpg",
					description: "Jugate un futzapp el " + $filter('dateFormat')($scope.match.date, 'dddd ') +  " a las " + $filter('dateFormat')($scope.match.date, 'hh:mm a') + " en " + field.name + "!",
					caption: "Ya reservaste cancha y te faltan jugadores? Armar un partido de f&ucaute;tbol entre amigos nunca fue tan f&aacute;cil!"
				}, function( response ) {
					// do nothing
				} );
			};
			
			/* GLOBAL METHODS */
			$rootScope.goToStep1 = function(match) {
				if(match == null){
					$rootScope.newMatch = {
						date: '',
						partialDate: '',
						partialTime: '',
						fieldId: 0,
						comments: "",
						cancelled: 0,
						matchTypeId: "",
						admin_userId: 0,
						townId: 0,
						stateId: 0,
						id: 0
					};
				} else {
					$rootScope.newMatch = {
						date: match.date,
						partialDate: new Date(match.date),
						partialTime: new Date(match.date),
						fieldId: match.fieldId,
						comments: match.comments,
						cancelled: match.cancelled,
						matchTypeId: match.matchTypeId,
						admin_userId: match.admin_userId,
						townId: match.field.townId,
						stateId: match.field.stateId,
						id: match.id
					};
				}
				$location.path( "/step-1" );
			}

			$rootScope.logout = function() {
				UsersAuth.logout();
			};
			
			/* USER AUTH METHODS */
			$rootScope.$on('$routeChangeStart', function (event, next) {
				if($rootScope.routeChanges == 0){
					UsersAuth.saveAttemptUrl();
					var token = getURLParameter('token');
					$rootScope.matchToken = token;
				}
				
				if (!UsersAuth.isLogged) {
					//event.preventDefault();
					$location.path( "/" );
					$rootScope.routeChanges++;
				}
			});
			
			/* FB METHODS SDK */
			$window.fbAsyncInit = function() {
				// Executed when the SDK is loaded

				FB.init({ 
					appId: $rootScope.fbAppId, 
					channelUrl: 'channel.html', 
					status: true, 
					cookie: true, 
					xfbml: true 
				});
				UsersAuth.watchAuthenticationStatusChange();
				
				$("#loaderDiv").hide();
			};

			// Are you familiar to IIFE ( http://bit.ly/iifewdb ) ?

			(function(d){
				// load the Facebook javascript SDK

				var js, 
				id = 'facebook-jssdk', 
				ref = d.getElementsByTagName('script')[0];

				if (d.getElementById(id)) {
					return;
				}

				js = d.createElement('script'); 
				js.id = id; 
				js.async = true;
				js.src = "//connect.facebook.net/en_US/all.js";

				ref.parentNode.insertBefore(js, ref);

			}(document));
		}
	]);
 
	function currentUrlPath(){
		$scope.currentPath = $location.path();
	}

})();



'use strict';

/* Controllers */

var fulboControllers = angular.module('fulboControllers', []);

fulboControllers.controller('HomeController', ['$rootScope', '$scope', '$location', 'Fields', 'Matches', 'UsersAuth',
  function($rootScope, $scope, $location, Fields, Matches, UsersAuth) {
    $scope.matchToSave = false;
    
    $scope.login = function() {
    	UsersAuth.login();
    };
  }]);

fulboControllers.controller('MatchesController', ['$rootScope', '$scope', '$location', 'Users', 'Matches', 'Teams', 'Notifications', 
	function($rootScope, $scope, $location, Users, Matches, Teams, Notifications) {
		$scope.selectedUser = {};
		$scope.changeSelectedUser = function(user){
	    	$scope.selectedUser = user;
	    };
		
		//TODO: mostrar solo las que DATE>NOW!! (BACK)
		$scope.renderMatches = function(){
			var userMatches = Users.getMatches({id: $rootScope.user.id}, function(){
				for (var i=0, len=userMatches.Admin.length;i<len;i++){
					$scope.matches.push(userMatches.Admin[i]);
				}
				for (var i=0, len=userMatches.Guest.length;i<len;i++){
					$scope.matches.push(userMatches.Guest[i]);
				}
			});
		};
		$scope.matches = [];
		$scope.renderMatches();
		/*$scope.openMatch = function(matchId){
			$location.path( "match/" + matchId );
		};*/
		
		$scope.answerYes = function(match){
	    	var teamAUpdated = false;
	    	var teamBUpdated = false;
	    	var subsUpdated = false;
	    	
	    	//mark as confirmed
	    	var data = {
		    	users: [],
		    	matchId: match.id
		    };
	    	for(var i = 0; i < match.guests.length; i++){
	    		var confirmed = match.guests[i].pivot.confirmed;
	    		if(match.guests[i].id == $rootScope.user.id)
	    			confirmed = 1;
	    		var userItem = {
	    			id: match.guests[i].fbId != null? match.guests[i].fbId.toString() : match.guests[i].id.toString(),
	    			confirmed: confirmed
	    		};
	    		data.users.push(userItem);
	    	}
	    	Matches.updateGuests(data, function(response){
	    		//add player to team or subs
		    	var dataSubs = {
		    	    userIds: [],
		    	    matchId: match.id
		    	};
		    	var dataTeamA = {
		    	    userIds: [],
		    	    teamId: match.teams[0].id
		    	};
		    	var dataTeamB = null;
		    	if(match.teams.length > 1)
			    	dataTeamB = {
			    	   	userIds: [],
			    	   	teamId: match.teams[1].id
			    	};
		    	
		    	var teamAMissingPlayers = match.type.totalPlayers / 2 - match.teams[0].users.length;
		    	var teamBMissingPlayers = dataTeamB != null ? (match.type.totalPlayers / 2 - match.teams[1].users.length) : 0;
		    	if(teamBMissingPlayers > 0 && teamBMissingPlayers > teamAMissingPlayers && dataTeamB != null){ //add to teamB
		    		dataTeamB.userIds.push($rootScope.user.fbId);
		    		teamBUpdated = true;
		    	} else if(teamAMissingPlayers > 0){ //add to teamA
		    		dataTeamA.userIds.push($rootScope.user.fbId);
		    		teamAUpdated = true;
		    	} else { //add to subs
		    		dataSubs.userIds.push($rootScope.user.fbId);
		    		subsUpdated = true;
		    	}
		    	
		    	if(teamAUpdated)
			   		$scope.updateTeam(dataTeamA, match.teams[0]);
			   	if(teamBUpdated)
			   		$scope.updateTeam(dataTeamB, match.teams[1]);
			   	if(subsUpdated)
			   		$scope.updateSubs(dataSubs, match.substitutes);
			   	
				/* si se llenaron los 2 equipos envio mail a todos */
				if(parseInt($scope.teamA.missingPlayers) + parseInt($scope.teamB.missingPlayers) == 1)
					Notifications.completo($scope.match, $scope.guests);
				/* envio mail al admin */
				Notifications.juego(match);
			   	   	
			   	$scope.matches = Users.getMatches({id: $rootScope.user.id});
	    	});
	    };
	    
	    $scope.answerNo = function(match){
	    	var wasConfirmed = false;
			
			//mark as rejected
	    	var data = {
			   	users: [],
			   	matchId: match.id
			};
		    for(var i = 0; i < match.guests.length; i++){
		    	var confirmed = match.guests[i].pivot.confirmed;
		    	if(match.guests[i].id == $rootScope.user.id){
		    		if(confirmed == 1) wasConfirmed = true;
					confirmed = 0;
				}
		    	var userItem = {
		    		id: match.guests[i].fbId != null? match.guests[i].fbId.toString() : match.guests[i].id.toString(),
		    		confirmed: confirmed
		    	};
		    	data.users.push(userItem);
		    }
		    Matches.updateGuests(data, function(response){
		    	//remove player from team or subs
		    	var dataSubs = {
		    		userIds: [],
			    	matchId: match.id
			    };
			    var dataTeamA = {
			        userIds: [],
			        teamId: match.teams[0].id
			    };
			    var dataTeamB = null;
		    	if(match.teams.length > 1)
			    	dataTeamB = {
			    	   	userIds: [],
			    	   	teamId: match.teams[1].id
			    	};
		    	
			   	$scope.updateTeam(dataTeamA, match.teams[0], $rootScope.user.id);
			   	if(dataTeamB != null)
			   		$scope.updateTeam(dataTeamB, match.teams[1], $rootScope.user.id);
			   	$scope.updateSubs(dataSubs, match.substitutes, $rootScope.user.id);
			   	
				/* si estaba anotado, y se bajó => envio mail al admin */
				if(wasConfirmed)
					Notifications.meBajo(match);
			   	
			   	$scope.matches = Users.getMatches({id: $rootScope.user.id});
		    });
	    };
		
	    
	    $scope.updateSubs = function(data, subs, toRemoveUserId){
	    	var update = toRemoveUserId == undefined ? true : false;
	    	//add existing subs
	    	for(var i = 0; i < subs.length; i++){
	    		if(toRemoveUserId != undefined && subs[i].id == toRemoveUserId){
	    			update = true;
	    			continue;
	    		}
	    		data.userIds.push(subs[i].fbId.toString());
	    	}
	    	if(update)
		   		Matches.updateSubs(data, function(response){
		   			
		    	});
	    };
	    $scope.updateTeam = function(data, team, toRemoveUserId){
	    	var update = toRemoveUserId == undefined ? true : false;
	    	//add existing players
	    	for(var i = 0; i < team.users.length; i++){
	    		if(toRemoveUserId != undefined && team.users[i].id == toRemoveUserId){
	    			update = true;
	    			continue;
	    		}
	    		var id = team.users[i].fbId != undefined ? team.users[i].fbId.toString() : team.users[i].id.toString();
	    		data.userIds.push(id);
	    	}
	    	if(update)
		   		Teams.updateUsers(data, function(response){
		   			
		    	});
	    };
}]);

fulboControllers.controller('MatchController', ['$rootScope', '$scope', '$routeParams', '$filter', '$sanitize', '$location', 'Matches', 'Teams', 'Users', 'Notifications',
    function($rootScope, $scope, $routeParams,  $filter, $sanitize, $location, Matches, Teams, Users, Notifications) {
		
		$scope.totalPlayers = 0;
		$scope.friendsSelected = [];
		$scope.modoVersus = false;
		$scope.adminMode = false;
		
		$scope.selectedUser = {};
		$scope.changeSelectedUser = function(user){
	    	$scope.selectedUser = user;
	    };
		
		$scope.getNumber = function(num) {
		    return new Array(num);   
		};
		
		$scope.teamA = {
				team: null,
				positions: [],
				missingPlayers: 0
		};
		$scope.teamB = {
				team: null,
				positions: [],
				missingPlayers: 0
		};
		
		$scope.setTeamAColor = function(color){
			$scope.teamA.team.shirtColor = color;
			Teams.update($scope.teamA.team, function(response){
				$scope.teamA.team = response;
    		});
		};
		$scope.setTeamBColor = function(color){
			$scope.teamB.team.shirtColor = color;
			Teams.update($scope.teamB.team, function(response){
				$scope.teamB.team = response;
    		});
		};
		
		$scope.matchShareURL = "";
		$scope.renderMatch = function(){
			return Matches.get({id: $routeParams.matchId}, function(){
				$scope.matchShareURL = $sanitize("http://" + $location.host() + "?token=" + $scope.match.token);
				
				if($rootScope.user.id == $scope.match.admin.id) $scope.adminMode = true;
				var teams = Matches.getTeams({id: $routeParams.matchId}, function(){
					if(teams.length == 1)
						$scope.modoVersus = true;
					if(!$scope.modoVersus) $scope.totalPlayers = $scope.match.type.totalPlayers / 2;
					else $scope.totalPlayers = $scope.match.type.totalPlayers;
					var positions = $scope.match.type.formation.split(";");
					
					if(teams.length == 0) {
						$scope.teamA.missingPlayers = $scope.totalPlayers;
						$scope.teamB.missingPlayers = $scope.totalPlayers;
					}
					if(teams.length > 0) {
						$scope.teamA.team = teams[0];
						$scope.teamA.missingPlayers = $scope.totalPlayers - teams[0].users.length;
						
						//map positions
						for(var i = 0; i < $scope.totalPlayers; i++){
							var xy = positions[i].split(",");
							var position = {
									x: xy[0] + "%",
									y: xy[1] + "%"
							};
							$scope.teamA.positions.push(position);
						}
					}
					if(teams.length > 1) {
						$scope.teamB.team = teams[1];
						$scope.teamB.missingPlayers = $scope.totalPlayers - teams[1].users.length;
						
						//map positions
						for(var i = $scope.totalPlayers; i <  $scope.totalPlayers * 2; i++){
							var xy = positions[i].split(",");
							var position = {
									x: xy[0] + "%",
									y: xy[1] + "%"
							};
							$scope.teamB.positions.push(position);
						}
					}
				});
			});	
		};
		
		$scope.renderGuests = function(){
			return Matches.getGuests({id: $routeParams.matchId}, function(){
				for(var i = 0; i < $scope.guests.length; i++){
					if($scope.guests[i].id == $rootScope.user.id){
						$scope.userConfirmed = $scope.guests[i].pivot.confirmed;
						break;
					}
				}
			});
		};
		
		$scope.renderGoogleMap = function(){
			//field map
			var fieldPos = new google.maps.LatLng($scope.match.field.latitude, $scope.match.field.longitude);
			var mapOptions = {
				center: fieldPos,
				zoom: 14,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
			var map = new google.maps.Map(document.getElementById("map_canvas"),
							mapOptions); 
			var marker = new google.maps.Marker({
							position: fieldPos,
							map: map,
							title: '$scope.match.field.name'
			});
		};
		
		$scope.match = $scope.renderMatch();
		$scope.subs = Matches.getSubs({id: $routeParams.matchId});
		
		$scope.userConfirmed = null;
		$scope.guests = $scope.renderGuests();
		
		$scope.cancelMatch = function(){
	    	$scope.match.cancelled = 1;
	    	Matches.update($scope.match, function(){
	    		/* envio mail a todos los invitados */
				Notifications.cancelado($scope.match, $scope.guests);
	    	});
	    };
	    
	    $scope.answerYes = function(){
	    	var teamAUpdated = false;
	    	var teamBUpdated = false;
	    	var subsUpdated = false;
	    	
			//mark as confirmed
	    	var data = {
		    	users: [],
		    	matchId: $scope.match.id
		    };
	    	for(var i = 0; i < $scope.guests.length; i++){
	    		var confirmed = $scope.guests[i].pivot.confirmed;
	    		if($scope.guests[i].id == $rootScope.user.id)
	    			confirmed = 1;
	    		var userItem = {
	    			id: $scope.guests[i].fbId != null? $scope.guests[i].fbId.toString() : $scope.guests[i].id.toString(),
	    			confirmed: confirmed
	    		};
	    		data.users.push(userItem);
	    	}
	    	Matches.updateGuests(data, function(response){
	    		//add player to team or subs
		    	var dataSubs = {
		    	    userIds: [],
		    	    matchId: $scope.match.id
		    	};
		    	var dataTeamA = {
		    	    userIds: [],
		    	    teamId: $scope.teamA.team.id
		    	};
		    	var dataTeamB = null;
		    	if($scope.teamB.team != null)
			    	dataTeamB = {
			    	   	userIds: [],
			    	   	teamId: $scope.teamB.team.id
			    	};
		    	
		    	if(dataTeamB != null && $scope.teamB.missingPlayers > 0 && $scope.teamB.missingPlayers > $scope.teamA.missingPlayers){ //add to teamB
		    		dataTeamB.userIds.push($rootScope.user.fbId);
		    		teamBUpdated = true;
		    	} else if($scope.teamA.missingPlayers > 0){ //add to teamA
		    		dataTeamA.userIds.push($rootScope.user.fbId);
		    		teamAUpdated = true;
		    	} else { //add to subs
		    		dataSubs.userIds.push($rootScope.user.fbId);
		    		subsUpdated = true;
		    	}
		    	
		    	if(teamAUpdated)
			   		$scope.updateTeamA(dataTeamA);
			   	if(teamBUpdated)
			   		$scope.updateTeamB(dataTeamB);
			   	if(subsUpdated)
			   		$scope.updateSubs(dataSubs);
		    	
		    	$scope.userConfirmed = 1;
				
				/* si se llenaron los 2 equipos envio mail a todos */
				if(parseInt($scope.teamA.missingPlayers) + parseInt($scope.teamB.missingPlayers) == 1)
					Notifications.completo($scope.match, $scope.guests);
				/* envio mail al admin */
				Notifications.juego($scope.match);
		    	
		    	$scope.match = $scope.renderMatch();
				$scope.guests = $scope.renderGuests();
	    	});
	    };
	    
	    $scope.answerNo = function(){
			var wasConfirmed = false;
			
	    	//mark as rejected
	    	var data = {
			   	users: [],
			   	matchId: $scope.match.id
			};
		    for(var i = 0; i < $scope.guests.length; i++){
		    	var confirmed = $scope.guests[i].pivot.confirmed;
				if($scope.guests[i].id == $rootScope.user.id){
		    		if(confirmed == 1) wasConfirmed = true;
					confirmed = 0;
				}
		    	var userItem = {
		    		id: $scope.guests[i].fbId != null? $scope.guests[i].fbId.toString() : $scope.guests[i].id.toString(),
		    		confirmed: confirmed
		    	};
		    	data.users.push(userItem);
		    }
		    Matches.updateGuests(data, function(response){
		    	//remove player from team or subs
		    	var dataSubs = {
		    		userIds: [],
			    	matchId: $scope.match.id
			    };
			    var dataTeamA = {
			        userIds: [],
			        teamId: $scope.teamA.team.id
			    };
			    var dataTeamB = null;
		    	if($scope.teamB.team != null)
			    	dataTeamB = {
			    	   	userIds: [],
			    	   	teamId: $scope.teamB.team.id
			    	};
			   	$scope.updateTeamA(dataTeamA, $rootScope.user.id);
			   	if(dataTeamB != null)
			   		$scope.updateTeamB(dataTeamB,  $rootScope.user.id);
			   	$scope.updateSubs(dataSubs,  $rootScope.user.id);
			   	
			   	$scope.userConfirmed = 0;
				
				/* si estaba anotado, y se bajó => envio mail al admin */
				if(wasConfirmed)
					Notifications.meBajo($scope.match);
			   	
			   	$scope.match = $scope.renderMatch();
				$scope.guests = $scope.renderGuests();
		    });
	    };
	    
	    $scope.selectedTeam = "A";
	    $scope.changeSelectedTeam = function(team){
	    	$scope.selectedTeam = team;
	    };
	    $scope.addPlayer = function(playerName){
	    	if(playerName == "" || playerName == undefined){
	    		showAlert("Error", "Tenés que poner el nombre de tu amigo!");
	    	} else {
	    		//crear usuario con solo nombre
	    		var user = {
	    			"name": playerName	
	    		};
	    		Users.save(user, function(response){
	    			//agregar usuario como invitado
	    			var data = {
	    		   		users: [],
	    			    matchId: $scope.match.id
	    			};
	    		    //add existing guests
	    		    for(var i = 0; i < $scope.guests.length; i++){
	    		    	var userItem = {
	    			   		id: $scope.guests[i].fbId != null? $scope.guests[i].fbId.toString() : $scope.guests[i].id.toString(),
	    			   		confirmed: $scope.guests[i].pivot.confirmed
	    			   	};
	    		    	data.users.push(userItem);
	    		    }
	    		    var userItem = {
	    			   	id: response.id,
	    			   	confirmed: 1
	    			};
	    			data.users.push(userItem);
	    			Matches.updateGuests(data, function(teamGuests){
	    				//agregar usuario al equipo elegido
						if($scope.selectedTeam == "A"){
		    				var dataTeamA = {
		    					userIds: [],
		    	    		    teamId: $scope.teamA.team.id
		    	    		};
		    				dataTeamA.userIds.push(response.id);
		    	    		$scope.updateTeamA(dataTeamA);
		    			}
		    			if($scope.selectedTeam == "B"){
		    				var dataTeamB = {
			    				userIds: [],
			    	    		teamId: $scope.teamB.team.id
			    	    	};
		    				dataTeamB.userIds.push(response.id);
			    	    	$scope.updateTeamB(dataTeamB);
		    			}
						
						/* si se llenaron los 2 equipos envio mail a todos */
						if(parseInt($scope.teamA.missingPlayers) + parseInt($scope.teamB.missingPlayers) == 1)
							Notifications.completo($scope.match, $scope.guests);
						
						$scope.match = $scope.renderMatch();
						$scope.guests = $scope.renderGuests();
	    	    	});
	    		});
	    	}
	    };
	    
	    $scope.updateSubs = function(data, toRemoveUserId){
	    	var update = toRemoveUserId == undefined ? true : false;
	    	//add existing subs
	    	for(var i = 0; i < $scope.subs.length; i++){
	    		if(toRemoveUserId != undefined && $scope.subs[i].id == toRemoveUserId){
	    			update = true;
	    			continue;
	    		}
	    		data.userIds.push($scope.subs[i].fbId.toString());
	    	}
	    	if(update)
		   		Matches.updateSubs(data, function(response){
		   			$scope.subs = response;
		    	});
	    };
	    $scope.updateTeamA = function(data, toRemoveUserId){
	    	var update = toRemoveUserId == undefined ? true : false;
	    	//add existing players
	    	for(var i = 0; i < $scope.teamA.team.users.length; i++){
	    		if(toRemoveUserId != undefined && $scope.teamA.team.users[i].id == toRemoveUserId){
	    			update = true;
	    			continue;
	    		}
	    		var id = $scope.teamA.team.users[i].fbId != undefined ? $scope.teamA.team.users[i].fbId.toString() : $scope.teamA.team.users[i].id.toString(); 
	    		data.userIds.push(id);
	    	}
	    	if(update)
		   		Teams.updateUsers(data, function(response){
		   			$scope.teamA.team = response;
					$scope.teamA.missingPlayers = $scope.totalPlayers - response.users.length;
		    	});
	    };
	    $scope.updateTeamB = function(data, toRemoveUserId){
	    	var update = toRemoveUserId == undefined ? true : false;
	    	//add existing players
	    	for(var i = 0; i < $scope.teamB.team.users.length; i++){
	    		if(toRemoveUserId != undefined && $scope.teamB.team.users[i].id == toRemoveUserId){
	    			update = true;
	    			continue;
	    		}
	    		var id = $scope.teamB.team.users[i].fbId != undefined ? $scope.teamB.team.users[i].fbId.toString() : $scope.teamB.team.users[i].id.toString();
	    		data.userIds.push(id);
	    	}
	    	if(update)
		   		Teams.updateUsers(data, function(response){
		   			$scope.teamB.team = response;
					$scope.teamB.missingPlayers = $scope.totalPlayers - response.users.length;
		    	});
	    };
	    
	    //match Share
	    $scope.shareFB = function(){
	    	//TODO: cambiar metodo feed (deprecated) por share_open_graph con story
	    	var url = $scope.matchShareURL;
	    	//var url = "http://www.futzapp.com/back/public/matchSharer.php";
			/*FB.ui({
	    		method: 'share_open_graph',
	    		action_type: 'futzapp_test:jugar',
	    		action_properties: JSON.stringify({
	    			ref: $scope.match.token,
	    			start_time: $scope.match.date,
	    			fulbo: url
	    		})
	    	}, function(response){});
			FB.ui({
	    		method: 'share',
	    		href: url 
	    	}, function(response){});*/
			FB.ui( {
				method: 'feed',
				name: "Futzapp",
				link: url,
				picture: "http://futzapp.com/images/field.jpg",
				description: "Jugate un futzapp el " + $filter('dateFormat')($scope.match.date, 'dddd ') +  " a las " + $filter('dateFormat')($scope.match.date, 'hh:mm a') + " en " + $scope.match.field.name + "!",
				caption: "Ya reservaste cancha y te faltan jugadores? Armar un partido de f&uacute;tbol entre amigos nunca fue tan f&aacute;cil!"
			}, function( response ) {
				// do nothing
			} );
	    };
}]);

fulboControllers.controller('ProfileController', ['$rootScope', '$scope', 'UsersAuth', 'Users', 
  function($rootScope, $scope, UsersAuth, Users) {
	//TODO: calculate games played
	$scope.gamesPlayed = 0;
	
	$scope.saveUserData = function() {
		Users.update($rootScope.user, function(){
			console.log("user updated!");
		}, function(){
			console.log("user update failed!");
		});
	};
	
	$scope.logout = function() {
    	UsersAuth.logout();
    };
}]);


'use strict';

/* Filters */
var fulboFilters = angular.module('fulboFilters', []);

fulboFilters.filter('checkmark', function() {
  return function(input) {
    return input ? '\u2713' : '\u2718';
  };
});

fulboFilters.filter('dateFormat', function() {
	  return function(input, formatString) {
		  return moment(input).locale('es').format(formatString);
	  };
});
fulboFilters.filter('orderObjectBy', function(){
	return function(input, attribute) {
		if (!angular.isObject(input)) return input;

	    var array = [];
	    for(var objectKey in input) {
	        array.push(input[objectKey]);
	    }
		
		if(attribute == 'date'){
			array.sort(function(a, b){
				a = a[attribute];
				b = b[attribute];
				return a>b ? 1 : a<b ? -1 : 0;
			});
		} else {
			array.sort(function(a, b){
				a = parseInt(a[attribute]);
				b = parseInt(b[attribute]);
				return a - b;
			});
		}
	    return array;
	};
});

fulboFilters.filter('getById', function() {
  return function(input, id) {
    var i=0, len=input.length;
    for (; i<len; i++) {
      if (+input[i].id == +id) {
        return input[i];
      }
    }
    return null;
  };
});

'use strict';

/* Services */
//var serverURL = "http://futzapp.com/back/public/"; //PRD
var serverURL = "http://futbolizados.dev/"; //DEV

var fulboServices = angular.module('fulboServices', ['ngResource']);

/* Notifications Services */
fulboServices.factory('MandrillAPI', ['$resource',
  function($resource){
    return $resource('https://mandrillapp.com/api/1.0/:category/:call.json', {}, {
    	sendMessage: {
			method: "POST",
			isArray: true,
			params: {
			  category: "messages",
			  call: "send"
			}
		},
		ping: {
			method: "POST",
			params: {
			  category: "users",
			  call:"ping"
			}
		}
    });
}]);

fulboServices.factory('MandrillHelper', ['MandrillAPI', function(Mandrill) {
	var sdo = {
		setup: {
			apiKey: "fqI6qDsSxKpKcZW_PaYtUQ", //Mandrill API Key
			fromEmail: "no-reply@futzapp.com" //sender mail
		},
		checkSetup: function(successCallBack, errorCallBack){
			var _self = this;
			Mandrill.ping(
			  {"key": _self.setup.apiKey}, 
				function(data,status,headers,config){ 
					successCallBack();
				},
				function(data,status,headers,config){
					errorCallBack();
				}
			)
		},
		sendMessage: function(subject, message, mailTo, successCallback, errorCallBack){
			var _self = this;
			Mandrill.sendMessage(
				{
					key: _self.setup.apiKey,
					message: {
					  html: message,
					  subject: subject,
					  from_email: _self.setup.fromEmail,
					  to: mailTo
					}
				},
				function(data,status,headers,config){
					successCallback(data);
				},
				function(data,status,headers,config){
					errorCallBack(data);
				}
			)
		}
	};
	return sdo;
}]);

fulboServices.factory('Notifications', ['$rootScope', '$filter', '$sanitize', '$location', 'MandrillHelper', function($rootScope, $filter, $sanitize, $location, MandrillHelper) {
	var sdo = {
		juego: function(match){
			var message = "Juego el partido del día " + $filter('dateFormat')(match.date, 'dddd d') + " de " + $filter('dateFormat')(match.date, 'MMMM') +  " a las " + $filter('dateFormat')(match.date, 'hh:mm a') + " en " + match.field.name;
			message += "<br/>Entra a Futzapp y mira como quedaron los equipos: " + $sanitize("http://" + $location.host() + "/#/match/" + match.id);
			MandrillHelper.checkSetup(function(){	
				MandrillHelper.sendMessage("Juego!", message, [{email: match.admin.email}], function(data){
					console.log("Mail enviado!" + data);
				}, function(data) {
					console.log("Error al enviar el mail!" + data);
				});
			}, function(){
				console.log("Error con Mandrill, verificar API Key");
			});
		},
		meBajo: function(match){
			var message = "Me bajo del partido del día " + $filter('dateFormat')(match.date, 'dddd d') + " de " + $filter('dateFormat')(match.date, 'MMMM') +  " a las " + $filter('dateFormat')(match.date, 'hh:mm a') + " en " + match.field.name;
			message += "<br/>Entra a Futzapp y mira como quedaron los equipos: " + $sanitize("http://" + $location.host() + "/#/match/" + match.id);
			MandrillHelper.checkSetup(function(){	
				MandrillHelper.sendMessage("Me bajo!", message, [{email: match.admin.email}], function(data){
					console.log("Mail enviado!" + data);
				}, function(data) {
					console.log("Error al enviar el mail!" + data);
				});
			}, function(){
				console.log("Error con Mandrill, verificar API Key");
			});
		},
		completo: function(match, guests){
			var message = "Ya estamos todos para el partido del día " + $filter('dateFormat')(match.date, 'dddd d') + " de " + $filter('dateFormat')(match.date, 'MMMM') +  " a las " + $filter('dateFormat')(match.date, 'hh:mm a') + " en " + match.field.name;
			message += "<br/>Entra a Futzapp y mira como quedaron los equipos: " + $sanitize("http://" + $location.host() + "/#/match/" + match.id);
			
			var mails = [];
			for(var i = 0; i < guests.length; i++) {
				if(guests[i].pivot.confirmed == "1" && guests[i].email != null) {
					mails.push({email: guests[i].email});
				}
	        }
			mails.push({email: $rootScope.user.email});
			if($rootScope.user.email != match.admin.email)
				mails.push({email: match.admin.email});
	    	
			MandrillHelper.checkSetup(function(){	
				MandrillHelper.sendMessage("Partido completo!", message, mails, function(data){
					console.log("Mail enviado!" + data);
				}, function(data) {
					console.log("Error al enviar el mail!" + data);
				});
			}, function(){
				console.log("Error con Mandrill, verificar API Key");
			});
		},
		cancelado: function(match, guests){
			var message = "Se cancela el partido del día " + $filter('dateFormat')(match.date, 'dddd d') + " de " + $filter('dateFormat')(match.date, 'MMMM') +  " a las " + $filter('dateFormat')(match.date, 'hh:mm a') + " en " + match.field.name;
			message += "<br/>Entra a futzapp y arma uno nuevo! " + $sanitize("http://" + $location.host());
			
			var mails = [];
			for(var i = 0; i < guests.length; i++) {
				if(guests[i].pivot.confirmed == "1" && guests[i].id != match.admin.id && guests[i].email != null) {
					mails.push({email: guests[i].email});
				}
	        }
	    	
			MandrillHelper.checkSetup(function(){	
				MandrillHelper.sendMessage("Partido cancelado!", message, mails, function(data){
					console.log("Mail enviado!" + data);
				}, function(data) {
					console.log("Error al enviar el mail!" + data);
				});
			}, function(){
				console.log("Error con Mandrill, verificar API Key");
			});
		}
	};
	
	return sdo;
}]);
/* End Notifications Services */

/* Facebook API Services */
fulboServices.factory('Facebook', ['$rootScope', 'Users', function($rootScope, Users) {
	var sdo = {
		getPlaceIdByLatLong: function(town, lat, long, callback){
			FB.api(
					'/search?q=' + town + '&type=place&center=' + lat + ',' + long + '&distance=8000', 
					'GET',
			        function(response) {
						if(response.data != undefined && response.data.length > 0 && response.data[0].id != undefined){
							var result = null;
							var foundResult = false;
                            for(var i = 0; i<response.data.length; i++){
                            	if(foundResult)
                            		break;
                            	for(var j = 0; j <  response.data[i].category_list.length; j++){       
                            		if(response.data[i].category_list[j].name == "City"){
                            			result = response.data[i];
                            			foundResult = true;
                            			break;
                            		}
                            	}
                            }
                            
                            if(foundResult) callback(result.id);
                            else callback(-1);
						}
						else
							callback(-1);
			        }
			);
		},
		postNotification: function(message, link, tags, actions, callback, errorCallback){
			var post = {
					"message": message,
			        "link": link,
			        "tags": tags,
			        "place": "657422474374247"
			};
			if(actions != null){
				post.actions = actions;
			}
			FB.api(
			    "/me/feed",
			    "POST",
			    post,
			    function (response) {
			      if (response && !response.error) {
			    	  callback();
			      } else {
			    	  errorCallback();
			      }
			    }
			);
		},
		getFriends: function(callback){
			FB.api("/me/friends", function (response) {
				if (response && !response.error) {
					/* handle the result */
					console.log("Friends list retrieved, " + response.length + " results.");
					callback(response.data);
				}
			});
		},
		getPhoto: function(){
			FB.api("/me/picture?type=normal", function (response) {
				if (response && !response.error) {
					/* handle the result */
					console.log("User profile pic retrieved");
					$rootScope.$apply(function() { 
						var authedUser = $rootScope.user;
						authedUser.photo_url = response.data.url;
						Users.update(authedUser, function(){
							$rootScope.user = authedUser;
							console.log("user updated!");
						}, function(){
							console.log("user save failed!");
							authedUser.photo_url = ""; //TODO: default photo
							$rootScope.user = authedUser;
						});
					});
				}
			});
		}
	};
	
	return sdo;
}]);
/* End Facebook API Services */

/* User Model Services */
fulboServices.factory('Users', ['$resource',
  function($resource){
    return $resource(serverURL+'usersAPI/:dest/:id', {}, {
    	query: {method:'GET', params:{id:''}, isArray:true},
    	update: {
    	    method: 'PUT', 
    	    params: {id: '@id'}
    	},
    	getMatches: {
    		method: 'GET',
    		params: {dest: 'matches', id: '@id'}
    	},
    	getGroups: {
    		method: 'GET',
    		params: {dest: 'groups', id: '@id'}
    	}
    });
  }]);
/* End User Model Services */

/*  Login Services */
fulboServices.factory('UsersAuth', ['$rootScope', '$location', 'Users', 'Facebook', 'Matches', 'redirectToUrlAfterLogin', function($rootScope, $location, Users, Facebook, Matches, redirectToUrlAfterLogin) {
	
	var sdo = {
		isLogged: false,
		user: null,
		fbToken: null,
		
		saveAttemptUrl: function() {
			if($location.path().toLowerCase() != '/' && $location.path().toLowerCase() != '') {
				redirectToUrlAfterLogin.url = $location.path();
			}
			else
				redirectToUrlAfterLogin.url = '/home';
		},
	    redirectToAttemptedUrl: function() {
	    	$location.path(redirectToUrlAfterLogin.url);
	    },
		/* FB Methods */
		getUserInfo: function(fbToken) {
			var _self = this;
			FB.api('/me', function(response) {
				$rootScope.$apply(function() { 
					var fbInfo = response; 
					Users.get({id: fbInfo.id}, function(storedUser){
						//update user token
						storedUser.fbId = fbInfo.id.toString();
						storedUser.FBToken = fbToken;
						Users.update(storedUser, function(){
							$rootScope.user = _self.user = storedUser;
							console.log("user updated!");
							Facebook.getPhoto();
							$("#loaderDiv").hide();

							if($rootScope.matchToken != undefined && $rootScope.matchToken != null)
								_self.addToMatchByToken($rootScope.matchToken);
							else
								_self.redirectToAttemptedUrl();
						}, function(){
							console.log("user save failed!");
							//_self.logout();
							$("#loaderDiv").hide();
						});
					}, function(error){
						if(error.status == 404){
							//create user
							var newUser = {
									fbId: fbInfo.id,
									name: fbInfo.first_name,
									lastname: fbInfo.last_name,
									age: fbInfo.age_range,
									sex: fbInfo.gender,
									fanOf: '',
									location: '',
									email: fbInfo.email,
									FBToken: fbToken
							};
							Users.save(newUser,function(){
								$rootScope.user = _self.user = newUser;
								console.log("user saved!");
								Facebook.getPhoto();
								$("#loaderDiv").hide();
								
								if($rootScope.matchToken != undefined && $rootScope.matchToken != null)
									_self.addToMatchByToken($rootScope.matchToken);
								else
									_self.redirectToAttemptedUrl();
							}, function(){
								console.log("user save failed!");
								//_self.logout();
								$("#loaderDiv").hide();
							});
						}
					});
					//$('#registerModal').modal('hide');
				});
			});
		},
		login: function(callback) {
			FB.login(function(response) {
		    }, {scope: 'email'});/*,user_friends,friends_photos,publish_actions*/
		},
		logout: function() {
			var _self = this;
			FB.logout(function(response) {
				$("#loaderDiv").hide();
				
				//erase fbToken
				var authedUser = _self.user;
				if(authedUser != null){
					authedUser.FBToken = null;
					Users.update(authedUser,function(){
						_self.eraseUserSession();
					}, function(){
						console.log("user save failed!");
						_self.eraseUserSession();
					});
				} else {
					_self.eraseUserSession();
				}
			});
		},
		eraseUserSession: function(){
			$rootScope.user = this.user = null; 
			this.isLogged = false;
			this.fbToken = null;
			$location.path("/");
		},
		watchAuthenticationStatusChange: function() {
			var _self = this;
			FB.Event.subscribe('auth.authResponseChange', function(response) {
				$("#loaderDiv").show();
				if (response.status === 'connected') {
					console.log('Welcome!  Fetching your information.... ');
					var fbToken = response.authResponse.accessToken;
					_self.getUserInfo(fbToken);
					_self.isLogged = true;
				} 
				else {
					$("#loaderDiv").hide();
					console.log('User logged out.');
					if(_self.user != null){
						//_self.logout();
					} else{
						_self.isLogged = false;
						_self.fbToken = null;
					}
				}
			});
		},
		addToMatchByToken: function(matchToken) {
			//get match
			var match = Matches.getByToken({id: decodeURIComponent(matchToken)}, function(){
				var data = {
					users: [],
					matchId: match.id
				};
				
				var userExists = false;
				//add existing guests
				for(var i = 0; i < match.guests.length; i++){
					if(match.guests[i].fbId != null && match.guests[i].fbId.toString() == $rootScope.user.fbId || $rootScope.user.id == match.admin.id){
						userExists = true;
						break;
					}
					var userItem = {
						id: match.guests[i].fbId != null? match.guests[i].fbId.toString() : match.guests[i].id.toString(),
					    confirmed: match.guests[i].pivot.confirmed
					};
					data.users.push(userItem);
				}
				    	
				//add new members
				if(!userExists) {
					var newUserItem = {
						id: $rootScope.user.fbId,
						confirmed: null
					};
					data.users.push(newUserItem);
					
					var message = "Copate a un fulbo el " + match.date + " en " + match.field.name;
		    		var link = "http://www.futzapp.com?token=" + match.token; //TODO: link al partido
		    		var actions = null;
		    		var tags = $rootScope.user.fbId;
		    		Facebook.getPlaceIdByLatLong(match.field.town, match.field.latitude, match.field.longitude, function(placeId){
		    			if(placeId != -1){
			    			Facebook.postNotification(message, link, tags, actions, placeId, function(){
								console.log("Se envió una notificación a " + $rootScope.user.id);
							}, function(){
								console.log("No se pudo enviar una notificación a " + $rootScope.user.id);
							});
		    			} else {
		    				console.log("No se pudo enviar una notificación a " + $rootScope.user.id);
		    			}
		    		});
		    		
		    		Matches.updateGuests(data, function(response){
						console.log("Player " + $rootScope.user.id + " invited!");
					});
				}
				
				$location.path( "match/" + match.id );
			});
		}
	};
	return sdo;
}]);
/*  End Login Services */

/* Matches Model Services */
fulboServices.factory('Matches', ['$resource',
  function($resource){
    return $resource(serverURL+'matchesAPI/:dest/:id', {}, {
    	query: {method:'GET', params:{id:''}, isArray:true},
      	update: {
	  	    method: 'PUT', 
	  	    params: {id: '@id'}
	  	},
	  	getByToken: {
	  		method: 'GET',
	  		params: {dest: 'getByToken', id: '@id'}, 
	  		isArray:false
	  	},
	  	getAdminUser: {
	  		method: 'GET',
	  		params: {dest: 'getAdminUser', id: '@id'}
	  	},
	  	getTeams: {
	  		method: 'GET',
	  		params: {dest: 'getTeams', id: '@id'}, 
	  		isArray:true
	  	},
	  	getSubs: {
	  		method: 'GET',
	  		params: {dest: 'getSubs', id: '@id'}, 
	  		isArray:true
	  	},
	  	getGuests: {
	  		method: 'GET',
	  		params: {dest: 'getGuests', id: '@id'}, 
	  		isArray:true
	  	},
	  	updateSubs: {
	  		method: 'POST',
	  		params: {dest: 'updateSubs'}, 
	  		isArray:true
	  	},
	  	updateGuests: {
	  		method: 'POST',
	  		params: {dest: 'updateGuests'}, 
	  		isArray:true
	  	}
    });
  }]);
/* Matches Model Services */

/* Field Model Services */
fulboServices.factory('Fields', ['$resource',
  function($resource){
    return $resource(serverURL+'fieldsAPI/:id', {}, {
      query: {method:'GET', params:{id:''}, isArray:true}
    });
  }]);
/* Field Model Services */

/* Match Type Model Services */
fulboServices.factory('MatchTypes', ['$resource',
  function($resource){
    return $resource(serverURL+'matchTypesAPI/:id', {}, {
      query: {method:'GET', params:{id:''}, isArray:true}
    });
  }]);
/* Match Type Model Services */

/* Group Model Services */
fulboServices.factory('Groups', ['$resource',
  function($resource){
    return $resource(serverURL+'groupsAPI/:dest/:id', {}, {
    	query: {method:'GET', params:{id:''}, isArray:true},
      	update: {
	  	    method: 'PUT', 
	  	    params: {id: '@id'}
	  	},
    	getUsers: {
	  		method: 'GET',
	  		params: {dest: 'getUsers', id: '@id', isArray:true}
	  	},
	  	updateUsers: {
	  		method: 'POST',
	  		params: {dest: 'updateUsers', isArray:true}
	  	}
    });
  }]);
/* Group Model Services */

/* Team Model Services */
fulboServices.factory('Teams', ['$resource',
  function($resource){
    return $resource(serverURL+'teamsAPI/:dest/:id', {}, {
    	query: {method:'GET', params:{id:''}, isArray:true},
    	update: {
	  	    method: 'PUT', 
	  	    params: {id: '@id'}
	  	},
    	getUsers: {
	  		method: 'GET',
	  		params: {dest: 'getUsers', id: '@id', isArray:true}
	  	},
	  	updateUsers: {
	  		method: 'POST',
	  		params: {dest: 'updateUsers', isArray:true}
	  	}
    });
  }]);
/* Team Model Services */

/* Town Model Services */
fulboServices.factory('Towns', ['$resource',
  function($resource){
    return $resource(serverURL+'townsAPI/:id', {}, {
    	query: {method:'GET', params:{id:''}, isArray:true}
    });
  }]);
/* Town Model Services */

/* State Model Services */
fulboServices.factory('States', ['$resource',
  function($resource){
    return $resource(serverURL+'statesAPI/:id', {}, {
    	query: {method:'GET', params:{id:''}, isArray:true}
    });
  }]);
/* State Model Services */
'use strict';

/* Directives */

var fulboDirectives = angular.module('fulboDirectives', []);

fulboDirectives.directive('checkUserAuthed', ['$rootScope', '$location', 'UsersAuth', function ($root, $location, UserAuth) {
	return {
		link: function (scope, elem, attrs, ctrl) {
			$root.$on('$routeChangeStart', function(event, currRoute, prevRoute){
				if (!prevRoute.access.isFree && !UserAuth.isLogged) {
					$location.path( "/" );
				}
			});
		}
	};
}]);

fulboDirectives.directive('dynFbCommentBox', function () {
    function createHTML(href, numposts, colorscheme) {
        return '<div class="fb-comments" ' +
                       'data-href="' + href + '" ' +
                       'data-numposts="' + numposts + '" ' +
                       'data-colorsheme="' + colorscheme + '">' +
               '</div>';
    }

    return {
        restrict: 'A',
        scope: {},
        link: function postLink(scope, elem, attrs) {
            attrs.$observe('pageHref', function (newValue) {
                var href        = newValue;
                var numposts    = attrs.numposts    || 5;
                var colorscheme = attrs.colorscheme || 'light';

                elem.html(createHTML(href, numposts, colorscheme));
                FB.XFBML.parse(elem[0]);
            });
        }
    };
});

fulboDirectives.directive('dateTimePicker', ['$rootScope', function ($rootScope) {
	return {
        //require: '?ngModel',
        restrict: 'AE',
        scope: {
            pick12HourFormat: '@',
            language: '@',
            useCurrent: '@',
            location: '@'
        },
        link: function (scope, elem, attrs) {
            elem.datetimepicker({
                pick12HourFormat: scope.pick12HourFormat,
                language: scope.language,
                useCurrent: scope.useCurrent
            });

            //Local event change
            elem.on('blur', function () {

                console.info('this', this);
                console.info('scope', scope);
                console.info('attrs', attrs);


                /*// returns moments.js format object
                scope.dateTime = new Date(elem.data("DateTimePicker").getDate().format());
                // Global change propagation

                $rootScope.$broadcast("emit:dateTimePicker", {
                    location: scope.location,
                    action: 'changed',
                    dateTime: scope.dateTime,
                    example: scope.useCurrent
                });
                scope.$apply();*/
            });
        }
    };
}]);

fulboDirectives.directive('selectOnClick', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.on('click', function () {
                this.select();
            });
        }
    };
});

fulboDirectives.directive('backButton', function(){
    return {
      restrict: 'A',

      link: function(scope, element, attrs) {
        element.bind('click', goBack);

        function goBack() {
          history.back();
          scope.$apply();
        }
      }
    }
});

/**
 * PARTIALS
**/
fulboDirectives.directive('fieldCard', function() {
    return {
        restrict: 'E',
        templateUrl: 'partials/field-card.html', // markup for template
        scope: { 'field': '=data' }
    };
});

fulboDirectives.directive('matchMenu', function() {
    return {
        restrict: 'E',
        templateUrl: 'partials/match-menu.html', // markup for template
        scope: { 
					'step2': '=step2',
					'step3': '=step3'
				}
    };
});

fulboDirectives.directive('formTitleBar', function() {
    return {
        restrict: 'E',
        templateUrl: 'partials/form-title-bar.html', // markup for template
        scope: { 
			'title': '=title',
			'cancelUrl': '=cancelUrl'
		}
    };
});

fulboDirectives.directive('newMatchCard', function() {
    return {
        restrict: 'E',
        templateUrl: 'partials/new-match-card.html', // markup for template
        scope: { 'match': '=data' }
    };
});

fulboDirectives.directive('modalField', function() {
    return {
        restrict: 'E',
        templateUrl: 'partials/modal-field.html', // markup for template
        scope: false,
		link: function link(scope, element, attrs) {
			/*var field;
		
			scope.$watch(scope.match.field, function(value) {
			  field = value;
			  renderGoogleMap();
			});
			
			function renderGoogleMap() {
				//field map
				var fieldPos = new google.maps.LatLng(field.latitude, field.longitude);
				var mapOptions = {
					center: fieldPos,
					zoom: 14,
					mapTypeId: google.maps.MapTypeId.ROADMAP
				};
				var map = new google.maps.Map(document.getElementById("map_canvas"),
								mapOptions); 
				var marker = new google.maps.Marker({
					position: fieldPos,
					map: map,
					title: 'field.name'
				});
			}*/
		}
    };
});

fulboDirectives.directive('teams', function() {
    return {
        restrict: 'E',
        templateUrl: 'partials/teams.html', // markup for template
        scope: false
    };
});

fulboDirectives.directive('playerProfile', function() {
    return {
        restrict: 'E',
        templateUrl: 'partials/modal-player-profile.html', // markup for template
        scope: { 
			'player': '=player', 
			'matchesPlayed': '=matchesPlayed', 
			'matchesOrganized': '=matchesOrganized',
			'adminMode': '=adminMode'
		}
    };
});
function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}

function showAlert(title, message) {
	$("#alertModal .modal-title").html(title);
	$("#alertModal .message").html(message);
	$('#alertModal').modal('show');
}
waShBtn=function(){this.isIos===!0&&this.cntLdd(window,this.crBtn)},waShBtn.prototype.isIos=navigator.userAgent.match(/iPhone/i)&&!navigator.userAgent.match(/iPod/i)?!0:!1,waShBtn.prototype.cntLdd=function(win,fn){var done=!1,top=!0,doc=win.document,root=doc.documentElement,add=doc.addEventListener?"addEventListener":"attachEvent",rem=doc.addEventListener?"removeEventListener":"detachEvent",pre=doc.addEventListener?"":"on",init=function(e){("readystatechange"!=e.type||"complete"==doc.readyState)&&(("load"==e.type?win:doc)[rem](pre+e.type,init,!1),!done&&(done=!0)&&fn.call(win,e.type||e))},poll=function(){try{root.doScroll("left")}catch(e){return void setTimeout(poll,50)}init("poll")};if("complete"==doc.readyState)fn.call(win,"lazy");else{if(doc.createEventObject&&root.doScroll){try{top=!win.frameElement}catch(e){}top&&poll()}doc[add](pre+"DOMContentLoaded",init,!1),doc[add](pre+"readystatechange",init,!1),win[add](pre+"load",init,!1)}},waShBtn.prototype.addStyling=function(){var s=document.createElement("style"),c="body,html{padding:0;margin:0;height:100%;width:100%}.wa_btn{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNi4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkViZW5lXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Qm94PSIwIDAgMTYgMTYiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDE2IDE2IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxnPg0KCQk8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZmlsbD0iI0ZGRkZGRiIgZD0iTTguMTI5LDAuOTQ1Yy0zLjc5NSwwLTYuODcyLDMuMDc3LTYuODcyLDYuODczDQoJCQljMCwxLjI5OCwwLjM2LDIuNTEyLDAuOTg2LDMuNTQ5bC0xLjI0LDMuNjg4bDMuODA1LTEuMjE5YzAuOTg0LDAuNTQ0LDIuMTE2LDAuODU0LDMuMzIxLDAuODU0YzMuNzk1LDAsNi44NzEtMy4wNzUsNi44NzEtNi44NzENCgkJCVMxMS45MjQsMC45NDUsOC4xMjksMC45NDV6IE04LjEyOSwxMy41MzhjLTEuMTYyLDAtMi4yNDQtMC4zNDgtMy4xNDctMC45NDZsLTIuMTk4LDAuNzA1bDAuNzE1LTIuMTI0DQoJCQljLTAuNjg2LTAuOTQ0LTEuMDktMi4xMDMtMS4wOS0zLjM1NGMwLTMuMTU1LDIuNTY2LTUuNzIyLDUuNzIxLTUuNzIyczUuNzIxLDIuNTY2LDUuNzIxLDUuNzIyUzExLjI4MywxMy41MzgsOC4xMjksMTMuNTM4eg0KCQkJIE0xMS4zNTIsOS4zNzljLTAuMTc0LTAuMDk0LTEuMDItMC41NS0xLjE3OC0wLjYxNUMxMC4wMTQsOC43LDkuODk4LDguNjY2LDkuNzc1LDguODM3QzkuNjUyLDkuMDA3LDkuMzAxLDkuMzksOS4xOTMsOS41MDUNCgkJCUM5LjA4OCw5LjYxNyw4Ljk4NCw5LjYyOSw4LjgxMiw5LjUzM2MtMC4xNzEtMC4wOTYtMC43My0wLjMtMS4zNzgtMC45MjNjLTAuNTA0LTAuNDg0LTAuODM0LTEuMDcyLTAuOTMtMS4yNTINCgkJCWMtMC4wOTUtMC4xOCwwLTAuMjcxLDAuMDkxLTAuMzU0QzYuNjc3LDYuOTI4LDYuNzc4LDYuODA1LDYuODcsNi43MDZjMC4wOTEtMC4xLDAuMTI0LTAuMTcxLDAuMTg3LTAuMjg2DQoJCQljMC4wNjItMC4xMTUsMC4wMzgtMC4yMTgtMC4wMDMtMC4zMDhDNy4wMTIsNi4wMjMsNi42OTQsNS4xNDYsNi41NjEsNC43OUM2LjQyOCw0LjQzNCw2LjI4LDQuNDg2LDYuMTc3LDQuNDgyDQoJCQlDNi4wNzUsNC40NzksNS45NTgsNC40NTksNS44NDEsNC40NTZDNS43MjQsNC40NTEsNS41MzMsNC40ODcsNS4zNjYsNC42NTdjLTAuMTY3LDAuMTctMC42MzcsMC41NzYtMC42NjksMS40MzkNCgkJCXMwLjU2NSwxLjcyMiwwLjY0OCwxLjg0MWMwLjA4NCwwLjEyMSwxLjE0LDEuOTkxLDIuODk3LDIuNzYyYzEuNzU2LDAuNzcsMS43NjYsMC41MzQsMi4wODgsMC41MTgNCgkJCWMwLjMyMi0wLjAxOCwxLjA1NS0wLjM4NiwxLjIxNS0wLjc4OWMwLjE2Mi0wLjQwNSwwLjE3Ni0wLjc1NSwwLjEzNS0wLjgzMUMxMS42MzksOS41MjEsMTEuNTIzLDkuNDc1LDExLjM1Miw5LjM3OXoiLz4NCgk8L2c+DQo8L2c+DQo8L3N2Zz4NCg==);border:1px solid rgba(0,0,0,.1);display:inline-block!important;position:relative;font-family:Arial,sans-serif;letter-spacing:.4px;cursor:pointer;font-weight:400;text-transform:none;color:#fff;border-radius:2px;background-color:#5cbe4a;background-repeat:no-repeat;line-height:1.2;text-decoration:none;text-align:left}.wa_btn_s{font-size:12px;background-size:16px;background-position:5px 2px;padding:3px 6px 3px 25px}.wa_btn_m{font-size:16px;background-size:20px;background-position:4px 2px;padding:4px 6px 4px 30px}.wa_btn_l{font-size:16px;background-size:20px;background-position:5px 5px;padding:8px 6px 8px 30px}";return s.type="text/css",s.styleSheet?s.styleSheet.cssText=c:s.appendChild(document.createTextNode(c)),s},waShBtn.prototype.crBtn=function(){var b=document.getElementsByClassName("wa_btn");iframe=new Array;for(var i=0;i<b.length;i++){var parent=b[i].parentNode,t=b[i].getAttribute("data-text"),u=b[i].getAttribute("data-href"),o=b[i].getAttribute("href"),at="?text="+t;t&&(at+=" "),at+=u?u:document.URL,b[i].setAttribute("href",o+at),b[i].setAttribute("target","_top"),iframe[i]=document.createElement("iframe"),iframe[i].width=1,iframe[i].height=1,iframe[i].button=b[i],iframe[i].style.border=0,iframe[i].style.overflow="hidden",iframe[i].border=0,iframe[i].setAttribute("scrolling","no"),iframe[i].addEventListener("load",function(){this.contentDocument.body.appendChild(this.button),this.contentDocument.getElementsByTagName("head")[0].appendChild(theWaShBtn.addStyling());var meta=document.createElement("meta");meta.setAttribute("charset","utf-8"),this.contentDocument.getElementsByTagName("head")[0].appendChild(meta),this.width=Math.ceil(this.contentDocument.getElementsByTagName("a")[0].getBoundingClientRect().width),this.height=Math.ceil(this.contentDocument.getElementsByTagName("a")[0].getBoundingClientRect().height)},!1),parent.insertBefore(iframe[i],b[i])}};var theWaShBtn=new waShBtn;