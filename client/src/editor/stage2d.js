var Vector3 = THREE.Vector3

function Stage2D(canvas, map) {
  this.map = map
  this.ctx = canvas.getContext("2d")
  this.canvas = canvas
  this.ctx.lineWidth = 3
}

Stage2D.prototype = {
clearScreen: function clearScreen() {
  this.ctx.fillStyle = "rgb(215, 215, 215)"
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
},

redraw: function redraw(selectedSections, selectedThing, selectedBlock, mouseMoveCoords, offset) {
  this.offset = offset || {x: 0, y: 0}
  this.clearScreen()
  this.drawGrid()

  this.drawSections(selectedSections)
  this.drawThings(selectedThing)
  this.drawBlocks(selectedBlock)

  this.drawCurrentPath(mouseMoveCoords, this.map.points)
  this.drawCurrentPath(mouseMoveCoords, this.map.blockPoints)
},

drawGrid: function drawGrid() {
  var ctx = this.ctx
    , canvas = this.canvas
    , dim = {x: canvas.width, y: canvas.height}
    , offset = this.offset
    , map = this.map
    , height = canvas.height * 4 // extend pass the screen for scrolling
    , width = canvas.width * 4
  ctx.fillStyle = "rgb(200, 200, 200)"
  ctx.lineWidth = 1

  // smaller lines
  var interval = map.pixelTolerance * 8
  for (var y = 0; y < height; y += interval) {
    ctx.beginPath()
    ctx.moveTo(0 - offset.x, y - offset.y)
    ctx.lineTo(width - offset.x, y - offset.y)
    ctx.stroke()
  }
  for (var x = 0; x < width; x += interval) {
    ctx.beginPath()
    ctx.moveTo(x - offset.x, 0 - offset.y)
    ctx.lineTo(x - offset.x, height - offset.y)
    ctx.stroke()
  }

  // main axis
  ctx.lineWidth = 4

  ctx.beginPath()
  ctx.moveTo(dim.x / 2 - offset.x, 0 - offset.y)
  ctx.lineTo(dim.x / 2 - offset.x, height - offset.y)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(0 - offset.x, dim.y / 2 - offset.y)
  ctx.lineTo(width - offset.x, dim.y / 2 - offset.y)
  ctx.stroke()
},

drawThings: function drawThings(selectedThing) {
  var ctx = this.ctx
    , things = this.map.things
    , thickness = 24
    , offset = this.offset

  ctx.font = "20px serif"
  ctx.textBaseline = "middle"
  ctx.textAlign = "center"

  for (var i = 0; i < things.length; i++) {
    var thing = things[i]
    ctx.fillStyle = thing == selectedThing ? "rgb(100, 100, 255)" : "rgb(255, 100, 100)"
    ctx.fillRect(thing.position.x - thickness/2 - offset.x, thing.position.y - thickness / 2 - offset.y, thickness, thickness)

    ctx.fillStyle = "rgb(0, 0, 0)"
    ctx.fillText(thing.type.substr(0, 1), thing.position.x - offset.x, thing.position.y - offset.y)
  }
},

drawSections: function drawSections(selectedSections) {
  var ctx = this.ctx
    , sections = this.map.sections
  ctx.lineWidth = 1
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

drawBlocks: function drawBlocks(selectedBlock) {
  var ctx = this.ctx
    , blocks = this.map.blocks
    , selectedId = selectedBlock ? selectedBlock.id : null
  ctx.lineWidth = 1
  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i]

    ctx.fillStyle = selectedId == block.id ? "rgb(128, 128, 255)" : "rgb(128, 255, 128)"
    this.drawPath(block.points)
    ctx.fill()

    ctx.fillStyle = "rgb(100, 100, 100)"
    this.drawPath(block.points)
    ctx.stroke()

    ctx.fillStyle = "rgb(128, 255, 128)"
    this.drawVertices(block.points)
  }
},

drawPath: function drawPath(points) {
  var ctx = this.ctx
    , offset = this.offset
  ctx.beginPath()
  ctx.moveTo(points[0].x - offset.x, points[0].y - offset.y)
  for (var j = 1; j < points.length; j++) {
    ctx.lineTo(points[j].x - offset.x, points[j].y - offset.y)
  }
},

drawVertices: function drawVertices(points, thickness, color) {
  for (var i = 0; i < points.length; i++) {
    this.drawVertex(points[i], thickness, color)
  }
},

drawVertex: function drawVertex(point, thickness, color) {
  var offset = this.offset
  thickness = thickness || 6
  this.ctx.fillStyle = color || "rgb(120, 120, 120)"
  this.ctx.fillRect(point.x - thickness/2 - offset.x, point.y - thickness / 2 - offset.y, thickness, thickness)
},

drawCurrentPath: function drawCurrentPath(cursor, points) {
    var ctx = this.ctx
    , offset = this.offset
    , points = points || []
    , firstPt = points.length > 0 ? points[0] : cursor
  if ((!points || !points.length) && !cursor) return

  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.fillStyle = "rgb(0, 0, 0)"

  ctx.moveTo(firstPt.x - offset.x, firstPt.y - offset.y)
  for (var i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x - offset.x, points[i].y - offset.y)
  }
  if (cursor) ctx.lineTo(cursor.x - offset.x, cursor.y - offset.y)
  ctx.stroke()

  this.drawVertices(points, null, "rgb(0, 0, 0)")
  if (cursor) this.drawVertex(cursor, null, "rgb(0, 0, 0)")
},
}

module.exports = Stage2D
