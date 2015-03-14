function Radar (engine) {
  this.engine = engine
  this.el = document.createElement("div")
  this.el.className = "radar noselect"
  this.markers = {}
}

Radar.prototype = {
  update: function update (dt) {
    var engine = this.engine
    var me = engine.you()

    if (!me) return

    for (var i=0; i<engine.entities.length; i++) {
      var ent = engine.entities[i]
      if (me == ent || ent.type != "player") continue

      var marker = this.getMarker(ent)
      marker.style.top = "0%"
      marker.style.left = "0%"
    }
  }
}