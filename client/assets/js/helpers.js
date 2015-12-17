function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}

function showAlert(title, message) {
	$("#alertModal .modal-title").html(title);
	$("#alertModal .message").html(message);
	$('#alertModal').modal('show');
}
