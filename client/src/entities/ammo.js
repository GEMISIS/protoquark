var pickup     = require("./pickup")
var Box        = require("../math").box
var Entity     = require("../entity")
var Vector3    = require("../math").vec3
var collision  = require("../collision")

var ammo = {
  create: function create(id, pos, amount) {
    var ent = pickup.create(id, "ammo", pos, amount)
    ent.model = '/models/ammo.obj'
    ent.color = 0x5555FF
    return ent
  }
}

module.exports = ammo