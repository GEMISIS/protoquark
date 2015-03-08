var emitter = require("component/emitter")

var keymap = {
  32: "jump",
  65: "strafeLeft",
  68: "strageRight",
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
  }
}

emitter(Controller.prototype)

module.exports = Controller