(function() {
  var SettingsDialog = function(oscope_graph) {
    this.graph = oscope_graph;

    this._createDialog();
  };

  SettingsDialog.prototype._createDialog = function() {
    $(document.body).append('<div class="backdrop">'+
    '  <div class="dialog">'+
    '    <div class="close"></div>'+
    '  </div>'+
    '</div>');

    if (this.graph.drawStyle === 'scope') {
      this._appendTimeAxis();
      this._appendTriggering();
    } else {
      this._appendFrequencyAxis();
    }

    $('.dialog .close').click(function() {
      $('.backdrop').remove();
    });
  };

  SettingsDialog.prototype._appendTimeAxis = function() {
    $('.dialog').append(
      '<fieldset>'+
      '  <legend>Time axis</legend>'+
      '  <select class="time-axis">'+
      '    <option value="10">10 ms</option>'+
      '    <option value="30">30 ms</option>'+
      '    <option value="60">60 ms</option>'+
      '    <option value="100">100 ms</option>'+
      '  </select>'+
      '</fieldset>'
    );

    var dialog = this;
    $('.dialog .time-axis').change(function() {
      dialog.graph.scopeViewWidth = $(this).val();
    });

    $('.dialog .time-axis').val(dialog.graph.scopeViewWidth);
  };

  SettingsDialog.prototype._appendFrequencyAxis = function() {
    $('.dialog').append(
      '<fieldset>'+
      '  <legend>Frequency axis</legend>'+
      '  <select class="frequency-axis">'+
      '    <option value="1000">1000 Hz</option>'+
      '    <option value="2000">2000 Hz</option>'+
      '    <option value="4000">4000 Hz</option>'+
      '    <option value="8000">8000 Hz</option>'+
      '  </select>'+
      '</fieldset>'
    );

    var dialog = this;
    $('.dialog .frequency-axis').change(function() {
      dialog.graph.frequencyViewWidth = $(this).val();
    });

    $('.dialog .frequency-axis').val(Math.floor(dialog.graph.frequencyViewWidth / 1000)*1000);
  };

  SettingsDialog.prototype._appendTriggering = function() {
    $('.dialog').append(
      '<fieldset>'+
      '  <legend>Triggering</legend>'+
      '  <input type="checkbox" class="triggering" /> On'+
      '  <div class="triggering-sensitivity"></div>'+
      '</fieldset>'
    );

    var dialog = this;
    $('.triggering').click(function() {
      dialog.graph.triggering = this.checked;
    });
    $('.triggering').prop('checked', this.graph.triggering);

    var triggerSensitivityScrubber = new ScrubberView();
    $('.triggering-sensitivity').append(triggerSensitivityScrubber.elt);
    triggerSensitivityScrubber.onValueChanged(function(value) {
      this.graph._MINVAL = 128 - value;
    }.bind(this));

    triggerSensitivityScrubber.min(-10).max(0).step(1).value(-6).orientation('horizontal');
  };

  window.SettingsDialog = SettingsDialog;
})();
