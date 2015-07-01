(function() {
  window.SoundGrapherManager = machina.Fsm.extend({
    _WIDTH: 512,
    _HEIGHT: 224,
    _MINVAL: 134,  // 128 == zero.  _MINVAL is the "minimum detected signal" level to trigger off of.
    _audioContext: null,
    _userMedia: null,
    _analyser: null,
    _topGraph: null,
    _bottomGraph: null,
    _data: null,
    _freqs: null,
    _freqBytes: null,

    initialize: function() {
      this._data = new Uint8Array(this._WIDTH);
      this._freqs = new Float32Array(64);
      this._freqBytes = new Uint8Array(64);
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
          });
        },
        setupStream: function() {
          var input = this._audioContext.createMediaStreamSource(this._userMedia);
          this._analyser = this._audioContext.createAnalyser();
          this._analyser.fftSize = 4096;
          this._analyser.minDecibels = -80;
          this._analyser.maxDecibels = -10;
          input.connect(this._analyser);

          console.log("Sample rate: " + this._audioContext.sampleRate);
          console.log("Max frequency display: " + (this._WIDTH*this._audioContext.sampleRate/this._analyser.fftSize));

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
        },
        setupGraphs: function() {
          this._topGraph = new OScopeGraph();
          this._topGraph.setup({container: $('.top .graph')[0], width: this._WIDTH, height: this._HEIGHT, drawStyle: 'scope'});
          this._bottomGraph = new OScopeGraph();
          this._bottomGraph.setup({container: $('.bottom .graph')[0], width: this._WIDTH, height: this._HEIGHT, drawStyle: 'scope'});
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
                  if (this._collectingGraph.drawStyle === 'scope') {
                    this._analyser.getByteTimeDomainData(this._data);

                    zeroCross = this._findFirstPositiveZeroCrossing(this._data, this._WIDTH);
                    if (zeroCross===0) zeroCross=1;
                    this._collectingGraph.draw(this._data, zeroCross);
                  } else {
                    this._analyser.getByteFrequencyData(this._data);
                    this._collectingGraph.draw(this._data);
                  }
                }
                rafID = requestAnimFrame( update );
              }.bind(this);
          update();
        }
      },
      error: {
        _onEnter: function() {
          setTimeout(function() { alert('Unable to connect to audio input!'); }, 1);
        }
      },
      notListening: {
        _onEnter: function() {
          this._collectingGraph = null;
          $('.start').prop('disabled',false).text('Record');
        },
        topClick: function() {
          this.transition('topListening');
        },
        bottomClick: function() {
          this.transition('bottomListening');
        },
        displayStyle: function(graph, style) {
          graph.drawStyle = style;
          graph.draw([], 0);
        }
      },
      topListening: {
        _onEnter: function() {
          this._collectingGraph = this._topGraph;
          $('.top .start').prop('disabled',false).text('Stop');
          $('.bottom .start').prop('disabled',true);
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
    },

    _findFirstPositiveZeroCrossing: function(buf, buflen) {
      var i = 0;
      var last_zero = -1;
      var t;

      // advance until we're zero or negative
      while (i<buflen && (buf[i] > 128 ) )
        i++;

      if (i>=buflen)
        return 0;

      // advance until we're above _MINVAL, keeping track of last zero.
      while (i<buflen && ((t=buf[i]) < this._MINVAL )) {
        if (t >= 128) {
          if (last_zero == -1)
            last_zero = i;
        } else
          last_zero = -1;
        i++;
      }

      // we may have jumped over _MINVAL in one sample.
      if (last_zero == -1)
        last_zero = i;

      if (i==buflen)  // We didn't find any positive zero crossings
        return 0;

      // The first sample might be a zero.  If so, return it.
      if (last_zero === 0)
        return 0;

      return last_zero;
    }
  });

})();
