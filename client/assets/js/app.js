(function() {
	'use strict';

	var futzApp = angular.module('futzApp', [
		//'ui.router',
		'ngRoute',
		'ngAnimate',
		
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
	
	futzApp.config(['$routeProvider', '$locationProvider', 'flowFactoryProvider', 
		function($routeProvider, $locationProvider, flowFactoryProvider) {
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
	
	futzApp.run(['$rootScope', '$window', '$location', 'Fields', 'Matches', 'MatchTypes', 'UsersAuth', 'Towns', 'States', 
     	function($rootScope, $window, $location, Fields, Matches, MatchTypes, UsersAuth, Towns, States) {

			FastClick.attach(document.body);
			
			$rootScope.routeChanges = 0;
		
			$rootScope.fbUser = null;
			$rootScope.user = null;
			
			$rootScope.fbAppId = "1450926871846457";
			$rootScope.activePage = "/";
			
			$rootScope.fields = Fields.query();
			$rootScope.matchTypes = MatchTypes.query();
			$rootScope.towns = Towns.query();
			$rootScope.states = States.query();
			
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
			
			$rootScope.logout = function() {
				UsersAuth.logout();
			};
			
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

			$rootScope.createMatch = function(){
				$rootScope.newMatch.admin_userId = $rootScope.user.id;
				
				if($rootScope.newMatch.id != 0) {
					Matches.update($rootScope.newMatch, function(updatedMatch){
						$rootScope.newMatch = updatedMatch;
						console.log("Match updated, id:" + updatedMatch.id);
						$location.path( "/step-3" );
					}, function(){
						console.log("Failed updating match!");
						showAlert("Error", "Hubo un error al actualizar el partido! Intente nuevamente.");
					});
				} else {
					Matches.save($rootScope.newMatch, function(newMatch){
						$rootScope.newMatch = newMatch;
						console.log("Match saved, id:" + newMatch.id);
						$location.path( "/step-3" );
					}, function(){
						console.log("Failed saving match!");
						showAlert("Error", "Hubo un error al crear el partido! Intente nuevamente.");
					});
				}
			};
			
			$rootScope.shareFB = function(match){
				var url = "http://" + $location.host() + "?token=" + match.token;
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
					description: "Jugate un futzapp el " + match.date + " en " + field.name + "!",
					caption: "Ya reservaste cancha y te faltan jugadores? Armar un partido de fútbol entre amigos nunca fue tan fácil!"
				}, function( response ) {
					// do nothing
				} );
			};
			
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


