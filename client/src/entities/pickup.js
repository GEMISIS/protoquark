var Box        = require("../math").box
var Entity     = require("../entity")
var Vector3    = require("../math").vec3
var collision  = require("../collision")

var pickup = {
  create: function create(id, type, pos, amount) {
    var ent = new Entity({id: id}, id)
    ent.update = pickup.update
    ent.type = type

    ent.position.copy(pos)
    ent.shape = new Vector3(.1, .1, .1)

    ent.amount = amount
    ent.box = new Box(new Vector3(-0.25, -0.25, -0.25), new Vector3(0.25, 0.25, 0.25))

    return ent
  },

  update: function updatePickup(dt, ent) {
    if (ent.respawning && this.conn.getServerTime() > ent.respawnTime)
      ent.respawning = false

    if (ent.respawning) return

    // TODO: Use some type of tree to limit number of entities checked
    var entities = this.entities
    for (var i = 0; i < entities.length; i++) {
      var other = entities[i]
      var hit = collision.collides(ent, other)
      // only send commands about ourself
      if (hit && other.type == "player") {
          this.addStateCommand({command: ent.type, target: other.id, amount: ent.amount})
          ent.respawning = true
          this.addItemState(ent, "respawnTime", this.conn.getServerTime() + 8 + Math.random() * 5)
          // ent.markedForDeletion = true
          break
        }
      }
  }
}

module.exports = pickup