var emitter = require("component/emitter")

function Controller () {
  this.states = {}
}

Controller.prototype = {
  get: function get (control) {
    return this.states[control]
  },
  set: function set (control, state) {
    this.states[control] = state
    this.emit(control, state)
  }
}

emitter(Controller.prototype)

module.exports = Controller