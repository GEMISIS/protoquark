var Entity = require("./entity")

var ons = {
control: {},
conn: {
  playerenter: function onPlayerEnter (e) {
    var ent = new Entity(e.context)
    this.entities.push(ent)
  },
  playerexit: function onPlayerExit (e) {
    var entities = this.entities
    var ent = entities.filter(function(ent){
      return ent.context.id == e.context.id
    })[0]
    if (!ent) return
    this.entities.splice(this.entities.indexOf(ent), 1)
  }
}

function Engine (connection, controller) {
  this.conn = connection
  this.control = controller
  this.entities = []

  var self = this
  Object.keys(ons).forEach(function (key) {
    Object.keys(ons[key]).forEach(function (ev) {
      self[key].on(ev, ons[ev].bind(this))
    })
  })
}

module.exports = Engine