var geometry, material;
function getGeometry() {
  if (!geometry) geometry = new THREE.BoxGeometry(0.1, 0.1, 0.3)
  return geometry
}
function getMaterial() {
  if (!material) {
    material = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF
    })
  }
  return material
}

function Bullet (entity) {
  this.entity = entity
  this.o3d = new THREE.Object3D()
  this.o3d.add(new THREE.Mesh(getGeometry(), getMaterial()))
}

Bullet.prototype = {
  update: function update (dt) {
    var o3d = this.o3d
    var e = this.entity
    o3d.position.copy(e.position)
    o3d.rotation.setFromQuaternion(e.rotation)
  }
}

module.exports = Player