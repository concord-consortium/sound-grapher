(function() {
  var ErrorDialog = function(oscope_graph) {
    this.graph = oscope_graph;

    this._createDialog();
  };

  ErrorDialog.prototype._createDialog = function() {
    $(document.body).append('<div class="backdrop">'+
    '  <div class="dialog">'+
    '  </div>'+
    '</div>');

    this._appendDetails();
  };

  ErrorDialog.prototype._appendDetails = function() {
    $('.dialog').append(
      '<div>'+
      'Your browser doesn\'t support microphone input. Please switch to a browser which does.'+
      '</div>'
    );
  };

  window.ErrorDialog = ErrorDialog;
})();
