var range = 10

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

    if (!me) return

    for (var i=0; i<engine.entities.length; i++) {
      var ent = engine.entities[i]

      if (me == ent || ent.type != "remoteplayer") continue

      var x = (ent.position.x - me.position.x) / range
      var y = (ent.position.z - me.position.z) / range

      // Standard 2d rotation matrix
      var cosTheta = Math.cos(me.euler.y)
      var sinTheta = Math.sin(me.euler.y)
      var transformedX = x * cosTheta + y * sinTheta
      var transformedY =  x * -sinTheta + y * cosTheta

      var marker = this.getMarker(ent)
      marker.style.top = ((0.5 + transformedY * 0.5) * 100) + "%"
      marker.style.left = ((0.5 + transformedX * 0.5) * 100) + "%"
    }
  }
}

module.exports = Radar