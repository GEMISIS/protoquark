var Matrix4    = require("./math").mat4
var Vector3    = require("./math").vec3
var Quaternion = require("./math").quat
var Euler      = require("./math").euler

var representations = {
  box:          require('./obj3d/box'),
  block:        require('./obj3d/block'),
  bullet:       require('./obj3d/bullet'),
  remoteplayer: require("./obj3d/player")
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
    this.camera = new THREE.PerspectiveCamera(50, 0, .05, 1000)
    this.renderer = new THREE.WebGLRenderer()
    this.emap = {}

    var el = this.el
    while (el.firstChild) {
      el.removeChild(el.firstChild)
    }
    el.appendChild(this.renderer.domElement)

    this.resize()

    var colors = [0x0000FF, 0x00FF00, 0xFF0000, 0xFF00FF]
    for (var angle = 0; angle < 4; angle++) {
      var p = new representations.box(null,
        colors[angle])
      p.o3d.position.x = Math.cos(angle * 90 * Math.PI / 180) * 5
      p.o3d.position.z = -Math.sin(angle * 90 * Math.PI / 180) * 5
      this.scene.add(p.o3d)
    }
  },

  resize: function resize() {
    var rect = this.el.getBoundingClientRect()
    this.camera.aspect = rect.width / rect.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(rect.width, rect.height)
    this.renderer.setPixelRatio(window.devicePixelRatio)
  },

  update: function update(dt) {
    var me = this.engine.you()

    if (me) {
      this.camera.rotation.copy(new Euler(-me.euler.x, -me.euler.y, 0, "YXZ"))
      this.camera.position.copy(me.position)
    }

    // Diff the entities in the engine and add and or update, or remove them.
    var map = this.emap
    var imap = {}
    var entities = this.engine.entities
    var rep

    for (var i=0; i<entities.length; i++) {
      var e = entities[i]
      imap[e.id] = true

      if (map[e.id]) continue

      var Representation = representations[e.type]
      if (Representation) {
        rep = new Representation(e)
        if (!rep.o3d) throw Error('Tried to add representation with no o3d.')
        this.scene.add(rep.o3d)
      }
      else {
        rep = {entity: e}
      }

      map[e.id] = rep
    }

    var ids = Object.keys(map)
    for (var i=0; i<ids.length; i++) {
      var id = ids[i]
      rep = map[id]

      if (imap[id]) {
        if (rep.update) rep.update(dt)
        continue
      }

      if (rep.o3d) this.scene.remove(rep.o3d) 
      delete map[id]
      ids.splice(i, 1)
      i--
    }

    this.renderer.render(this.scene, this.camera)
  }
}

module.exports = Stage