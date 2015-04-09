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
                       'data-width="100%"' +
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

/*fulboDirectives.directive('selectPicker', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.selectpicker();
        }
    };
});*/

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

fulboDirectives.directive('backButton', ['$rootScope', '$location', function($rootScope, $location){
    return {
      restrict: 'A',

      link: function(scope, element, attrs) {
        element.bind('click', goBack);

        function goBack() {
			var prevUrl = $rootScope.history.length > 1 ? $rootScope.history.splice(-2)[0] : "/home";
			$location.path(prevUrl);
			scope.$apply();
        }
      }
    }
}]);

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
			'selectedUser': '=player', 
			'matchesPlayed': '=matchesPlayed', 
			'matchesOrganized': '=matchesOrganized',
			'adminMode': '=adminMode'
		}
    };
});