var Entity   = require("../entity")
var Vector3  = require("../math").vec3

var decal = {
  create: function create(id, position, direction) {
    var ent = new Entity(id)

    ent.position.copy(position)
    ent.direction = new Vector3().copy(direction)

    ent.type = "decal"

    return ent
  },
}

module.exports = decal
