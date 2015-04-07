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