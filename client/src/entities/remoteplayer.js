var bullets    = require("./bullets")
var weapons    = require("../config/weapon")

module.exports = function updateRemotePlayer (dt, ent) {
  // Note that since we dont know what order these events will arrive,
  // make sure Entity.prototype.trimSnapshots doesn't remove everything
  var conn = this.conn
  var player = conn.players[ent.context.id]
  var playerLatency = player && player.latency ? player.latency : .2
  var myLatency = player.latency || .2
  ent.newShot = false

  var lerpTime = Math.max(playerLatency/2 + myLatency/2 + this.sendInterval*2, .10)
  ent.interpolate(conn.getServerTime(), lerpTime)
  ent.trimSnapshots()

  if (ent.invincibility > 0)
    ent.invincibility -= dt

  var weapon = ent.weapon.active === "primary" ? ent.weapon.primary : ent.weapon.secondary
  if (!weapon) return
  weapon.shotTimer -= dt
  if (ent.control.shoot && weapon.shotTimer <= 0 && weapon.ammunition > 0) {
    weapon.shotTimer = 1 / weapons[weapon.id].firerate
    this.add(bullets.create(this.genLocalId(), ent, "normal"))
    weapon.ammunition--
    ent.newShot = true
  }
}