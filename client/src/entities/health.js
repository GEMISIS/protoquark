var pickup     = require("./pickup")
var Box        = require("../math").box
var Entity     = require("../entity")
var Vector3    = require("../math").vec3
var collision  = require("../collision")

var health = {
  create: function create(id, pos, amount) {
    var ent = pickup.create(id, "health", pos, amount)
    ent.model = '/health.obj'
    return ent
  }
}

module.exports = health