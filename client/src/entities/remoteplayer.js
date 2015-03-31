var bullets    = require("./bullets")
var weapons    = require("../config/weapon")

module.exports = function updateRemotePlayer (ent, dt) {
  // Note that since we dont know what order these events will arrive,
  // make sure Entity.prototype.trimSnapshots doesn't remove everything
  var conn = this.conn
  var player = conn.players[ent.context.id]
  var playerLatency = player && player.latency ? player.latency : .2
  var myLatency = conn.latency || .2

  var lerpTime = Math.max(playerLatency/2 + myLatency/2 + this.sendInterval*2, .10)
  ent.interpolate(conn.getServerTime(), lerpTime)
  ent.trimSnapshots()

  var weapon = ent.weapon.primary
  weapon.shotTimer -= dt
  if (ent.control.shoot && weapon.shotTimer <= 0) {
    weapon.shotTimer = 1 / weapons[weapon.id].firerate
    this.add(bullets.create(this.genLocalId(), ent, "normal"))
  }
}