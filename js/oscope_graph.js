(function() {
var OScopeGraph = function(analyser, opts) {
  this.analyser = analyser;
  this._MINVAL = 134;  // 128 == zero.  _MINVAL is the "minimum detected signal" level to trigger off of.

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

  if (opts.container) {
    opts.container.appendChild( canvas );
  } else {
    document.body.appendChild( canvas );
  }

  this.drawStyle = opts.drawStyle || 'scope'; // Other valid options: 'frequency'

  this._drawGrid();
};

OScopeGraph.prototype.draw = function(data, offset) {
    this._drawGrid();

    this._ctx.strokeStyle = "white";

    if (this.drawStyle === 'scope') {
      this.analyser.getByteTimeDomainData(this._data);

      zeroCross = this._findFirstPositiveZeroCrossing(this._data, this.width);
      if (zeroCross===0) zeroCross=1;

      this._drawScope(this._data, zeroCross);
    } else {
      this.analyser.getByteFrequencyData(this._data);
      this._drawFrequency(this._data);
    }
  };

OScopeGraph.prototype._drawGrid = function() {
  this._ctx.strokeStyle = "red";
  this._ctx.lineWidth = 1;

  this._ctx.clearRect(0,0,this.width,this.height);
  this._ctx.beginPath();
  this._ctx.moveTo(0,0);
  this._ctx.lineTo(this.width,0);
  this._ctx.stroke();
  this._ctx.moveTo(0,this.height);
  this._ctx.lineTo(this.width,this.height);
  this._ctx.stroke();

  if (this.drawStyle === 'scope') {
    this._drawOscopeGrid();
  } else {
    this._drawFrequencyGrid();
  }
};

OScopeGraph.prototype._drawOscopeGrid = function() {
  this._ctx.save();
  this._ctx.strokeStyle = "#006644";
  this._ctx.beginPath();
  if (this._ctx.setLineDash)
    this._ctx.setLineDash([5]);
  this._ctx.moveTo(0,this.height/4);
  this._ctx.lineTo(this.width,this.height/4);
  this._ctx.stroke();
  this._ctx.moveTo(0,this.height*3/4);
  this._ctx.lineTo(this.width,this.height*3/4);
  this._ctx.stroke();

  this._ctx.restore();
  this._ctx.beginPath();
  this._ctx.strokeStyle = "blue";
  this._ctx.moveTo(0,this.height/2);
  this._ctx.lineTo(this.width,this.height/2);
  this._ctx.stroke();
};

OScopeGraph.prototype._drawFrequencyGrid = function() {
};

// data is an array of values from 0-255.
// scale them such that 128 gets drawn at the vertical center.
OScopeGraph.prototype._drawScope = function _drawScope(data, offset) {
  this._ctx.beginPath();

  for (var i=offset, j=0; i<this.width; i++, j++) {
    if (j === 0) {
      this._ctx.moveTo(0,this.height-(data[i]*this._internalScale*this.scale));
    }
    this._ctx.lineTo(j,this.height-(data[i]*this._internalScale*this.scale));
  }

  this._ctx.stroke();
};

OScopeGraph.prototype._drawFrequency = function(data) {
  this._ctx.beginPath();

  for (var i=0; i<this.width; i++) {
    this._ctx.moveTo(i,this.height);
    this._ctx.lineTo(i,this.height-data[i]);
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

window.OScopeGraph = OScopeGraph;
})();
