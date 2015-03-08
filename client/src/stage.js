var Matrix4    = require("./math").mat4
var Vector3    = require("./math").vec3
var Quaternion = require("./math").quat

var representations = {
  player: require("./obj3d/player")
}

function getEntityRepresentation (me, entity) {
  if (me.context.id == entity.context.id) return
  return representations.player
}

function animate () {
  this.update()
  this.renderer.render(this.scene, this.camera)
  this.id = requestAnimationFrame(animate.bind(this,
    this.renderer, this.scene, this.camera))
}

function Stage (engine) {
  this.engine = engine
  this.cbs = {}
  this.el = document.createElement("div")
  this.el.className = "stage noselect"
  this.mpos = {x:0, y:0}

  this.el.addEventListener("contextmenu", function(e) {
    e.preventDefault()
  })

  this.init()
}

Stage.prototype = {
  init: function init() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(50, 0, 1, 1000)
    this.renderer = new THREE.WebGLRenderer()
    this.emap = {}

    var el = this.el
    while (el.firstChild) {
      el.removeChild(el.firstChild)
    }
    el.appendChild(this.renderer.domElement)

    this.resize()
    animate.call(this)

    var p = new representations.player()
    p.o3d.position.z = -10
    this.scene.add(p.o3d)
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
    var me = this.engine.you()

    if (!me) return

    // Camera
    var forward = new Vector3(0, 0, -1)
      .applyMatrix4(new Matrix4().makeRotationFromQuaternion(me.rotation))
      .normalize()
    var lookAtPoint = new Vector3().addVectors(me.position, forward)
    this.camera.lookAt(lookAtPoint)
    this.camera.position.copy(me.position)

    // Diff the entities in the engine and add and or update, or remove them.
    var map = this.emap
    var imap = {}
    var entities = this.engine.entities
    for (var i=0; i<entities.length; i++) {
      var e = entities[i]
      imap[e.id] = true

      if (map[e.id]) continue

      var Rep = getEntityRepresentation.call(this, me, e)

      if (!Rep) return

      var p = map[e.id] = new Rep(e)
      this.scene.add(p.o3d)
    }
    var ids = Object.keys(map)
    for (var i=0; i<ids.length; i++) {
      var id = ids[i]
      if (imap[id]) {
        if (imap[id].update) imap[id].update()
        continue
      }
      this.scene.remove(map[id].o3d)
      delete map[id]
      ids.splice(i, 1)
      i--
    }
  }
}

module.exports = Stage