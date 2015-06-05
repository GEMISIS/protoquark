var Chat       = require("./interface/chat")
var Connection = require("./connection")
var Controller = require("./controller")
var Crosshair  = require('./interface/crosshair')
var Engine     = require("./engine")
var Health     = require("./interface/health")
var Radar      = require("./interface/radar")
var Router     = require("./router")
var Score      = require("./interface/score")
var Stage      = require("./stage")
var Editor      = require("./editor/editor")
var Status     = require("./interface/connection-status")
var Weapon     = require('./interface/weapon')

window.connection = new Connection()

var PIXELS_PER_RADIAN = 250

var last

var keymap = {
  32: "jump",
  65: "strafeleft",
  68: "straferight",
  70: "grenade",
  82: "reload",
  83: "backward",
  87: "forward",
  86: "swapweapon"
}

var mousemap = {
  1: "shoot",
  3: "grenade"
}

var ons = {
  beforeunload: function (e) {
    this.connection.kill()
  },
  resize: function onResize (e) {
    this.stage.resize()
  },
  keyup: function onKeyUp (e) {
    this.controller.set(keymap[e.keyCode], false)
  },
  keydown: function onKeyDown (e) {
    var isenter = e.keyCode == 13
    var istab = e.keyCode == 9

    if (istab) {
      this.score.toggle()
      return e.preventDefault()
    }
    if (this.chat.hasfocus && !isenter) return
    if (isenter) return this.chat.toggle()

    this.controller.set(keymap[e.keyCode], true)
  },
  mousedown: function onMouseDown (e) {
    this.chat.blur()
    this.controller.set(mousemap[e.which], true)
  },
  mouseup: function onMouseUp (e) {
    this.controller.set(mousemap[e.which], false)
  },
  mousemove: function onMouseMove (e) {
    if (!this.controller.canLook) return
    var dx = e.movementX * 1.0 / PIXELS_PER_RADIAN
    var dy = e.movementY * 1.0 / PIXELS_PER_RADIAN
    this.controller.set("look", {x:dx, y:dy})
  }
}

function onRoom (name) {
  function leavingRoom(e) {
    var xmlHttp = new XMLHttpRequest()
    xmlHttp.open("POST", "http://localhost:1337/quit/" + name, false)
    xmlHttp.setRequestHeader("content-type","application/x-www-form-urlencoded");
    xmlHttp.send(null)
  }
  window.onbeforeunload=leavingRoom

  window.connection.connect(name)
}

document.addEventListener("DOMContentLoaded", function (e) {

  var conn = window.connection
  var el = document.body
  var rect = el.getBoundingClientRect()

  var router = new Router()
  router.add("room", new RegExp('rooms\/([^\/]+)\/?$'))
  router.on("route:room", onRoom)

  var chat = window.chat = new Chat(conn)
  el.appendChild(chat.el)

  var controller = window.controller = new Controller

  var engine = window.engine = new Engine(conn, controller)

  var radar = new Radar(engine)
  el.appendChild(radar.el)

  var health = new Health(engine)
  el.appendChild(health.el)

  var crosshair = new Crosshair
  el.appendChild(crosshair.el)

  var status = new Status(conn)
  el.appendChild(status.el)

  var weapon = new Weapon(engine)
  el.appendChild(weapon.el)

  var score = window.score = new Score(engine)
  el.appendChild(score.el)

  var stage = window.stage = new Stage(engine)
  el.appendChild(stage.el)
  stage.resize()

  Object.keys(ons).forEach(function(ev){
    window.addEventListener(ev, ons[ev].bind(window))
  })

  // Handle pointer lock.
  var mel = stage.renderer.domElement
  mel.addEventListener("click", function (e) {
    if (window.document.pointerLockElement == mel) return
    mel.requestPointerLock()
  })
  window.document.addEventListener("pointerlockerror", function (e) {
    alert(e.message)
  })
  window.document.addEventListener("pointerlockchange", function (e){
    controller.canLook = window.document.pointerLockElement == mel
  })

  router.listen()
  last = timestamp()
  update([engine, radar, health, weapon, stage])
})

function timestamp() {
  return (window.performance && window.performance.now) ? window.performance.now() : (new Date().getTime())
}

function update(things) {
  var now = timestamp()
  var step = (now - last) / 1000
  for (var i=0; i<things.length; i++) {
    things[i].update(step)
  }
  last = now
  requestAnimationFrame(update.bind(this, things))
}

