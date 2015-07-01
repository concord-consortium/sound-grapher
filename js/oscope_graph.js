function OScopeGraph(){
  var ctx;

  this.setup = function setup ( opts ) {
    var canvas = document.createElement( 'canvas' );
    canvas.className = 'oscope';
    canvas.width = opts.width || 512;
    canvas.height = opts.height || 256;
    this.width = canvas.width;
    this.height = canvas.height;
    ctx = canvas.getContext( '2d' );

    this.scale = this.height/256;  // scaling factor so that points are drawn at the vertical center

    if (opts.container) {
      opts.container.appendChild( canvas );
    } else {
      document.body.appendChild( canvas );
    }

    this.drawStyle = opts.drawStyle || 'scope'; // Other valid options: 'frequency'

    this._drawGrid();
    return canvas;
  };

  this.draw = function draw(data, offset) {
    this._drawGrid();

    ctx.strokeStyle = "white";

    if (this.drawStyle === 'scope') {
      this._drawScope(data, offset);
    } else {
      this._drawFrequency(data);
    }
  };

  this._drawGrid = function _drawGrid() {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;

    ctx.clearRect(0,0,this.width,this.height);
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(this.width,0);
    ctx.stroke();
    ctx.moveTo(0,this.height);
    ctx.lineTo(this.width,this.height);
    ctx.stroke();

    if (this.drawStyle === 'scope') {
      this._drawOscopeGrid();
    } else {
      this._drawFrequencyGrid();
    }
  };

  this._drawOscopeGrid = function _drawOscopeGrid() {
    ctx.save();
    ctx.strokeStyle = "#006644";
    ctx.beginPath();
    if (ctx.setLineDash)
      ctx.setLineDash([5]);
    ctx.moveTo(0,this.height/4);
    ctx.lineTo(this.width,this.height/4);
    ctx.stroke();
    ctx.moveTo(0,this.height*3/4);
    ctx.lineTo(this.width,this.height*3/4);
    ctx.stroke();

    ctx.restore();
    ctx.beginPath();
    ctx.strokeStyle = "blue";
    ctx.moveTo(0,this.height/2);
    ctx.lineTo(this.width,this.height/2);
    ctx.stroke();
  };

  this._drawFrequencyGrid = function _drawFrequencyGrid() {
  };

  // data is an array of values from 0-255.
  // scale them such that 128 gets drawn at the vertical center.
  this._drawScope = function _drawScope(data, offset) {
    ctx.beginPath();

    for (var i=offset, j=0; i<this.width; i++, j++) {
      if (j === 0) {
        ctx.moveTo(0,this.height-(data[i]*this.scale));
      }
      ctx.lineTo(j,this.height-(data[i]*this.scale));
    }

    ctx.stroke();
  };

  this._drawFrequency = function _drawFrequency(data) {
    ctx.beginPath();

    for (var i=0; i<this.width; i++) {
      ctx.moveTo(i,this.height);
      ctx.lineTo(i,this.height-data[i]);
    }

    ctx.stroke();
  };

}
