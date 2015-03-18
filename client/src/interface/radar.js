var range = 20

function Radar (engine) {
  this.engine = engine
  this.el = document.createElement("div")
  this.el.className = "radar noselect"
  this.markers = {}
}

Radar.prototype = {
  getMarker: function getMarker(ent) {
    var marker = this.markers[ent.id]
    if (marker) return marker

    marker = document.createElement("div")
    marker.className = "marker"
    this.markers[ent.id] = marker
    this.el.appendChild(marker)
    return marker
  },

  update: function update (dt) {
    var engine = this.engine
    var me = engine.you()
    var x, y

    if (!me) return

    for (var i=0; i<engine.entities.length; i++) {
      var ent = engine.entities[i]

      if (ent.type != "remoteplayer") continue

      if (me.position.distanceTo(ent.position) < range) {
        var dx = (ent.position.x - me.position.x) / range
        var dy = (ent.position.z - me.position.z) / range
        var cosTheta = Math.cos(me.euler.x)
        var sinTheta = Math.sin(me.euler.x)
        x = (0.5 + (dx * cosTheta + dy * sinTheta) * 0.5) * 100
        y = (0.5 + (dx * -sinTheta + dy * cosTheta) * 0.5) * 100
      }
      else {
        x = y = -10
      }

      var marker = this.getMarker(ent)
      marker.style.top = y + "%"
      marker.style.left = x + "%"
    }
  }
}

module.exports = Radar