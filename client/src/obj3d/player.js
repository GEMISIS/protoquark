function hashCode(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return hash
}

function intToARGB(i){
    return ((i>>24)&0xFF).toString(16) +
           ((i>>16)&0xFF).toString(16) +
           ((i>>8)&0xFF).toString(16) +
           (i&0xFF).toString(16)
}

var geometry;
function getGeometry() {
  if (!geometry) geometry = new THREE.BoxGeometry(1, 1, 1)
  return geometry
}

function Player (entity) {
  this.entity = entity
  this.o3d = new THREE.Object3D()

  var material = this.material = new THREE.MeshBasicMaterial({
    //color: intToARGB(hashCode(entity.context.id))
    color: 0xAAAAAA,
    transparent: true,
    opacity: 1.0
  })

  this.o3d.add(new THREE.Mesh(getGeometry(), material))
}

Player.prototype = {
  update: function update (dt) {
    var o3d = this.o3d
    var e = this.entity
    o3d.position.copy(e.position)
    o3d.rotation.setFromQuaternion(e.rotation)

    // blink if invincible
    var blinkInterval = .5
    if (e.invincibility && e.invincibility > 0) {
      this.material.opacity = Math.cos(e.invincibility / blinkInterval * 2 * Math.PI) * .5 + .5
    }
    else {
      this.material.opacity = 1
    }
  }
}

module.exports = Player