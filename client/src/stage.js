var Player = require("./obj3d/player")

function animate () {
  this.renderer.render(this.scene, this.camera)
  this.id = requestAnimationFrame(animate.bind(this,
    this.renderer, this.scene, this.camera))
}

function onPlayerEnter (e) {
  var player = new Player(e.context)
  this.players[e.context.id] = player
  this.scene.add(player.o3d)
}

function onPlayerExit (e) {
  this.scene.remove(this.players[e.context.id])
}

function Stage (conn) {
  this.conn = conn
  this.el = document.createElement("div")
  this.el.className = "stage noselect"
  this.players = {}
  this.init()

  this.el.addEventListener("contextmenu", function(e) {
    e.preventDefault()
  })

  conn.on("playerenter", onPlayerEnter.bind(this))
  conn.on("playerexit", onPlayerExit.bind(this))
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