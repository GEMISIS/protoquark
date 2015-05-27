
var Vector3 = THREE.Vector3

function Stage2D(canvas, map) {
  this.map = map
  this.ctx = canvas.getContext("2d")
  this.canvas = canvas
  this.ctx.lineWidth = 3
}

Stage2D.prototype = {
clearScreen: function clearScreen() {
  this.ctx.fillStyle = "rgb(255, 0, 0)"
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
},

redraw: function redraw(selectedSections, mouseMoveCoords) {
  this.clearScreen()
  this.drawGrid()
  this.drawSections(selectedSections)
  this.drawCurrentPath(mouseMoveCoords)
},

drawGrid: function drawGrid() {
  var ctx = this.ctx
    , canvas = this.canvas
    , dim = {x: canvas.width, y: canvas.height}

  ctx.beginPath()
  ctx.moveTo(dim.x / 2, 0)
  ctx.lineTo(dim.x / 2, dim.y)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(0, dim.y / 2)
  ctx.lineTo(dim.x, dim.y / 2)
  ctx.stroke()
},

drawSections: function drawSections(selectedSections) {
  var ctx = this.ctx
    , sections = this.map.sections
  for (var i = 0; i < sections.length; i++) {
    var section = sections[i]
    ctx.fillStyle = "rgb(100, 100, 100)"
    this.drawPath(section.points)
    ctx.stroke()

    ctx.fillStyle = selectedSections.indexOf(section.id) > -1 ? "rgb(255, 128, 128)" : "rgb(170, 170, 170)"
    this.drawPath(section.points)
    ctx.fill()
    this.drawVertices(section.points)
  }
},

drawPath: function drawPath(points) {
  var ctx = this.ctx
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (var j = 1; j < points.length; j++) {
    ctx.lineTo(points[j].x, points[j].y)
  }
},

drawVertices: function drawVertices(points, thickness, color) {
  var ctx = this.ctx
  thickness = thickness || 6
  ctx.fillStyle = color || "rgb(50, 50, 50)"
  for (var i = 0; i < points.length; i++) {
    ctx.fillRect(points[i].x - thickness/2, points[i].y - thickness / 2, thickness, thickness)
  }
},

drawCurrentPath: function drawCurrentPath(cursor) {
  var points = this.map.points
    , ctx = this.ctx
  if (!points || !points.length) return

  ctx.beginPath()
  ctx.fillStyle = "rgb(0, 0, 0)"
  ctx.moveTo(points[0].x, points[0].y)
  for (var i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  if (cursor) ctx.lineTo(cursor.x, cursor.y)
  ctx.stroke()
  this.drawVertices(points, null, "rgb(0, 0, 0)")
},
}

module.exports = Stage2D
