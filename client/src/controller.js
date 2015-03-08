var emitter = require("component/emitter")

var PIXELS_PER_RADIAN = 1000

var keymap = {
  32: "jump",
  65: "strafeleft",
  68: "strageright",
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
  keyup: function onKeyUp (e) {
    var ev = keymap[e.keyCode]
    if (!ev) return
    this.states[ev] = false
    this.emit(ev, this.states[ev])
  },
  keydown: function onKeyDown (e) {
    var ev = keymap[e.keyCode]
    if (!ev) return
    this.states[ev] = true
    this.emit(ev, this.states[ev])
  },
  mousedown: function onMouseDown (e) {
    var ev = mousemap[e.which]
    if (!ev) return
    this.states[ev] = true
    this.emit(ev, this.states[ev])
  },
  mouseup: function onMouseUp (e) {
    var ev = mousemap[e.which]
    if (!ev) return
    this.states[ev] = false
    this.emit(ev, this.states[ev])
  }
}

function Controller () {
  this.cbs = {}
  this.states = {}
  this.mpos = {x:0, y:0}
}

Controller.prototype = {
  listen: function listen () {
    this.stop()
    Object.keys(ons).forEach((function (event){
      this.cbs[event] = ons[event].bind(this)
      window.addEventListener(event, this.cbs[event])
    }).bind(this))
  },

  stop: function stop () {
    Object.keys(ons).forEach((function (event){
      if (this.cbs[event]) window.removeEventListener(event, this.cbs[event])
    }).bind(this))
  },

  getState: function getState (control) {
    return this.states[control]
  },

  lookWithMouse: function lookWithMouse (x, y) {
    var pos = this.mpos
    var dx = (x - pos.x) * 1.0 / PIXELS_PER_RADIAN
    var dy = (y - pos.y) * 1.0 / PIXELS_PER_RADIAN
    pos.x = x
    pos.y = y
    this.emit("look", dx, dy)
  }
}

emitter(Controller.prototype)

module.exports = Controller