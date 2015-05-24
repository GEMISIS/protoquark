// line can 'shared' or not. If shared, then it doesnt show a 'regular' wall and only shows walls if floor height and ceil height are appropriate
// floor and ceil walls are always facing out and have top and bottom texture
// ex. top
//   __|___
//   |     |
//  -|     |
//   ------
// vertices assumed ccw and convex

// When adding new section,
// - check all edges of new section against all other section edges (check edge group if already includes sector and if so dont split)
// - if shared / colinear, then the there are 3 cases in below example of where splits can occur.
//   will be split into more points. And the shared edge will have multiple owners (each edge
//   contains an object mapping of owners)
// - ex. In this case A and B both share an edge.
// - A will have to be split from 4 points to 6, and edge will
//
// * when deleting sector, must go thru edges of all other sectors and remove sector from edge share list
// * if sector completely inside another, middle walls wont be drawn.
// * during splitting process, each sector may have a new edge / edges and both these edges should be marked
// as shared by more than 1 sector.
// In ex 2
// Adding B
// Legend:
// a - A's original points
// b - B's original points
// a____a
// |    |b____b
// | A  |  B  |
// |    |b----b
// |____|
// a    a
//
// ex 2.
//  ____
// |    |
// | A  |
// |    |----
// |____|  B |
//      |____|
//
// ex 3
//       ____
//      |    |
//  ____|  B |
// |    |----
// | A  |
// |    |
// |____|
//

// var earcut = require("mapbox/earcut")

var Vector3 = THREE.Vector3
var Matrix4 = THREE.Matrix4
var Quaternion = THREE.Quaternion
var Triangle = THREE.Triangle
var Plane = THREE.Plane
var Triangle = THREE.Triangle

// points within pixelTolerance pixels of each other is considered colinear / near
var pixelTolerance = 4
var noFloorWallY = 0
var noCeilingWallY = 10

// MAX_VERTICES must be a multiple of 3
var MAX_VERTICES = 3000
var NUM_FACES = MAX_VERTICES / 3

var keys = {
  83: function onSection() {
    this.mode = "section"
  },

  76: function onLine() {
    this.mode = "line"
    this.selectedSections = []
  },

  86: function onVertex() {
    this.mode = "vertex"
  },

  88: function onDeleteSection(e) {
    // e.preventDefault()
    var section = this.getSelectedSection()
    if (section) {
      deleteSection.call(this, section)
      this.redraw()
      buildPolygons.call(this, {x: this.canvas.width, y: this.canvas.height})
    }
  },

  85: function onUpArrow(e) {
    this.camera.position.z -= 10 / 60
    this.render()
  },

  74: function onDownArrow(e) {
    this.camera.position.z += 10 / 60
    this.render()
  },

  72: function onLeftArrow(e) {
    this.camera.position.x -= 10 / 60
    this.render()
  },

  75: function onRightArrow(e) {
    this.camera.position.x += 10 / 60
    this.render()
  }
}

