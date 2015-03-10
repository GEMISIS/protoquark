var Chat       = require("./chat")
var Connection = require("./connection")
var Controller = require("./controller")
var Engine     = require("./engine")
var Router     = require("./router")
var Stage      = require("./stage")

window.connection = new Connection();

var PIXELS_PER_RADIAN = 1000

var keymap = {
  32: "jump",
  65: "strafeleft",
  68: "straferight",
  70: "grenade",
  82: "reload",
  83: "backward",
  87: "forward"
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
    this.stage.resize.bind(this.stage)
  },
  keyup: function onKeyUp (e) {
    this.controller.set(keymap[e.keyCode], false)
  },
  keydown: function onKeyDown (e) {
    var isenter = e.keyCode == 13

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
    var pos = this.controller.mpos
    var x = e.x
    var y = e.y
    var dx = (x - pos.x) * 1.0 / PIXELS_PER_RADIAN
    var dy = (y - pos.y) * 1.0 / PIXELS_PER_RADIAN
    pos.x = x
    pos.y = y
    this.controller.set("look", {x:dx, y:dy})
  }
}

function onRoom (name) {
  window.connection.connect(name)
}

document.addEventListener("DOMContentLoaded", function (e) {
  var conn = window.connection
  var el = document.body
  var rect = el.getBoundingClientRect()

  var router = new Router()
  router.add("room", /^\/([^\/]+)\/?$/)
  router.on("route:room", onRoom)

  var chat = window.chat = new Chat(conn)
  el.appendChild(chat.el)

  var controller = window.controller = new Controller
  controller.mpos = {
    x: rect.width * 0.5,
    y: rect.height * 0.5
  }

  var engine = window.engine = new Engine(conn, controller)

  var stage = window.stage = new Stage(engine)
  el.appendChild(stage.el)
  stage.resize()

  Object.keys(ons).forEach(function(ev){
    window.addEventListener(ev, ons[ev].bind(window))
  })

  router.listen()
  update(engine, stage)
})

function update(engine, stage) {
  var step = 1/60
  engine.update(step)
  stage.update(step)
  requestAnimationFrame(update.bind(this, engine, stage))
}