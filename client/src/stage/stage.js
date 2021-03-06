var math       = require("../math")
var Matrix4    = math.mat4
var Vector3    = math.vec3
var Quaternion = math.quat
var Euler      = math.euler

var representations = {
  box:          require('../obj3d/box'),
  block:        require('../obj3d/block'),
  health:       require('../obj3d/pickup'),
  ammo:         require('../obj3d/pickup'),
  weapon:       require('../obj3d/pickup'),
  bullet:       require('../obj3d/bullet'),
  remoteplayer: require('../obj3d/remoteplayer'),
  player:       require('../obj3d/player'),
  gib:          require('../obj3d/block'),
  level:        require('../obj3d/level'),
  model:        require("../obj3d/model"),
  decal:        require("../obj3d/decal"),
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
  cacheRepresentations: function() {
    Object.keys(representations).forEach(function(r) {
      if (typeof representations[r].cache === 'function')
        representations[r].cache()
    })
  },

  init: function init() {
    var scene = this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(50, 0, .05, 1000)
    this.renderer = new THREE.WebGLRenderer()
    this.emap = {}

    var el = this.el
    while (el.firstChild) {
      el.removeChild(el.firstChild)
    }
    el.appendChild(this.renderer.domElement)

    this.resize()

    // markers for direction
    // var colors = [0x0000FF, 0x00FF00, 0xFF0000, 0xFF00FF]
    // for (var angle = 0; angle < 4; angle++) {
    //   var p = new representations.box(null,
    //     colors[angle])
    //   p.o3d.position.x = Math.cos(angle * 90 * Math.PI / 180) * 5
    //   p.o3d.position.z = -Math.sin(angle * 90 * Math.PI / 180) * 5
    //   scene.add(p.o3d)
    // }

    var light = new THREE.DirectionalLight(0xaaaaaa)
    light.position.set(1, 1, 1)
    scene.add(light)

    light = new THREE.DirectionalLight(0x888888)
    light.position.set(-1, 1, -1)
    scene.add(light)

    // light = new THREE.DirectionalLight(0xaaaaaa, 0.5)
    // light.position.set(0, 1, -1)
    // scene.add(light)

    // light = new THREE.DirectionalLight(0x888888, 0.5)
    // light.position.set(0, -1, .25)
    // scene.add(light)

    scene.add(new THREE.AmbientLight(0x222222))

    scene.fog = new THREE.Fog(0xAAAAFF, 0.5, 50)

    this.cacheRepresentations()
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
      // place camera slightly above player
      this.camera.position.set(me.position.x, me.position.y + 1, me.position.z)
      this.camera.fov = me.control.zoom ? 25 : 60
      this.camera.updateProjectionMatrix()
      this.camera.rotation.copy(new Euler(-me.euler.x, -me.euler.y, 0, "YXZ"))
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
        rep = new Representation(e, this.scene)
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

    Object.keys(representations).forEach(function(r) {
      if (typeof representations[r].update === 'function')
        representations[r].update(dt)
    })

    THREE.AnimationHandler.update(dt)
    this.renderer.render(this.scene, this.camera)
  }
}

module.exports = Stage