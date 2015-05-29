var Map = require("./map")
var Stage2D = require("./stage2D")
var Stage3D = require("./stage3D")
var geometrybuilder = require("./geometrybuilder")
var Vector3 = THREE.Vector3
var downloadString = require("tm-components/download-string")

var keysUp = {
  87: function onStopMoving(e) {
    this.stage3D.stopMovingForward()
  },
  83: function onStopMoving(e) {
    this.stage3D.stopMovingForward()
  },
  65: function(e) {
    this.stage3D.stopStrafing()
  },
  68: function(e) {
    this.stage3D.stopStrafing()
  },
  16: function onShift(e) {
    this.multiSelect = false
  }
}

var keysDown = {
  90: function onUndoLastPoint() {
    this.undoLastPoint()
  },
  88: function onDeleteSection(e) {
    var section = this.map.findSection(this.selectedSections[0])
    if (section && this.map.deleteSection(section)) {
      this.redraw2D()
      this.rebuild3DWorld()
    }
  },
  87: function onUp(e) {
    this.stage3D.startMovingForward(10)
  },
  83: function onDown(e) {
    this.stage3D.startMovingForward(-10)
  },
  65: function onLeft(e) {
    this.stage3D.startStrafing(-10)
  },
  68: function onRight(e) {
    this.stage3D.startStrafing(10)
  },
  86: function onSnapToVertex(e) {
    this.snapToVertex = !!!this.snapToVertex
    if (this.snapToVertex) this.snapToEdge = false
  },
  9: function onTab(e) {
    var mode = this.mode = this.mode === "2d" ? "3d" : "2d"
    if (this.mode === "2d") {
      this.canvas.style.display = "block"
      this.stage3D.renderer.domElement.style.display = "none"
    }
    else {
      this.stage3D.resetLastLook()
      this.canvas.style.display = "none"
      this.stage3D.renderer.domElement.style.display = "block"
    }
    e.preventDefault()
  },
  69: function onSnapToEdge(e) {
    this.snapToEdge = !!!this.snapToEdge
    if (this.snapToEdge) this.snapToVertex = false
  },
  16: function onShift(e) {
    this.multiSelect = true
  }
}

var colorInputs = [
  "ceilingColor",
  "ceilingWallColor",
  "wallColor",
  "floorColor",
  "floorWallColor"
]

var toggleInputs = [
  "wall",
  "floor",
  "ceiling"
]

function Editor(canvas) {
  this.map = new Map()
  this.stage2D = new Stage2D(canvas, this.map)
  this.stage3D = new Stage3D(canvas.width, canvas.height)
  this.canvas = canvas
  this.mode = "2d"
  this.snapCoords = true
  this.selectedSections = []
  this.mapOffsets = {x: 0, y: 0}

  this.map.on("sectionschanged", function() {this.rebuild3DWorld()}.bind(this))

  canvas.addEventListener("mousedown", onMouseDown.bind(this))
  canvas.addEventListener("mouseup", onMouseUp.bind(this))
  canvas.addEventListener("mousemove", onMouseMove.bind(this))
  canvas.addEventListener("contextmenu", function(e){e.preventDefault()})
  canvas.addEventListener("mousewheel", onMouseWheel.bind(this))

  this.stage3D.renderer.domElement.addEventListener("mousemove", onMouseMove.bind(this))
  this.stage3D.renderer.domElement.addEventListener("mousewheel", onMouseWheel.bind(this))
  this.stage3D.renderer.domElement.addEventListener("mousedown", onMouseDown.bind(this))
  this.stage3D.renderer.domElement.addEventListener("contextmenu", function(e){e.preventDefault()})

  window.addEventListener("keydown", onKeyDown.bind(this))
  window.addEventListener("keyup", onKeyUp.bind(this))
  window.addEventListener("mousewheel", onMouseWheel.bind(this))

  var floorInput = this.floorInput = document.getElementById("floor")
  floorInput.addEventListener("input", function() {
    var section = this.getSelectedSection()
    if (section) {
      section.floorHeight = parseFloat(floorInput.value)
      buildPolygons.call(this, {x: this.canvas.width, y: this.canvas.height})
    }
  }.bind(this))
  floorInput.disabled = true

  var ceilingInput = this.ceilingInput = document.getElementById("ceiling")
  ceilingInput.addEventListener("input", function() {
    var section = this.getSelectedSection()
    if (section) {
      section.ceilingHeight = parseFloat(ceilingInput.value)
      buildPolygons.call(this, {x: this.canvas.width, y: this.canvas.height})
    }
  }.bind(this))
  ceilingInput.disabled = true

  var self = this
  colorInputs.forEach(function(input) {
    self[input] = document.getElementById(input)
    self[input].addEventListener("input", function(e) {
      onMapPropertyChanged.call(self, input, convertColorStringToInt(self[input].value))
    }.bind(self))
  })

  toggleInputs.forEach(function(input) {
    self[input] = document.getElementById(input)
    self[input].addEventListener("change", function(e) {
      onMapPropertyChanged.call(self, input, self[input].value)
    }.bind(self))
  })

  document.getElementById("save").addEventListener("click", function(e) {
    downloadString("map.json", JSON.stringify(this.map.sections))
  }.bind(this))

  document.getElementById("export").addEventListener("click", function(e) {
    var exporter = new THREE.OBJExporter()
    downloadString("map.obj", exporter.parse(this.stage3D.mesh, this.stage3D.geometry.visibleVertices, this.stage3D.geometry.visibleFaces))
  }.bind(this))

  var fileInput = document.getElementById("file")
  fileInput.addEventListener("change", function(e) {
    var file = e.target.files[0]
      , reader = new FileReader();

    reader.onload = function(e) {
      this.map.setSections(JSON.parse(e.target.result))
      this.redraw2D()
      this.rebuild3DWorld()
    }.bind(this)

    reader.readAsText(file)
  }.bind(this))
}

