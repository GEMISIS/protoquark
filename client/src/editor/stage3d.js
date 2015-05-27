var Vector3 = THREE.Vector3
var Color = THREE.Color

// maxVertices must be a multiple of 3
var maxVertices = 3000
var numFaces = maxVertices / 3

function Stage3D(width, height) {
  var geometry = this.geometry = new THREE.Geometry()
  var scene = this.scene = new THREE.Scene()
  var camera = this.camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 1000)
  var renderer = this.renderer = new THREE.WebGLRenderer()

  this.width = width
  this.height = height

  this.resetLastLook()
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

  this.mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial( { shading: THREE.FlatShading, vertexColors: THREE.FaceColors } ))
  this.mesh.frustumCulled = false
  scene.add(this.mesh)

  var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  directionalLight.position.set( .5, .707, .707 );
  scene.add( directionalLight );

  directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  directionalLight.position.set( -1, 1, .1 );
  scene.add( directionalLight );

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

resetLastLook: function resetLastLook() {
  this.lastLook = {x: this.width / 2, y: this.height / 2}
}
}

module.exports = Stage3D
