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
    var message, alternatives;
    if (bowser.msie) {
      message = "The sound grapher will not work in Internet Explorer at this time.";
      alternatives = "Please try this in Chrome or Firefox.";
    } else if (bowser.safari) {
      message = "The sound grapher will not work in Safari at this time.";
      alternatives = "Please try this in Chrome or Firefox.";
    } else if (bowser.ios) {
      var device = bowser.iphone ? 'the iPhone' : (bowser.ipad ? "the iPad" : "iOS");
      message = "The sound grapher will not work on " + device + " at this time.";
      alternatives = "Please try this in Chrome or Firefox on a desktop or laptop.";
    } else if (bowser.chrome || bowser.firefox) {
      message = "The sound grapher will not work without microphone input.";
      alternatives = "Please click 'Allow' in the microphone settings to enable microphone access for this site.";
    } else if (bowser.android) {
      message = "The sound grapher will not work in the Android browser at this time.";
      alternatives = "Please try this in Chrome for Android, or in Chrome or Firefox on a desktop or laptop.";
    } else {
      message = "The sound grapher will not work in your browser at this time.";
      alternatives = "Please try this in Chrome or Firefox on a desktop or laptop.";
    }

    $('.dialog').append(
      '<div>'+message+'</div>'+
      '<div>'+alternatives+'</div>'
    );
  };

  window.ErrorDialog = ErrorDialog;
})();
