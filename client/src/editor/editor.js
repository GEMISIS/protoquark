var Map = require("./map")
var Stage2D = require("./stage2D")
var Stage3D = require("./stage3D")
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
  }
}

var keysDown = {
  90: function onUndoLastPoint() {
    var points = this.map.points
    if (this.mode === "2d" && points.length > 0) {
      points.splice(points.length - 1, 1)
      this.redraw2D()
    }
  },
  88: function onDeleteSection(e) {
    var section = this.map.findSection(this.selectedSections[0])
    if (section && this.map.deleteSection(section)) {
      this.redraw2D()
      this.rebuild3D()
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
  86: function(e) {
    this.snapCoords = !!!this.snapCoords
  },
  9: function onTab(e) {
    var mode = this.mode = this.mode === "2d" ? "3d" : "2d"
    if (this.mode === "2d") {
      this.canvas.style.display = "block"
      this.stage3D.renderer.domElement.style.display = "none"
    }
    else {
      this.canvas.style.display = "none"
      this.stage3D.renderer.domElement.style.display = "block"
    }
    e.preventDefault()
  }
}

// mode handlers for mouse events
var handlers = {
mousedown: {
  section: function(e) {
    var section = this.findSectionUnder(computeMouseCoords(e, this.canvas))
    if (e.button === 0) {
      if (section && this.selectedSections.indexOf(section.id) == -1) {
        this.selectedSections.push(section.id)
        this.redraw2D()
      }
    }
    else {
      var index = section ? this.selectedSections.indexOf(section.id) : -1
      if (section && index > -1) {
        this.selectedSections.splice(index, 1)
        this.redraw()
      }
    }

    section = this.selectedSections.length == 1 ? section : null
    this.floorInput.value = section ? section.floorHeight : 0
    this.ceilingInput.value = section ? section.ceilingHeight : 0
    this.ceilingInput.disabled = this.floorInput.disabled = !!!section
  },
},
}

function Editor(canvas) {
  this.map = new Map()
  this.stage2D = new Stage2D(canvas, this.map)
  this.stage3D = new Stage3D(canvas.width, canvas.height)
  this.canvas = canvas
  this.mode = "2d"
  this.snapCoords = true
  this.selectedSections = []

  this.map.on("sectionschanged", function() {this.rebuild3D()}.bind(this))

  canvas.addEventListener("mousedown", onMouseDown.bind(this))
  canvas.addEventListener("mousemove", onMouseMove.bind(this))
  canvas.addEventListener("mousewheel", onMouseWheel.bind(this))
  canvas.addEventListener("contextmenu", function(e){e.preventDefault()})

  this.stage3D.renderer.domElement.addEventListener("mousemove", onMouseMove.bind(this))
  window.addEventListener("keydown", onKeyDown.bind(this))
  window.addEventListener("keyup", onKeyUp.bind(this))

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

  var saveInput = this.saveInput = document.getElementById("save")
  saveInput.addEventListener("click", function(e) {
    downloadString("map.json", JSON.stringify(this.map.sections))
  }.bind(this))

  // http://www.html5rocks.com/en/tutorials/file/dndfiles/
  var fileInput = document.getElementById("file")
  fileInput.addEventListener("change", function(e) {
    var files = e.target.files // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {
      var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = function(e) {
        this.map.setSections(JSON.parse(e.target.result))
        this.redraw2D()
        this.rebuild3D()
      }.bind(this)

      reader.readAsText(f)
    }
  }.bind(this))
}

Editor.prototype = {
  redraw2D: function redraw2D(mouseCoords) {
    this.stage2D.redraw(this.selectedSections, mouseCoords)
  },
  rebuild3D: function rebuild3D() {
    this.stage3D.buildPolygons(this.map.sections)
  },
  snapMouseCoords: function snapMouseCoords(mouseCoords) {
    if (!this.snapCoords) return mouseCoords
    var snap = 8
    mouseCoords.x = Math.floor(mouseCoords.x / snap) * snap
    mouseCoords.y = Math.floor(mouseCoords.y / snap) * snap
    return mouseCoords
  }
}

// ex. el.value === "#ff0000"
// convertColorStringToInt(el.value)
function convertColorStringToInt(value) {
  return parseInt(value.substring(1), 16)
}

function onMouseDown(evt) {
  if (this.mode !== "2d") return

  if (evt.button === 0)
    onLeftMouseDown.call(this, evt)
  else
    onRightMouseDown.call(this, evt)
}

// Clear opposite action if active otherwise do right action
function onLeftMouseDown(evt) {
  if (this.selectedSections.length > 0)
    this.selectedSections = []
  else
    this.map.addPoint(this.snapMouseCoords(computeMouseCoords(evt, this.canvas)))
  this.redraw2D()
}

function onRightMouseDown(evt) {
  if (this.mode !== "2d") return
  if (this.map.points && this.map.points.length > 0) {
    this.map.points = []
  }
  else {
    var section = this.map.findSectionUnder(computeMouseCoords(evt, this.canvas))
    if (!section) return

    var index = this.selectedSections.indexOf(section.id)
    if (section && index === -1)
      this.selectedSections.push(section.id)
    else if (section)
      this.selectedSections.splice(index, 1)
  }
  this.redraw2D()
}

function onMouseWheel(evt) {
  if (this.mode !== "2d") return
  var section = this.map.findSection(this.selectedSections[0])
  if (!section) return
  evt.preventDefault()
  var delta = evt.wheelDelta
  section.floorHeight += delta / 100
  this.floorInput.value = section.floorHeight
  this.rebuild3D()
}

function onMouseMove(evt) {
  if (this.mode === "2d") {
    this.lastCoords = this.snapMouseCoords(computeMouseCoords(evt, this.canvas))
    this.redraw2D(this.lastCoords)
  }
  else {
    this.stage3D.look(computeMouseCoords(evt, this.stage3D.renderer.domElement))
    this.stage3D.render()
  }
}

function onKeyDown(e) {
  if (keysDown[e.keyCode]) keysDown[e.keyCode].call(this, e)
}

function onKeyUp(e) {
  if (keysUp[e.keyCode]) keysUp[e.keyCode].call(this, e)
}

function computeMouseCoords(evt, element) {
  return new Vector3(evt.pageX - element.offsetLeft, evt.pageY - element.offsetTop, 0)
}

module.exports = Editor