// mode handlers for mouse events
var handlers = {
mousedown: {
  section: function(e) {
    var section = this.findSection(computeMouseCoords(e, this.canvas))
    if (e.button === 0) {
      if (section && this.selectedSections.indexOf(section.id) == -1) {
        this.selectedSections.push(section.id)
        this.redraw()
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

  line: function(e) {
    if (e.button === 0) {
      var points = this.points = this.points || []
        , currentPt = computeMouseCoords(e, this.canvas)
        , firstPt = points[0]
        , completeLoop = points.length >= 3 && Math.abs(currentPt.x - firstPt.x) < 8 && Math.abs(currentPt.y - firstPt.y) < 8

      points.push(completeLoop ? firstPt.clone() : currentPt)

      var added = points[points.length - 1]
      console.log(added.x, added.y)

      if (completeLoop) {
        // Ended loop of section
        addSection.call(this, {
          id: this.nextSectorId++,
          points: points,
          floorHeight: 1,
          ceilingHeight: noCeilingWallY,
          floor: true,
          ceiling: true
        })
        buildPolygons.call(this, {x: this.canvas.width, y: this.canvas.height})
        this.render()
        this.points = null
      }
      // debugging
      else if (this.sections.length > 0) {
        console.log(isPointInside(added, this.sections[0]))
      }
    }
    else if (e.button === 2) {
      this.points = null
    }
    this.redraw()
  },

  vertex: function(e) {
    if (e.button === 0) {
      var pt = this.findClosestPoint(computeMouseCoords(e, this.canvas), pixelTolerance)
      if (pt) {
        this.selectedPoint = pt
      }
    }
  }
},

mousemove: {
  line: function(e) {
    var points = this.points
    if (!points || !points.length) return

    this.redraw(computeMouseCoords(e, this.canvas))
  },
  vertex: function(e) {
    var selectedPoint = this.selectedPoint = this.selectedPoint || {}
      , coords = computeMouseCoords(e, this.canvas)
    selectedPoint.point.x = coords.x
    selectedPoint.point.y = coords.y
  }
},

mouseup: {
  vertex: function(e) {
    this.selectedPoint = null
  }
}
}

function Editor(canvas, ctx) {
  this.ctx = ctx
  this.lines = []
  this.sections = []
  this.mode = "line"
  this.selectedSections = []
  this.nextSectorId = 1
  this.canvas = canvas
  ctx.lineWidth = 3

  this.geometry = new THREE.Geometry()

  for (var i = 0; i < MAX_VERTICES; i++) {
    this.geometry.vertices.push(new Vector3(0, 0, 0))
  }

  for (var i = 0; i < NUM_FACES; i++) {
    var vertIndex = i * 3
    this.geometry.faces.push(new THREE.Face3(vertIndex, vertIndex + 1, vertIndex + 2))
  }

  var self = this
  Object.keys(handlers).forEach(function(type) {
    canvas.addEventListener(type, onMouseEvent.bind(self))
  })

  window.addEventListener("keydown", onKeyDown.bind(this))
  canvas.addEventListener("contextmenu", function(e){e.preventDefault()})

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

  /// ============ ///
  var scene = this.scene = new THREE.Scene()
  var camera = this.camera = new THREE.PerspectiveCamera( 75, canvas.width / canvas.height, 0.01, 1000 )

  var renderer = this.renderer = new THREE.WebGLRenderer()
  renderer.setSize( canvas.width, canvas.height )
  document.body.appendChild( renderer.domElement )

  var geometry = new THREE.BoxGeometry( 1, 1, 1 )
  var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } )

  camera.position.x = 0
  camera.position.y = 2.5
  camera.position.z = 6
  // camera.lookAt(new Vector3(0, 0, 0))

  // this.mesh = new THREE.Mesh(this.geometry, new THREE.MeshBasicMaterial( { color: 0x999999 } ))
  this.mesh = new THREE.Mesh(this.geometry, new THREE.MeshPhongMaterial( { color: 0x999999, shading: THREE.FlatShading } ))
  scene.add(this.mesh)

  var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  directionalLight.position.set( .5, .707, .707 );
  scene.add( directionalLight );

  directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  directionalLight.position.set( -1, 1, .1 );
  scene.add( directionalLight );

  var render = this.render = function () {
    // requestAnimationFrame( render )

    renderer.render(scene, camera)
  }

  this.render()
}

Editor.prototype = {
  clearScr: function clearScr() {
    this.ctx.fillStyle = "rgb(255, 0, 0)"
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  },

  redraw: function redraw(mouseMoveCoords) {
    this.clearScr()
    this.drawGrid()
    this.drawSections()
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

  drawSections: function drawSections() {
    var ctx = this.ctx
      , sections = this.sections
    for (var i = 0; i < sections.length; i++) {
      var section = sections[i]
      ctx.fillStyle = this.selectedSections.indexOf(section.id) > -1 ? "rgb(255, 128, 128)" : "rgb(128, 128, 128)"
      this.drawPath(section.points)
      ctx.stroke()
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

  drawVertices: function drawVertices(points, thickness) {
    var ctx = this.ctx
    thickness = thickness || 8
    ctx.fillStyle = "rgb(0, 0, 0)"
    for (var i = 0; i < points.length; i++) {
      ctx.fillRect(points[i].x - thickness/2, points[i].y - thickness / 2, thickness, thickness)
    }
  },

  drawCurrentPath: function drawCurrentPath(cursor) {
    var points = this.points
      , ctx = this.ctx
    if (!points || !points.length) return

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (var i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    if (cursor) ctx.lineTo(cursor.x, cursor.y)
    ctx.stroke()
    this.drawVertices(points)
  },

  // find smallest area section underneath x, y
  findSection: function findSection(point) {
    var sections = this.sections
      , smallestArea = Number.POSITIVE_INFINITY
      , touchedSection
      , area
      , sectionIndex = 0
    for (var i = 0; i < sections.length; i++) {
      var section = sections[i]
      if (!isPointInside(point, section)) continue

      area = computeSectionArea(section)
      if (area < smallestArea) {
        touchedSection = section
        smallestArea = area
        sectionIndex = i
      }
    }

    return touchedSection
  },

  getSelectedSection: function getSelectedSection() {
    if (this.selectedSections.length == 0) return null
    var id = this.selectedSections[0]
    for (var i = 0; i < this.sections.length; i++)
      if (this.sections[i].id == id) return this.sections[i]
    return null
  },

  findClosestPoint: function findClosestPoint(x, y, tolerance) {
    var distance = Number.POSITIVE_INFINITY
      , closest = null
      , toleranceSq = tolerance * tolerance
      , sections = this.sections
    for (var i = 0; i < sections.length; i++) {
      var section = sections[i]
      for (var j = 0; j < section.length; j++) {
        var pt = section[j]
        var length = (pt.x - x) * (pt.x - x) + (pt.y - y) * (pt.y - y)
        if (length <= toleranceSq && length < distance) {
          distance = length
          closest = pt
        }
      }
    }
    return closest
  }
}

function onMouseEvent(evt) {
  var type = evt.type
  if (handlers[evt.type] && handlers[evt.type][this.mode])
    handlers[evt.type][this.mode].call(this, evt)
}

function onKeyDown(e) {
  if (keys[e.keyCode]) keys[e.keyCode].call(this)
}

function getEdgeIntersection(a, b, c, d) {
  var colinear = isNearColinear(a, b, c) && isNearColinear(a, b, d)
    , t0 = colinear ? getPointTIntersection(a, b, c) : 0
    , t1 = colinear ? getPointTIntersection(a, b, d) : 0
    , intersection = colinear && (
      (t0 === 0 && t1 > 0) ||
      (t0 === 1 && t1 < 1) ||
      (t1 === 0 && t0 > 0) ||
      (t1 === 1 && t0 < 1) ||
      (t0 > 0 && t0 < 1) ||
      (t1 > 0 && t1 < 1) ||
      (t0 > 1 && t1 < 1) ||
      (t1 > 1 && t0 < 1) ||
      (t0 < 0 && t1 > 0) ||
      (t1 < 0 && t0 > 0)
    )
  return {
    intersection: intersection,
    t0: t0,
    t1: t1
  }
}

function isNearColinear(a, b, point) {
  var ba = new Vector3().subVectors(b, a)
    , pa = new Vector3().subVectors(point, a)
    , cosdeg = Math.cos(deg2rad(6))

  return pa.lengthSq() <= Number.EPSILON ||
   Math.abs(ba.dot(pa)/(ba.length() * pa.length())) >= cosdeg
}

function getPointTIntersection(a, b, point) {
  var ba = new Vector3().subVectors(b, a)
    , pa = new Vector3().subVectors(point, a)
    , lenPA = pa.length()
    , lenBA = ba.length()

  if (point.distanceTo(a) <= pixelTolerance) return 0
  if (pa.angleTo(ba) <= deg2rad(90)) return lenPA / lenBA
  else return -lenPA / lenBA
}

function deg2rad(deg) {
  return deg * Math.PI / 180
}

function almostEquals(a, b) {
  return Math.abs(a - b) <= Number.EPSILON
}

function addSectionToAllEdges(edgesOfSection, sectionId) {
  for (var i = 0; i < edgesOfSection.length; i++) {
    addSectionToEdges(edgesOfSection[i], sectionId)
  }
}

function addSectionToEdges(edges, sectionId) {
  if (edges.indexOf(sectionId) == -1)
    edges.push(sectionId)
}

// a = edge point of section
// b = edge point of section
// edges = edges of section
// points = points of section
// forwards only applies to split with 1 point. if true, new edge is from (split.points[0] to b) otherwise
// it is from (a to split.points[0])
function splitEdge(edges, edgeIndex, points, forwards, sectionId, split) {
  if (split.points.length === 1) {
    var point = split.points[0]
    points.splice(edgeIndex + 1, 0, point)

    // remove edge and replace with 2 edges that would sum up to original edge
    edges.splice(edgeIndex, 1)
    if (forwards) {
      edges.splice(edgeIndex, 0, [sectionId])
      edges.splice(edgeIndex + 1, 0, [sectionId, split.sectionId])
    }
    else {
      edges.splice(edgeIndex, 0, [sectionId, split.sectionId])
      edges.splice(edgeIndex + 1, 0, [sectionId])
    }
  }
  else if (split.points.length === 2) {
    points.splice(edgeIndex + 1, 0, split.points[0], split.points[1])

    // remove edge and replace with 3 edges that would sum up to original edge
    edges.splice(edgeIndex, 1)
    edges.splice(edgeIndex, 0, [sectionId])
    edges.splice(edgeIndex + 1, 0, [sectionId, split.sectionId])
    edges.splice(edgeIndex + 2, 0, [sectionId])
  }
}

function deleteSection(section) {
  var selectedSections = this.selectedSections
    , sections = this.sections
    , index = selectedSections.indexOf(section.id)
  if (index > -1) selectedSections.splice(index, 1)
  for (var i = 0; i < sections.length; i++) {
    if (sections[i] == section) {
      sections.splice(i, 1)
      break
    }
  }
  for (var i = 0; i < sections.length; i++) {
    var other = sections[i]
    for (var j = 0; j < other.edges.length; j++) {
      var edges = other.edges[j]
      index = edges.indexOf(section.id)
      if (index > -1) edges.splice(index, 1)
    }
  }
}

function computeMouseCoords(evt, element) {
  return new Vector3(evt.pageX - element.offsetLeft, evt.pageY - element.offsetTop, 0)
}

function addSection(section) {
  // section.edges should be array with length 1 less than points, each array entry should
  // itself be an array with section ids that contains this edge. In the case of a new sector,
  // edge would just be that sector
  var sections = this.sections

  section.edges = []
  for (var i = 0; i < section.points.length - 1; i++) {
    section.edges.push([
      section.id
    ])
  }

  // Check edges of other sections against new section edges
  for (var i = 0; i < section.edges.length; i++) {
    var a = section.points[i]
      , b = section.points[i + 1]
      , looping = true
      , nonCase1Split = false

    for (var j = 0; j < sections.length && looping; j++) {
      var otherSection = sections[j]

      for (var k = 0; k < otherSection.edges.length; k++) {
        var sectionEdgeIndex = i,
          otherSectionEdgeIndex = k

        if (otherSection.edges[otherSectionEdgeIndex].indexOf(section.id) > -1) {
          continue
        }
        var c = otherSection.points[otherSectionEdgeIndex]
          , d = otherSection.points[otherSectionEdgeIndex + 1]
          , info = getEdgeIntersection(c, d, a, b)

        // console.log(i, j, k)
        if (!info.intersection) continue

        // In order points to add to respective sections. Each point should have a lower 't' value then next for that edge
        var addedPointsSection = []
        var addedPointsOther = []

        var t0 = Math.min(info.t0, info.t1)
          , t1 = Math.max(info.t0, info.t1)

        // Need to do [0, 1] for both t's since t0 may be > t1
        // if (info.t0 >= 0 && info.t0 <= 1 && info.t1 <= 1 && info.t1 >= 0) {
        if (t0 >= 0 && t1 <= 1) {
          // Case 1: a and b are fully embedded in other sections edge (cd), so only split other section
          // swap if order is inconsistent (this would occur depending on which edge intersects)
          if (info.t0 > info.t1) {
            addedPointsOther.push(b)
            addedPointsOther.push(a)
          }
          else {
            addedPointsOther.push(a)
            addedPointsOther.push(b)
          }

          addSectionToEdges(section.edges[sectionEdgeIndex], otherSection.id)
          splitEdge(otherSection.edges, otherSectionEdgeIndex, otherSection.points, false, otherSection.id, {
            points: addedPointsOther,
            sectionId: section.id
          })

          // If Case 1, then it's fully embedded and we can move on to section's next edge.
          looping = false
          break
        }
        else if ((info.t0 < 0 || info.t0 > 1) && (info.t1 < 0 || info.t1 > 1)) {
          console.log("case 2")
          nonCase1Split = true
          // Case 2: c and d are fully embedded in a and b, split edge along a and b of section.
          // check of info.intersection already ensures we can just check for < 0 and > 1
          // Need to find which of c and d come first along ab's edge
          if (getPointTIntersection(a, b, c) < getPointTIntersection(a, b, d)) {
            addedPointsSection.push(c)
            addedPointsSection.push(d)
          }
          else {
            addedPointsSection.push(d)
            addedPointsSection.push(c)
          }

          addSectionToEdges(otherSection.edges[otherSectionEdgeIndex], section.id)
          splitEdge(section.edges, sectionEdgeIndex, section.points, false, section.id, {
            points: addedPointsSection,
            sectionId: otherSection.id
          })
        }
        // Since we already checked fully contained above, there can only be a single point between. a or b between c and d
        else if (info.t0 >= 0 && info.t0 <= 1) {
          console.log("a between c d case 3")
          nonCase1Split = true
          // Case 3
          // Add a between c and d to otherSection
          // Add c between a and b to section
          addedPointsOther.push(a)
          addedPointsSection.push(c)

          splitEdge(otherSection.edges, otherSectionEdgeIndex, otherSection.points, false, otherSection.id, {
            points: addedPointsOther,
            sectionId: section.id
          })

          splitEdge(section.edges, sectionEdgeIndex, section.points, false, section.id, {
            points: addedPointsSection,
            sectionId: otherSection.id
          })
        }
        else if (info.t1 >= 0 && info.t1 <= 1) {
          console.log("b between c d case 4")
          nonCase1Split = true
          // Case 4
          // Add b between c and d to otherSection
          // Add d between a and b to section
          addedPointsOther.push(b)
          addedPointsSection.push(d)

          splitEdge(otherSection.edges, otherSectionEdgeIndex, otherSection.points, true, otherSection.id, {
            points: addedPointsOther,
            sectionId: section.id
          })

          splitEdge(section.edges, sectionEdgeIndex, section.points, true, section.id, {
            points: addedPointsSection,
            sectionId: otherSection.id
          })
        }
        else {
          throw new Error("unhandled t0 and t1 values")
        }

        if (nonCase1Split) {
          // Need to recheck edge so decrement i.
          // since a and b should now point to new points / edges if split
          i--
          looping = false
          break
        }
      }
    }
  }

  // Once splits are done, check if section is completely enclosed in any other section.
  // if so, mark every edge in section as being co-owned by other section, but DONT mark
  // othersection edges as owning section. - this is just a semi cheap way to hide all walls
  // if completely self contained
  var insertionIndex = -1
  for (var i = 0; i < sections.length; i++) {
    var other = sections[i]
    if (isSectionInside(section, other)) {
      addSectionToAllEdges(section.edges, other.id)
    }
    else if (isSectionInside(other, section)) {
      insertionIndex = i
      addSectionToAllEdges(other.edges, section.id)
    }
  }
  // Finally add section only after checking other section's edges for shared
  if (insertionIndex == -1)
    this.sections.push(section)
  else
    this.sections.splice(insertionIndex, 0, section)
}

// assumes convex ccw
function buildPolygons(canvasDimensions) {
  var sections = this.sections
    , v = 0
    , n = 0
    , vertices = this.geometry.vertices

  for (var i = 0; i < sections.length; i++) {
    var section = sections[i]
      , points = section.points
      , edges = section.edges
      , floorHeight = section.floorHeight
      , ceilingHeight = section.ceilingHeight

    // draw floor part of floor - start at index 1 and end 1 less then final index for triangulation
    for (var j = 1; j < points.length - 1; j++) {
      vertices[v++] = convert2Dto3D(points[0], floorHeight, canvasDimensions)
      vertices[v++] = convert2Dto3D(points[j], floorHeight, canvasDimensions)
      vertices[v++] = convert2Dto3D(points[j + 1], floorHeight, canvasDimensions)
    }

    // draw outside walls of floor, if below 0, invert order. Use lines. Always faces out
    if (floorHeight != noFloorWallY) {
      for (var j = 0; j < points.length - 1; j++) {
        var a = points[j]
          , b = points[j + 1]
          , top = floorHeight > noFloorWallY ? floorHeight : noFloorWallY
          , bottom = floorHeight > noFloorWallY ? noFloorWallY : floorHeight

        vertices[v++] = convert2Dto3D(a, top, canvasDimensions)
        vertices[v++] = convert2Dto3D(a, bottom, canvasDimensions)
        vertices[v++] = convert2Dto3D(b, bottom, canvasDimensions)

        vertices[v++] = convert2Dto3D(a, top, canvasDimensions)
        vertices[v++] = convert2Dto3D(b, bottom, canvasDimensions)
        vertices[v++] = convert2Dto3D(b, top, canvasDimensions)
      }
    }

    // draw ceiling part of ceiling, since looking from below to above, reverse order
    for (var j = 1; j < points.length - 1; j++) {
      vertices[v++] = convert2Dto3D(points[0], ceilingHeight, canvasDimensions)
      vertices[v++] = convert2Dto3D(points[j + 1], ceilingHeight, canvasDimensions)
      vertices[v++] = convert2Dto3D(points[j], ceilingHeight, canvasDimensions)
    }

    // draw outside walls of ceiling
    if (ceilingHeight != noCeilingWallY) {
      for (var j = 0; j < points.length - 1; j++) {
        var a = points[j]
          , b = points[j + 1]
          , top = ceilingHeight > noCeilingWallY ? ceilingHeight : noCeilingWallY
          , bottom = ceilingHeight > noCeilingWallY ? noCeilingWallY : ceilingHeight

        vertices[v++] = convert2Dto3D(b, top, canvasDimensions)
        vertices[v++] = convert2Dto3D(a, top, canvasDimensions)
        vertices[v++] = convert2Dto3D(a, bottom, canvasDimensions)

        vertices[v++] = convert2Dto3D(b, top, canvasDimensions)
        vertices[v++] = convert2Dto3D(a, bottom, canvasDimensions)
        vertices[v++] = convert2Dto3D(b, bottom, canvasDimensions)
      }
    }

    // Draw middle walls if any
    for (var j = 0; j < edges.length; j++) {
      var edge = edges[j]
      if (edge.length > 1) continue

      vertices[v++] = convert2Dto3D(points[j], ceilingHeight, canvasDimensions)
      vertices[v++] = convert2Dto3D(points[j + 1], ceilingHeight, canvasDimensions)
      vertices[v++] = convert2Dto3D(points[j + 1], floorHeight, canvasDimensions)

      vertices[v++] = convert2Dto3D(points[j], ceilingHeight, canvasDimensions)
      vertices[v++] = convert2Dto3D(points[j + 1], floorHeight, canvasDimensions)
      vertices[v++] = convert2Dto3D(points[j], floorHeight, canvasDimensions)
    }
  }

  // Zero out the rest.
  var zero = new Vector3(0, 0, 0)
  for (; v < MAX_VERTICES; v++) {
    vertices[v] = zero
  }

  this.geometry.computeFaceNormals()
  this.geometry.verticesNeedUpdate = true
  this.render()
}

function buildTest() {
  var sections = this.sections
    , index = 0
    , vertices = this.geometry.vertices

  vertices[index++] = new Vector3(0, 0, 0)
  vertices[index++] = new Vector3(10, 0, 0)
  vertices[index++] = new Vector3(0, 0, -10)
  this.geometry.verticesNeedUpdate = true
  this.render()
}

// Takes point in x, y screen coords with 0, 0 top left of canvas to 3d point
function convert2Dto3D(point, y, canvasDimensions, gradient) {
  gradient = gradient || .05
  return new Vector3((point.x - canvasDimensions.x / 2) * gradient, y, (point.y - canvasDimensions.y / 2) * gradient)
}

function isSectionInside(section, containerSection) {
  for (var i = 0; i < section.points.length; i++) {
    if (!isPointInside(section.points[i], containerSection))
      return false
  }
  return true
}

// http://www.mathopenref.com/coordpolygonarea2.html
function computeSectionArea(section) {
  var area = 0         // Accumulates area in the loop
    , points = section.points
    , j = points.length-1  // The last vertex is the 'previous' one to the first

  for (i = 0; i < points.length; i++) {
    area = area +  (points[j].x + points[i].x) * (points[j].y-points[i].y)
    j = i
  }
  return area / 2
}

// https://github.com/substack/point-in-polygon
function isPointInside(point, section) {
    if (!section.points) {
      debugger
    }
    var x = point.x, y = point.y
    var inside = false
    for (var i = 0, j = section.points.length - 1; i < section.points.length; j = i++) {
        var xi = section.points[i].x, yi = section.points[i].y
        var xj = section.points[j].x, yj = section.points[j].y
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
        if (intersect) inside = !inside;
    }
    return inside;
}

// module.exports = Editor
