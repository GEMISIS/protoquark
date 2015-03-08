var Player = require("./obj3d/player")

function animate () {
  this.renderer.render(this.scene, this.camera)
  this.id = requestAnimationFrame(animate.bind(this,
    this.renderer, this.scene, this.camera))
  this.update()
}

function onMouseMove (e) {
  var me = this.engine.you()
  var pos = this.mpos
  var dx = e.x - pos.x
  var dy = e.y - pos.y

  me.euler.x += dy
  me.euler.y += dx

  me.rotation = new Matrix4().multiplyMatrices(
    new Matrix4().makeRotationY(this.euler.y),
    new Matrix4().makeRotationX(this.euler.x))

  pos.x = e.x
  pos.y = e.y
}

function Stage (engine, controller) {
  this.engine = engine
  this.control = controller
  this.cbs = {}
  this.el = document.createElement("div")
  this.el.className = "stage noselect"
  this.init()
  this.mpos = {x:0, y:0}

  this.el.addEventListener("contextmenu", function(e) {
    e.preventDefault()
  })
}

Stage.prototype = {
  init: function init() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(70, 0, 1, 1000)
    this.renderer = new THREE.WebGLRenderer()

    this.camera.position.z = 10

    var el = this.el
    while (el.firstChild) {
      el.removeChild(el.firstChild)
    }
    el.appendChild(this.renderer.domElement)

    this.resize()
    animate.call(this)

    this.cbs.mousemove = onMouseMove.bind(this)
    window.addEventListener("mousemove", this.cbs.mousemove)
  },

  resize: function resize() {
    var rect = this.el.getBoundingClientRect()
    this.camera.aspect = rect.width / rect.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(rect.width, rect.height)
  },

  dispose: function dispose() {
    cancelAnimatinFrame(this.id)
    window.removeEventListener("mousemove", this.cbs.mousemove)
  },

  update: function update() {
    // Camera
    var me = this.engine.you()
    var forward = new Vector3(0, 0, -1)
      .applyMatrix4(new Matrix4().makeRotationFromQuaternion(me.rotation))
      .normalize()
    var lookAtPoint = new Vector3().addVectors(me.position, forward)
    this.camera.lookAt(lookAtPoint)
    this.camera.position.copy(me.position)
  }
}

module.exports = Stage