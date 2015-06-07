var Vector3 = THREE.Vector3
var Color = THREE.Color
var SurfaceList = require("./surfacelist")

// all maxVertices must be a multiple of 3
var maxVertices = 12000
var maxSelectionVertices = 600
var maxHoverVertices = 180

function Stage3D(width, height) {
  this.width = width
  this.height = height

  this.resetLastLook()
  this.angle = {x: 0, y: 0}

  var renderer = this.renderer = new THREE.WebGLRenderer()
  renderer.setSize(width, height)
  document.body.appendChild(renderer.domElement)

  this.initGeometry()
  this.createScene()

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
  var delta = {
    x: -(mouseCoords.x - this.lastLook.x) / 200,
    y: -(mouseCoords.y - this.lastLook.y) / 200
  }

  this.lookDelta(delta)
  this.lastLook = mouseCoords
},

lookDelta: function lookDelta(mouseDelta) {
  this.angle.x += mouseDelta.x
  this.angle.y += mouseDelta.y

  var x = this.angle.x
  var y = this.angle.y
  var lookAtPoint = this.computeForward().add(this.camera.position)

  this.camera.lookAt(lookAtPoint)
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

resetLastLook: function resetLastLook() {
  this.lastLook = {x: this.width / 2, y: this.height / 2}
},

initGeometry: function() {
  var empty = new Vector3(0, 0, 0)

  // geometry for main scene mesh
  var geometry = this.geometry = new THREE.Geometry()
  for (var i = 0; i < maxVertices; i++) {
    geometry.vertices.push(empty)
  }
  for (var i = 0; i < maxVertices / 3; i++) {
    var vertIndex = i * 3
    geometry.faces.push(new THREE.Face3(vertIndex, vertIndex + 1, vertIndex + 2))
  }

  // geometry for selected sections / blocks / regions
  var selectionGeometry = this.selectionGeometry = new THREE.Geometry()
  for (var i = 0; i < maxSelectionVertices; i++) {
    selectionGeometry.vertices.push(empty)
  }
  for (var i = 0; i < maxSelectionVertices / 3; i++) {
    var vertIndex = i * 3
    selectionGeometry.faces.push(new THREE.Face3(vertIndex, vertIndex + 1, vertIndex + 2))
  }

  // geometry for section / block underneath the cursor during hovering
  var hoverGeometry = this.hoverGeometry = new THREE.Geometry()
  for (var i = 0; i < maxHoverVertices; i++) {
    hoverGeometry.vertices.push(empty)
  }
  for (var i = 0; i < maxHoverVertices / 3; i++) {
    var vertIndex = i * 3
    hoverGeometry.faces.push(new THREE.Face3(vertIndex, vertIndex + 1, vertIndex + 2))
  }
},

createScene: function() {
  var scene = this.scene = new THREE.Scene()
  var camera = this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.01, 1000)

  camera.position.x = 0
  camera.position.y = 2.5
  camera.position.z = 6

  this.mesh = new THREE.Mesh(this.geometry, new THREE.MeshPhongMaterial( { shading: THREE.FlatShading, vertexColors: THREE.FaceColors } ))
  this.mesh.frustumCulled = false
  scene.add(this.mesh)

  this.selectionMesh = new THREE.Mesh(this.selectionGeometry, new THREE.MeshBasicMaterial( { color: 0xFFAAAA } ))
  this.selectionMesh.frustumCulled = false
  scene.add(this.selectionMesh)

  this.hoverMesh = new THREE.Mesh(this.hoverGeometry, new THREE.MeshBasicMaterial( { color: 0xFFAA55 } ))
  this.hoverMesh.frustumCulled = false
  scene.add(this.hoverMesh)

  var light = new THREE.DirectionalLight(0xffffff, 0.5)
  light.position.set(.5, .707, .707)
  scene.add(light)

  light = new THREE.DirectionalLight(0xcccccc, 0.5)
  light.position.set(-1, 1, .1)
  scene.add(light)

  light = new THREE.DirectionalLight(0xaaaaaa, 0.5)
  light.position.set(0, 1, -1)
  scene.add(light)

  light = new THREE.DirectionalLight(0x888888, 0.5)
  light.position.set(0, -1, .25)
  scene.add(light)
}
}

module.exports = Stage3D
