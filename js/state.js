(function() {
  window.SoundGrapherManager = machina.Fsm.extend({
    _WIDTH: 512,
    _HEIGHT: 224,

    _audioContext: null,
    _userMedia: null,
    _audioInput: null,

    _topGraph: null,
    _bottomGraph: null,

    initialize: function() {
    },

    initialState: 'initializeAudio',
    states: {
      initializeAudio: {
        _onEnter: function() {
          this.handle('setupAudio');
        },
        setupAudio: function() {
          window.AudioContext = window.AudioContext || window.webkitAudioContext;
          this._audioContext = new window.AudioContext();

          if (!navigator.getUserMedia) {
              navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
          }

          if (!navigator.getUserMedia) {
            this.transition('error');
            return;
          }

          navigator.getUserMedia({audio:true}, function(stream) {
            this._userMedia = stream;
            this.handle('setupStream');
          }.bind(this), function(e) {
            console.log(e);
            this.transition('error');
          }.bind(this));
        },
        setupStream: function() {
          this._audioInput = this._audioContext.createMediaStreamSource(this._userMedia);

          console.log("Sample rate: " + this._audioContext.sampleRate);

          this.transition('initializeApp');
        }
      },
      initializeApp: {
        _onEnter: function() {
          this.handle('setupListeners');
          this.handle('setupGraphs');
          this.handle('setupLoop');

          this.transition('notListening');
        },
        setupListeners: function() {
          var fsm = this;
          $('.top .start').click(function() {
            fsm.handle('topClick');
          });

          $('.bottom .start').click(function() {
            fsm.handle('bottomClick');
          });

          $('.top .display-style').change(function() {
            fsm.handle('displayStyle', fsm._topGraph, $(this).val());
          });

          $('.bottom .display-style').change(function() {
            fsm.handle('displayStyle', fsm._bottomGraph, $(this).val());
          });

          $('.top .settings').click(function() {
            fsm.handle('settings', fsm._topGraph);
          });

          $('.bottom .settings').click(function() {
            fsm.handle('settings', fsm._bottomGraph);
          });
        },
        setupGraphs: function() {
          this._topGraph    = new OScopeGraph(this._audioContext, this._audioInput, {container: $('.top .graph')[0],    width: this._WIDTH, height: this._HEIGHT, drawStyle: 'scope'});
          this._bottomGraph = new OScopeGraph(this._audioContext, this._audioInput, {container: $('.bottom .graph')[0], width: this._WIDTH, height: this._HEIGHT, drawStyle: 'scope'});

          this._topGraph.scopeViewWidth = 30;
          this._topGraph.frequencyViewWidth = 2000;

          this._bottomGraph.scopeViewWidth = 30;
          this._bottomGraph.frequencyViewWidth = 2000;
        },
        setupLoop: function() {
          // The main repeating loop which processes the incoming data and draws it on the oscilloscope
          var frameNumber = 0,
              rafID, zeroCross,
              update = function() {
                // skip the first 10 frames because the microphone appears to take
                // some time to warm up or something
                frameNumber++;
                if(frameNumber >= 10 && this._collectingGraph){
                  this._collectingGraph.draw();
                }
                rafID = requestAnimFrame( update );
              }.bind(this);
          update();
        }
      },
      error: {
        _onEnter: function() {
          setTimeout(function() { alert('Unable to connect to audio input!'); }, 1); // TODO Make this message more user-friendly.
        }
      },
      notListening: {
        _onEnter: function() {
          this._collectingGraph = null;
          $('.start').prop('disabled',false).text('Record');
          $('.settings').prop('disabled',false);
        },
        topClick: function() {
          this.transition('topListening');
        },
        bottomClick: function() {
          this.transition('bottomListening');
        },
        displayStyle: function(graph, style) {
          graph.drawStyle = style;
        },
        settings: function(graph) {
          new SettingsDialog(graph);
        }
      },
      topListening: {
        _onEnter: function() {
          this._collectingGraph = this._topGraph;
          $('.top .start').prop('disabled',false).text('Stop');
          $('.bottom .start').prop('disabled',true);
          $('.settings').prop('disabled',true);
        },
        topClick: function() {
          this.transition('notListening');
        },
        bottomClick: function() {
          // Shouldn't happen, but just in case...
          this.transition('bottomListening');
        },
        displayStyle: function(graph, style) {
          graph.drawStyle = style;
        }
      },
      bottomListening: {
        _onEnter: function() {
          this._collectingGraph = this._bottomGraph;
          $('.top .start').prop('disabled',true);
          $('.bottom .start').prop('disabled',false).text('Stop');
          $('.settings').prop('disabled',true);
        },
        topClick: function() {
          // Shouldn't happen, but just in case...
          this.transition('topListening');
        },
        bottomClick: function() {
          this.transition('notListening');
        },
        displayStyle: function(graph, style) {
          graph.drawStyle = style;
        }
      }
    }
  });

})();
