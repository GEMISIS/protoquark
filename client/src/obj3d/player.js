function Player (entity, geo, color) {
  this.entity = entity
  this.o3d = new THREE.Object3D()

  var material = new THREE.MeshBasicMaterial({
    color: color || 0xff0000
  })
  var geometry = geo || new THREE.BoxGeometry(1, 1, 1)
  var mesh = new THREE.Mesh(geometry, material)

  this.o3d.add(mesh)
}

Player.prototype = {
  update: function update (dt) {
    var o3d = this.o3d
    var e = this.entity
    o3d.position.copy(e.position)
    o3d.rotation.setFromQuaternion(e.rotation)
  }
}

module.exports = Player