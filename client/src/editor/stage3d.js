
var Vector3 = THREE.Vector3

// maxVertices must be a multiple of 3
var maxVertices = 3000
var numFaces = maxVertices / 3

var noFloorWallY = 0
var noCeilingWallY = 10

function Stage3D(width, height) {
  var geometry = this.geometry = new THREE.Geometry()
  var scene = this.scene = new THREE.Scene()
  var camera = this.camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 1000)
  var renderer = this.renderer = new THREE.WebGLRenderer()

  this.width = width
  this.height = height

  this.lastLook = {x: width / 2, y: height / 2}
  this.angle = {x: 0, y: 0}

  for (var i = 0; i < maxVertices; i++) {
    geometry.vertices.push(new Vector3(0, 0, 0))
  }
  for (var i = 0; i < numFaces; i++) {
    var vertIndex = i * 3
    geometry.faces.push(new THREE.Face3(vertIndex, vertIndex + 1, vertIndex + 2))
  }

  renderer.setSize(width, height)
  document.body.appendChild(renderer.domElement)

  camera.position.x = 0
  camera.position.y = 2.5
  camera.position.z = 6

  this.mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial( { color: 0x999999, shading: THREE.FlatShading } ))
  this.mesh.frustumCulled = false
  scene.add(this.mesh)

  var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  directionalLight.position.set( .5, .707, .707 );
  scene.add( directionalLight );

  directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  directionalLight.position.set( -1, 1, .1 );
  scene.add( directionalLight );

  this.render()

  last = timestamp()
  var update = function() {
    var now = timestamp()
    var step = (now - last) / 1000
    this.render()
    if (this.moveAmount)
      this.moveForward(step * this.moveAmount)
    if (this.strafeAmount)
      this.strafe(step * this.strafeAmount)
    last = now
    requestAnimationFrame(update.bind(this))
  }

  update.call(this)
}

function timestamp() {
  return (window.performance && window.performance.now) ? window.performance.now() : (new Date().getTime())
}

Stage3D.prototype = {
render: function render() {
  this.renderer.render(this.scene, this.camera)
},

look: function look(mouseCoords) {
  // Inverse movement since this is the camera
  this.angle.x -= (mouseCoords.x - this.lastLook.x) / 200
  this.angle.y -= (mouseCoords.y - this.lastLook.y) / 200

  var x = this.angle.x
  var y = this.angle.y
  var lookAtPoint = this.computeForward().add(this.camera.position)

  this.camera.lookAt(lookAtPoint)
  this.lastLook = mouseCoords
},

computeForward: function computeForward() {
  return new Vector3(0, 0, -1).
    applyAxisAngle(new Vector3(1, 0, 0), this.angle.y).
    applyAxisAngle(new Vector3(0, 1, 0), this.angle.x)
},

computeRight: function computeRight() {
  return new Vector3(1, 0, 0).
    applyAxisAngle(new Vector3(1, 0, 0), this.angle.y).
    applyAxisAngle(new Vector3(0, 1, 0), this.angle.x)
},

startMovingForward: function (amount) {
  this.moveAmount = amount
},

stopMovingForward: function() {
  this.moveAmount = 0
},

startStrafing: function (amount) {
  this.strafeAmount = amount
},

stopStrafing: function() {
  this.strafeAmount = 0
},

moveForward: function(amount) {
  this.camera.position.add(this.computeForward().multiplyScalar(amount))
},

strafe: function(amount) {
  this.camera.position.add(this.computeRight().multiplyScalar(amount))
},

buildPolygons: function buildPolygons(sections) {
  var geometry = this.geometry
  , v = 0
  , n = 0
  , vertices = geometry.vertices
  , canvasDimensions = {x: this.width, y: this.height}

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
  for (; v < maxVertices; v++) {
    vertices[v] = zero
  }

  this.geometry.computeFaceNormals()
  this.geometry.verticesNeedUpdate = true
  this.render()
}
}

// Convert map point (2d) to world 3d point
function convert2Dto3D(point, y, canvasDimensions, gradient) {
  gradient = gradient || .05
  return new Vector3((point.x - canvasDimensions.x / 2) * gradient, y, (point.y - canvasDimensions.y / 2) * gradient)
}

module.exports = Stage3D
