var Box        = require("../math").box
var Entity     = require("../entity")
var Vector3    = require("../math").vec3
var collision  = require("../collision")

var ammo = {
  create: function create(id, pos, amount) {
    var ent = new Entity({id: id}, id)
    ent.update = ammo.updateAmmo

    ent.position.copy(pos)
    ent.shape = new Vector3(.1, .1, .1)

    ent.type = "ammo"

    ent.amount = amount
    ent.box = new Box(new Vector3(-0.25, -0.25, -0.25), new Vector3(0.25, 0.25, 0.25))

    return ent
  },

  updateAmmo: function updateAmmo (dt, ent) {
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
        this.addStateCommand({command: "ammo", target: other.id, amount: ent.amount})
        // cheap hack for now to hide ammo while it respawns / dont delete
        ent.respawning = true
        if (this.conn.isServer()) {
          this.respawnTime = this.conn.getServerTime() + 10
        }

        // ent.markedForDeletion = true
        break
      }
    }
  }
}

module.exports = ammo