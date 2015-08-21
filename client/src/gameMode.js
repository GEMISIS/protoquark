var emitter = require("component/emitter")

function GameMode (name, ) {
	this.name = 
}

GameMode.prototype = {
  get: function get (control) {
    return this.states[control]
  },
  set: function set (control, state) {
    this.states[control] = state
    this.emit(control, state)
  }
}

emitter(GameMode.prototype)

module.exports = GameMode