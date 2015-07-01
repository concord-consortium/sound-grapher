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

    if (opts.container) {
      opts.container.appendChild( canvas );
    } else {
      document.body.appendChild( canvas );
    }

    this.drawGrid();
    return canvas;
  };

  this.drawGrid = function drawGrid() {
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

  this.draw = function draw(data, offset) {
    this.drawGrid();

    ctx.strokeStyle = "white";

    ctx.beginPath();
    ctx.moveTo(0,this.height-data[0]);

    for (var i=offset, j=0; j<(this.width-offset); i++, j++)
      ctx.lineTo(j,this.height-data[i]);

    ctx.stroke();
  };

}
