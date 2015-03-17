'use strict';

/* Services */
//var serverURL = "http://futzapp.com/back/public/";
var serverURL = "http://futbolizados.dev/";

var fulboServices = angular.module('fulboServices', ['ngResource']);

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
			if($location.path().toLowerCase() != '/') {
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
							_self.logout();
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
								_self.logout();
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
						_self.logout();
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