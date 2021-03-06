(function() {
var OScopeGraph = function(audioContext, audioInput, opts) {
  this.analyser = this._createAnalyser(audioContext, audioInput);
  this._MINVAL = 134;  // 128 == zero.  _MINVAL is the "minimum detected signal" level to trigger off of.
  this._previous = {};
  this.triggering = opts.triggering === false ? false : true;

  var canvas = document.createElement( 'canvas' );
  canvas.className = 'oscope';
  canvas.width = opts.width || 512;
  canvas.height = opts.height || 256;
  this.width = canvas.width;
  this.height = canvas.height;
  this._ctx = canvas.getContext( '2d' );

  this._internalScale = this.height/256;  // scaling factor so that points are drawn at the vertical center
  this.scale = opts.scale || 1;

  this._data = new Uint8Array(canvas.width);
  this._xStep = 1;
  this._frequencyBinWidth = this.analyser.context.sampleRate/this.analyser.fftSize;

  if (opts.container) {
    opts.container.appendChild( canvas );
  } else {
    document.body.appendChild( canvas );
  }

  this._drawStyle = opts.drawStyle || 'scope'; // Other valid options: 'frequency'

  this._drawGrid();
};

// Some getter/setters for values that make changes to the analyser
// Frequency view width is width in Hertz to display
Object.defineProperty(OScopeGraph.prototype, 'frequencyViewWidth', {
  get: function() {
    return (this._data.length*this._frequencyBinWidth);
  },

  set: function(widthHz) {
    // reset the goal data size
    var len = Math.ceil(widthHz / this._frequencyBinWidth),
        xStep = this.width / len;
    if (this._drawStyle === 'frequency') {
      this._data = new Uint8Array(len);
      this._xStep = xStep;
      this._drawGrid();
    } else {
      this._previous.frequency = {
        len: len,
        xStep: xStep
      };
    }
  }
});

// Scope view width is width in milliseconds to display
Object.defineProperty(OScopeGraph.prototype, 'scopeViewWidth', {
  get: function() {
    return (1/this.analyser.context.sampleRate)*this._data.length*1000;
  },

  set: function(widthMs) {
    // reset the goal data size
    var len = Math.ceil((widthMs/1000) / (1/this.analyser.context.sampleRate)),
        xStep = this.width / len;
    if (this._drawStyle === 'scope') {
      this._data = new Uint8Array(len);
      this._xStep = xStep;
      // reset the fftSize so that we only collect as many samples as we need.
      this.analyser.fftSize = this._findOptimalFftSize(len);
      this._drawGrid();
    } else {
      this._previous.scope = {
        len: len,
        xStep: xStep
      };
    }
  }
});

// Set the graph style: scope or frequency
Object.defineProperty(OScopeGraph.prototype, 'drawStyle', {
  get: function() {
    return this._drawStyle;
  },

  set: function(style) {
    if (this._drawStyle !== style) {
      // Store the previous data length so we can restore it when we switch back
      this._previous[this._drawStyle] = {
        len: this._data.length,
        xStep: this._xStep
      };

      this._drawStyle = style;

      if (this._previous[style]) {
        var s = this._previous[style];
        this._data = new Uint8Array(s.len);
        this._xStep = s.xStep;
      }

      if (style === 'scope') {
        this.analyser.fftSize = this._findOptimalFftSize(this._data.length);
      } else {
        this.analyser.fftSize = 4096;
      }
      this._drawGrid();
    }
  }
});

OScopeGraph.prototype.draw = function() {
    this._drawGrid();

    this._ctx.strokeStyle = "white";

    if (this.drawStyle === 'scope') {
      this.analyser.getByteTimeDomainData(this._data);

      var zeroCross = this.triggering ? this._findFirstPositiveZeroCrossing(this._data, this.width) : 1;
      if (zeroCross===0) zeroCross=1;

      this._drawScope(this._data, zeroCross);
    } else {
      this.analyser.getByteFrequencyData(this._data);
      this._drawFrequency(this._data);
    }
  };

OScopeGraph.prototype._drawGrid = function() {
  this._ctx.lineWidth = 1;

  this._ctx.clearRect(0,0,this.width,this.height);

  if (this.drawStyle === 'scope') {
    this._drawOscopeGrid();
  } else {
    this._drawFrequencyGrid();
  }
};

OScopeGraph.prototype._drawOscopeGrid = function() {
  this._ctx.save();

  // horizontal lines at +50% and -50% amplitude
  this._ctx.strokeStyle = "#999999";
  this._ctx.beginPath();
  if (this._ctx.setLineDash)
    this._ctx.setLineDash([5]);
  this._ctx.moveTo(0,this.height/4);
  this._ctx.lineTo(this.width,this.height/4);
  this._ctx.stroke();
  this._ctx.moveTo(0,this.height*3/4);
  this._ctx.lineTo(this.width,this.height*3/4);
  this._ctx.stroke();

  // center horizontal line
  this._ctx.restore();
  this._ctx.beginPath();
  this._ctx.strokeStyle = "blue";
  this._ctx.moveTo(0,this.height/2);
  this._ctx.lineTo(this.width,this.height/2);
  this._ctx.stroke();

  // vertical lines and labels
  this._ctx.strokeStyle = "#999999";
  var pxPerMs = this.width / this.scopeViewWidth,
      msPerLine = Math.round(this.scopeViewWidth / 6),
      i = 1, dx = 0;
  for (dx = 0, i = 1; dx < this.width; i++) {
    this._ctx.beginPath();
    dx = i*msPerLine*pxPerMs;
    this._ctx.moveTo(dx,0);
    this._ctx.lineTo(dx,this.height);
    this._ctx.stroke();
    this._ctx.strokeText(""+Math.round(msPerLine*i)+" ms", dx + 5,this.height/2-5);
  }
};

OScopeGraph.prototype._drawFrequencyGrid = function() {
  // vertical lines and labels
  this._ctx.strokeStyle = "#999999";
  var correctedFrequencyViewWidth = Math.floor(this.frequencyViewWidth / 1000)*1000,
      pxPerHz = this.width / this.frequencyViewWidth,
      hzPerLine = Math.round(correctedFrequencyViewWidth / 8),
      i = 1,
      dx = 0;
  for (dx = 0, i = 1; dx < this.width; i++) {
    this._ctx.beginPath();
    dx = i*hzPerLine*pxPerHz;
    this._ctx.moveTo(dx,0);
    this._ctx.lineTo(dx,this.height);
    this._ctx.stroke();
    this._ctx.strokeText(""+Math.round(hzPerLine*i)+" Hz", dx + 5,this.height/2-5);
  }
};

// data is an array of values from 0-255.
// scale them such that 128 gets drawn at the vertical center.
OScopeGraph.prototype._drawScope = function _drawScope(data, offset) {
  this._ctx.beginPath();

  for (var i=offset, j=0; i<data.length; i++, j++) {
    if (j === 0) {
      this._ctx.moveTo(0,this.height-(data[i]*this._internalScale*this.scale));
    } else {
      this._ctx.lineTo(j*this._xStep,this.height-(data[i]*this._internalScale*this.scale));
    }
  }

  this._ctx.stroke();
};

OScopeGraph.prototype._drawFrequency = function(data) {
  this._ctx.beginPath();

  for (var i=0, j=0; i<data.length; i++, j++) {
    if (j === 0) {
      this._ctx.moveTo(0,this.height-data[i]);
    } else {
      this._ctx.lineTo(j*this._xStep,this.height-data[i]);
    }
  }

  this._ctx.stroke();
};

OScopeGraph.prototype._findFirstPositiveZeroCrossing = function(buf, buflen) {
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
};

OScopeGraph.prototype._findOptimalFftSize = function(val) {
  var y = Math.floor(Math.log(val) / Math.log(2));
  return Math.pow(2, y + 1);
};

OScopeGraph.prototype._createAnalyser = function(audioContext, input) {
  var analyser = audioContext.createAnalyser();
  analyser.fftSize = 4096;
  analyser.minDecibels = -80;
  analyser.maxDecibels = -10;
  input.connect(analyser);

  return analyser;
};

window.OScopeGraph = OScopeGraph;
})();
