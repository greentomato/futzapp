function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}

function showAlert(title, message) {
	$("#alertModal .modal-title").html(title);
	$("#alertModal .message").html(message);
	$('#alertModal').modal('show');
}


function detectBrowser() {
  if( !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0 )
    { return 'Opera'; }
  else if( typeof InstallTrigger !== 'undefined' )
    { return 'Firefox'; }
  else if( navigator.userAgent.indexOf("Chrome") != -1 || navigator.userAgent.indexOf("CriOS") != -1 )
    { return 'Chrome'; }
  else if( Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0 )
    { return 'Safari'; }
  else if( /*@cc_on!@*/false || !!document.documentMode )
    { return 'IE'; }
  else
    { return 'unknown'; }
}

function getMobileOperatingSystem() {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if( userAgent.match( /iPad/i ) || userAgent.match( /iPhone/i ) || userAgent.match( /iPod/i ) )
    { return 'iOS'; }
  else if( userAgent.match( /Android/i ) )
    { return 'Android'; }
  else
    { return 'unknown'; }
}

function iosOrAndroid(){
  var userAgent = navigator.userAgent;
  return ( userAgent.match( /iPad/i ) || userAgent.match( /iPhone/i ) || userAgent.match( /iPod/i ) || userAgent.match( /Android/i ) ) ? true : false;
}
