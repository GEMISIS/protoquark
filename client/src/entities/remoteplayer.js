module.exports = function updateRemotePlayer (dt, ent) {
  // Note that since we dont know what order these events will arrive,
  // make sure Entity.prototype.trimSnapshots doesn't remove everything
  var conn = this.conn
  var player = conn.players[ent.context.id]
  var playerLatency = player && player.latency ? player.latency : .2
  var myLatency = conn.latency || .2

  var lerpTime = Math.max(playerLatency/2 + myLatency/2 + SEND_INTERVAL*2, .10)
  ent.interpolate(conn.getServerTime(), lerpTime)
  ent.trimSnapshots()
}