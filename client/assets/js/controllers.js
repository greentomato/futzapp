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
		
		$scope.matches = [];
		$scope.renderMatches = function(){
			$scope.matches = [];
			var userMatches = Users.getMatches({id: $rootScope.user.id}, function(){
				for (var i=0, len=userMatches.Admin.length;i<len;i++){
					$scope.matches.push(userMatches.Admin[i]);
				}
				for (var i=0, len=userMatches.Guest.length;i<len;i++){
					$scope.matches.push(userMatches.Guest[i]);
				}
			});
		};
		$scope.renderMatches();
		
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
				if(parseInt(teamAMissingPlayers) + parseInt(teamBMissingPlayers) == 1)
					Notifications.completo($scope.match, $scope.guests);
				/* envio mail al admin */
				Notifications.juego(match, $rootScope.user.name + " " + $rootScope.user.lastname);
			   	   	
			   	$scope.renderMatches();
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
			   	
			   	$scope.renderMatches();
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
		
		$scope.wpMsg = "";
		$scope.matchShareURL = "";
		$scope.currentURL = "";
		$scope.renderMatch = function(){
			return Matches.get({id: $routeParams.matchId}, function(){
				$scope.matchShareURL = $sanitize(encodeURIComponent("http://" + $location.host() + "/?token=" + $scope.match.token));
				$scope.currentURL = $sanitize("http://" + $location.host() + "/#/match/" + $scope.match.id);
				$scope.wpMsg = "whatsapp://send?text=" + wpShareMessage.replace("%s", $scope.matchShareURL);
				
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
						$scope.teamA.positions = [];
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
						$scope.teamB.positions = [];
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
				Notifications.juego($scope.match, $rootScope.user.name + " " + $rootScope.user.lastname);
		    	
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
					Notifications.meBajo($scope.match, $rootScope.user.name + " " + $rootScope.user.lastname);
			   	
			   	$scope.match = $scope.renderMatch();
				$scope.guests = $scope.renderGuests();
		    });
	    };
	    
		$scope.newPlayerName = "";
	    $scope.selectedTeam = "";
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
	    				//agregar usuario al equipo elegido o al que le falten más jugadores
						if($scope.selectedTeam == ""){
							var teamAUpdated = false;
							var teamBUpdated = false;
							var subsUpdated = false;
							
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
								dataTeamB.userIds.push(response.id);
								teamBUpdated = true;
							} else if($scope.teamA.missingPlayers > 0){ //add to teamA
								dataTeamA.userIds.push(response.id);
								teamAUpdated = true;
							} else { //add to subs
								dataSubs.userIds.push(response.id);
								subsUpdated = true;
							}
							
							if(teamAUpdated)
								$scope.updateTeamA(dataTeamA);
							if(teamBUpdated)
								$scope.updateTeamB(dataTeamB);
							if(subsUpdated)
								$scope.updateSubs(dataSubs);
						} else {
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
						}
						
						/* si se llenaron los 2 equipos envio mail a todos */
						if(parseInt($scope.teamA.missingPlayers) + parseInt($scope.teamB.missingPlayers) == 1)
							Notifications.completo($scope.match, $scope.guests);
						
						$scope.newPlayerName = "";
						$scope.selectedTeam = "";
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
	    	var url = decodeURIComponent($scope.matchShareURL);
	    	FB.ui( {
				//method: 'feed',
				method: 'share',
				name: fbShareTitle,
				link: url,
				href: url,
				picture: fbShareImage,
				description: fbShareMsg.replace("%1$s", $filter('dateFormat')($scope.match.date, 'dddd d')).replace("%2$s", $filter('dateFormat')($scope.match.date, 'hh:mm a')).replace("%3$s", $scope.match.field.name),
				caption: fbShareCaption
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

