var Matrix4    = require("./math").mat4
var Vector3    = require("./math").vec3
var Quaternion = require("./math").quat
var Euler      = require("./math").euler

var representations = {
  player: require("./obj3d/player")
}

function getEntityRepresentation (me, entity) {
  if (me.context.id == entity.context.id) return
  return representations.player
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

    for (var angle = 0; angle < 360; angle += 90) {
      var p = new representations.player(null, null, 0x100 + 255 * angle)
      p.o3d.position.x = Math.cos(angle * Math.PI / 180) * 5
      p.o3d.position.z = -Math.sin(angle * Math.PI / 180) * 5
      this.scene.add(p.o3d)
    }
  },

  resize: function resize() {
    var rect = this.el.getBoundingClientRect()
    this.camera.aspect = rect.width / rect.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(rect.width, rect.height)
  },

  update: function update(dt) {
    var me = this.engine.you()

    if (!me) return this.renderer.render(this.scene, this.camera)

    this.camera.rotation.copy(new Euler(-me.euler.y, -me.euler.x, 0, "YXZ"))
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

      if (!Rep) continue

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

    this.renderer.render(this.scene, this.camera)
  }
}

module.exports = Stage