Editor.prototype = {
  redraw2D: function redraw2D(mouseCoords) {
    this.stage2D.redraw(this.selectedSections, mouseCoords, this.mapOffsets)
  },
  rebuild3DWorld: function rebuild3DWorld() {
    this.surfaceList = geometrybuilder.buildWorldGeometry(this.map, this.stage3D.geometry, this.canvas.width, this.canvas.height)
    this.rebuild3DSelection()
  },
  rebuild3DSelection: function rebuild3DSelection() {
    var section = this.map.findSection(this.selectedSections[0])
    if (section) {
      geometrybuilder.buildSelectionGeometry(section, this.stage3D.selectionGeometry, this.ceilingSelection, this.canvas.width, this.canvas.height)
    }
  },
  snapMouseCoords: function snapMouseCoords(mouseCoords) {
    if (!this.snapCoords) return mouseCoords
    var snap = 8
    mouseCoords.x = Math.floor(mouseCoords.x / snap) * snap
    mouseCoords.y = Math.floor(mouseCoords.y / snap) * snap
    return mouseCoords
  },
  getPoint: function getPoint(evt) {
    if (this.snapToEdge)
      return this.map.getClosestOnEdge(this.getMouseCanvas(evt))
    else if (this.snapToVertex)
      return this.map.getClosestOnVertex(this.getMouseCanvas(evt))
    else
      return this.snapMouseCoords(this.getMouseCanvas(evt))
  },
  undoLastPoint: function undoLastPoint() {
    var points = this.map.points
    if (this.mode === "2d" && points.length > 0) {
      points.splice(points.length - 1, 1)
      this.redraw2D()
    }
  },
  scrollMap: function(mouseCoords) {
    if (!this.scrollCoords) {
      this.scrollCoords = mouseCoords
      return
    }
    var lastCoords = this.scrollCoords
      , newCoords = this.scrollCoords = mouseCoords
    this.mapOffsets.x += lastCoords.x - newCoords.x
    this.mapOffsets.y += lastCoords.y - newCoords.y
    this.mapOffsets.x = Math.max(0, this.mapOffsets.x)
    this.mapOffsets.y = Math.max(0, this.mapOffsets.y)
  },
  getMouseCanvas: function getMouseCanvas(evt, offset) {
    offset = offset || this.mapOffsets
    return computeMouseCoords(evt, this.canvas, offset)
  },
  getMouseRenderer: function getMouseRenderer(evt) {
    return computeMouseCoords(evt, this.stage3D.renderer.domElement, {x: 0, y:0})
  }
}

// ex. el.value === "#ff0000"
// convertColorStringToInt(el.value)
function convertColorStringToInt(value) {
  return parseInt(value.substring(1), 16)
}

function onMouseDown(evt) {
  if (evt.button === 0)
    onLeftMouseDown.call(this, evt)
  else if (evt.button === 2)
    onRightMouseDown.call(this, evt)
  else {
    this.scrollMap(this.getMouseCanvas(evt, {x: 0, y:0}))
  }
}

