'use strict';

/* Services */
var serverURL = prd ? "http://www.futzapp.com/back/public/" : "http://futbolizados.dev/"; //DEV

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
		juego: function(match, userName){
			var message = juegoMessage.replace("%1$s", $filter('dateFormat')(match.date, 'dddd d')).replace("%2$s", $filter('dateFormat')(match.date, 'MMMM')).replace("%3$s", $filter('dateFormat')(match.date, 'hh:mm a')).replace("%4$s", match.field.name).replace("%5$s", $sanitize("http://" + $location.host() + "/#/match/" + match.id)).replace("%6$s", userName);
			var subject = juegoSubject.replace("%1$s", $filter('dateFormat')(match.date, 'dddd d')).replace("%2$s", $filter('dateFormat')(match.date, 'MMMM')).replace("%3$s", $filter('dateFormat')(match.date, 'hh:mm a')).replace("%4$s", match.field.name).replace("%5$s", $sanitize("http://" + $location.host() + "/#/match/" + match.id)).replace("%6$s", userName);
			MandrillHelper.checkSetup(function(){	
				MandrillHelper.sendMessage(subject, message, [{email: match.admin.email}], function(data){
					console.log("Mail enviado!" + data);
				}, function(data) {
					console.log("Error al enviar el mail!" + data);
				});
			}, function(){
				console.log("Error con Mandrill, verificar API Key");
			});
		},
		meBajo: function(match, userName){
			var message = meBajoMessage.replace("%1$s", $filter('dateFormat')(match.date, 'dddd d')).replace("%2$s", $filter('dateFormat')(match.date, 'MMMM')).replace("%3$s", $filter('dateFormat')(match.date, 'hh:mm a')).replace("%4$s", match.field.name).replace("%5$s", $sanitize("http://" + $location.host() + "/#/match/" + match.id)).replace("%6$s", userName);
			var subject = meBajoSubject.replace("%1$s", $filter('dateFormat')(match.date, 'dddd d')).replace("%2$s", $filter('dateFormat')(match.date, 'MMMM')).replace("%3$s", $filter('dateFormat')(match.date, 'hh:mm a')).replace("%4$s", match.field.name).replace("%5$s", $sanitize("http://" + $location.host() + "/#/match/" + match.id)).replace("%6$s", userName);
			MandrillHelper.checkSetup(function(){	
				MandrillHelper.sendMessage(subject, message, [{email: match.admin.email}], function(data){
					console.log("Mail enviado!" + data);
				}, function(data) {
					console.log("Error al enviar el mail!" + data);
				});
			}, function(){
				console.log("Error con Mandrill, verificar API Key");
			});
		},
		completo: function(match, guests){
			var message = completoMessage.replace("%1$s", $filter('dateFormat')(match.date, 'dddd d')).replace("%2$s", $filter('dateFormat')(match.date, 'MMMM')).replace("%3$s", $filter('dateFormat')(match.date, 'hh:mm a')).replace("%4$s", match.field.name).replace("%5$s", $sanitize("http://" + $location.host() + "/#/match/" + match.id));
			var subject = completoSubject.replace("%1$s", $filter('dateFormat')(match.date, 'dddd d')).replace("%2$s", $filter('dateFormat')(match.date, 'MMMM')).replace("%3$s", $filter('dateFormat')(match.date, 'hh:mm a')).replace("%4$s", match.field.name).replace("%5$s", $sanitize("http://" + $location.host() + "/#/match/" + match.id));
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
				MandrillHelper.sendMessage(subject, message, mails, function(data){
					console.log("Mail enviado!" + data);
				}, function(data) {
					console.log("Error al enviar el mail!" + data);
				});
			}, function(){
				console.log("Error con Mandrill, verificar API Key");
			});
		},
		teBajaron: function(match, userMail){
			var message = teBajaronMessage.replace("%1$s", $filter('dateFormat')(match.date, 'dddd d')).replace("%2$s", $filter('dateFormat')(match.date, 'MMMM')).replace("%3$s", $filter('dateFormat')(match.date, 'hh:mm a')).replace("%4$s", match.field.name).replace("%5$s", $sanitize("http://" + $location.host() + "/#/match/" + match.id));
			var subject = teBajaronSubject.replace("%1$s", $filter('dateFormat')(match.date, 'dddd d')).replace("%2$s", $filter('dateFormat')(match.date, 'MMMM')).replace("%3$s", $filter('dateFormat')(match.date, 'hh:mm a')).replace("%4$s", match.field.name).replace("%5$s", $sanitize("http://" + $location.host() + "/#/match/" + match.id));
			
			MandrillHelper.checkSetup(function(){	
				MandrillHelper.sendMessage(subject, message, [{email: userMail}], function(data){
					console.log("Mail enviado!" + data);
				}, function(data) {
					console.log("Error al enviar el mail!" + data);
				});
			}, function(){
				console.log("Error con Mandrill, verificar API Key");
			});
		},
		cancelado: function(match, guests){
			var message = completoMessage.replace("%1$s", $filter('dateFormat')(match.date, 'dddd d')).replace("%2$s", $filter('dateFormat')(match.date, 'MMMM')).replace("%3$s", $filter('dateFormat')(match.date, 'hh:mm a')).replace("%4$s", match.field.name).replace("%5$s", $sanitize("http://" + $location.host() + "/#/match/" + match.id));
			var subject = completoSubject.replace("%1$s", $filter('dateFormat')(match.date, 'dddd d')).replace("%2$s", $filter('dateFormat')(match.date, 'MMMM')).replace("%3$s", $filter('dateFormat')(match.date, 'hh:mm a')).replace("%4$s", match.field.name).replace("%5$s", $sanitize("http://" + $location.host() + "/#/match/" + match.id));
			
			var mails = [];
			for(var i = 0; i < guests.length; i++) {
				if(guests[i].pivot.confirmed == "1" && guests[i].id != match.admin.id && guests[i].email != null) {
					mails.push({email: guests[i].email});
				}
	        }
	    	
			MandrillHelper.checkSetup(function(){	
				MandrillHelper.sendMessage(subject, message, mails, function(data){
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
							$rootScope.loading = false;
						}, function(){
							console.log("user save failed!");
							authedUser.photo_url = "assets/img/profile-placeholder.png"; 
							$rootScope.user = authedUser;
							$rootScope.loading = false;
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
			if(redirectToUrlAfterLogin.url == "/step-1" || redirectToUrlAfterLogin.url == "/step-2" || redirectToUrlAfterLogin.url == "/step-3")
				redirectToUrlAfterLogin.url = '/home';
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
							
							if($rootScope.matchToken != undefined && $rootScope.matchToken != null)
								_self.addToMatchByToken($rootScope.matchToken);
							else
								_self.redirectToAttemptedUrl();
						}, function(){
							console.log("user save failed!");
							//_self.logout();
							$rootScope.loading = false;
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
								
								if($rootScope.matchToken != undefined && $rootScope.matchToken != null)
									_self.addToMatchByToken($rootScope.matchToken);
								else
									_self.redirectToAttemptedUrl();
							}, function(){
								console.log("user save failed!");
								//_self.logout();
								$rootScope.loading = false;
							});
						}
					});
					//$('#registerModal').modal('hide');
				});
			});
		},
		login: function(callback) {
			FB.login(function(response) {
		    }, {scope: 'public_profile,email,user_friends,friends_photos'});/*,user_friends,friends_photos,publish_actions*/
		},
		logout: function() {
			var _self = this;
			FB.logout(function(response) {
				$rootScope.loading = false;
				
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
				$rootScope.loading = true;
				if (response.status === 'connected') {
					console.log('Welcome!  Fetching your information.... ');
					var fbToken = response.authResponse.accessToken;
					_self.getUserInfo(fbToken);
					_self.isLogged = true;
				} 
				else {
					$rootScope.loading = false;
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