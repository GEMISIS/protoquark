var pickup     = require("./pickup")
var Box        = require("../math").box
var Entity     = require("../entity")
var Vector3    = require("../math").vec3
var collision  = require("../collision")

var weapon = {
  create: function create(id, pos, amount) {
    var ent = pickup.create(id, "weapon", pos, amount)
    // !TODO! Actual weapon model.
    ent.model = '/ammo.obj'
    ent.color = 0xFFFFFF
    return ent
  }
}

module.exports = weapon