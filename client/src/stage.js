var Player = require("./obj3d/player")

function animate () {
  this.renderer.render(this.scene, this.camera)
  this.id = requestAnimationFrame(animate.bind(this,
    this.renderer, this.scene, this.camera))
}

function Stage (conn) {
  this.el = document.createElement("div")
  this.el.className = "stage noselect"
  this.init()

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
  },

  resize: function resize() {
    var rect = this.el.getBoundingClientRect()
    this.camera.aspect = rect.width / rect.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(rect.width, rect.height)
  },

  dispose: function dispose() {
    cancelAnimatinFrame(this.id)
  }
}

module.exports = Stage