function onMouseUp(evt) {
  if (evt.button === 1) {
    this.scrollMap(this.getMouseCanvas(evt, {x: 0, y:0}))
    this.scrollCoords = null
    this.redraw2D()
  }
}

function onMapPropertyChanged(propName, value) {
  var items = !this.selectedSections.length ? [this.map] : this.map.sections.filter(function(section) {
    return this.selectedSections.indexOf(section.id) > -1
  }, this)

  for (var i = 0; i < items.length; i++) {
    items[i][propName] = value
  }
  if (this.selectedSections.length)
    this.rebuild3DWorld()
}

// Sync input element values
function onSectionsSelected() {
  var selections = this.selectedSections
    , section = this.map.findSection(selections[0])
    , map = this.map
  if (selections.length == 1 && section) {
    syncColorValues.call(this, section)
  }
  else if (selections.length >= 2) {

  }
  else if (!selections.length) {
    // Setting default.
    syncColorValues.call(this, map)
  }
}

function rgbIntToString(rgb) {
  // return "#" + padString(rgb >> 16, 2, "0") + padString((rgb >> 8) & 255, 2, "0") + padString(rgb & 255, 2, "0")
  return "#" + padString(rgb.toString(16), 6, "0")
}

function padString(str, min, pad) {
  while (str.length < min)
    str = pad + str
  return str
}

function syncColorValues(obj) {
  var self = this
  colorInputs.forEach(function(input) {
    self[input].value = rgbIntToString(obj[input])
  })
}

// Clear opposite action if active otherwise do right action
function onLeftMouseDown(evt) {
  if (this.mode !== "2d") return

  if (this.selectedSections.length > 0) {
    this.selectedSections = []
    onSectionsSelected.call(this)
  }
  else {
    this.map.addPoint(this.getPoint(evt))
  }
  this.redraw2D()
}

function onRightMouseDown(evt) {
  if (this.mode === "3d" && this.surfaceList) {
    var pickResult = this.surfaceList.pick(this.getMouseRenderer(evt), {x: this.canvas.width, y: this.canvas.height}, this.stage3D.camera)
      , section = this.map.findSection(pickResult.id)

    if (pickResult.pick && section) {
      this.selectedSections = [pickResult.id]
      this.ceilingSelection = pickResult.ceiling
    }
    else {
      this.selectedSections = []
      this.ceilingSelection = false
    }

    onSectionsSelected.call(this)
    this.rebuild3DSelection()
  }

  if (this.mode !== "2d") return
  if (this.map.points && this.map.points.length > 0) {
    this.map.points = []
  }
  else {
    var section = this.map.findSectionUnder(this.getMouseCanvas(evt))
    if (!section) return

    var index = this.selectedSections.indexOf(section.id)
    if (section && index === -1) {
      if (this.multiSelect) {
        // in 2d mode, we are always picking the floor and not the ceiling
        this.ceilingSelection = false
        this.selectedSections.push(section.id)
      }
      else
        this.selectedSections[0] = section.id
    }
    else if (section)
      this.selectedSections.splice(index, 1)

    if (section) {
      onSectionsSelected.call(this)
    }
  }
  this.redraw2D()
}

function onMouseWheel(evt) {
  var section = this.map.findSection(this.selectedSections[0])
  if (!section) return
  evt.preventDefault()
  var delta = evt.wheelDelta
  if (this.ceilingSelection) {
    section.ceilingHeight += delta / 500
    this.ceilingInput.value = section.ceilingHeight
  }
  else {
    section.floorHeight += delta / 500
    this.floorInput.value = section.floorHeight
  }
  this.rebuild3DWorld()
}

function onMouseMove(evt) {
  if (this.scrollCoords) {
    // Dragging screen
    this.scrollMap(this.getMouseCanvas(evt, {x: 0, y:0}))
    this.redraw2D()
  }
  else if (this.mode === "2d") {
    this.lastCoords = this.getPoint(evt)
    this.redraw2D(this.lastCoords)
  }
  else {
    this.stage3D.look(this.getMouseRenderer(evt))
    this.stage3D.render()
  }
}

function onKeyDown(e) {
  if (keysDown[e.keyCode]) keysDown[e.keyCode].call(this, e)
}

function onKeyUp(e) {
  if (keysUp[e.keyCode]) keysUp[e.keyCode].call(this, e)
}

function computeMouseCoords(evt, element, offset) {
  offset = offset || {x: 0, y: 0}
  return new Vector3(evt.pageX - element.offsetLeft + offset.x, evt.pageY - element.offsetTop + offset.y, 0)
}

module.exports = Editor
