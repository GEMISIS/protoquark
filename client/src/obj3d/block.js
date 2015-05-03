var geometry;
function getGeometry() {
  if (!geometry) geometry = new THREE.BoxGeometry(1, 1, 1)
  return geometry
}

function Box (entity) {
  this.entity = entity
  this.o3d = new THREE.Object3D()

  var material = new THREE.MeshBasicMaterial({
    color: 0xFFF000
  })

  this.o3d.add(new THREE.Mesh(getGeometry(), material))
}

Box.prototype = {
  update: function update (dt) {
    var o3d = this.o3d
    var e = this.entity
    o3d.position.copy(e.position)
    o3d.rotation.setFromQuaternion(e.rotation)
  }
}

module.exports = Box