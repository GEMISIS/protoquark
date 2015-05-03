var emitter = require('component/emitter')

var defaults = {
  mapUrl: '',
  mode: 'free'
}

function Settings (obj) {
  this.clone(obj || {})
}

Settings.prototype = {
  clone: function clone (obj) {
    Object.keys(defaults).forEach(function (key) {
      this[key] = obj[key] || defaults[key]
    })
  },

  update: function update (key, value) {
    this[key] = value
    this.emit('update', this, key, value)
  }
}

emitter(Settings.prototype)

module.exports = Settings