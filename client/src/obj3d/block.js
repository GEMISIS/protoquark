var geometry;
function getGeometry() {
  if (!geometry) geometry = new THREE.BoxGeometry(1, 1, 1)
  return geometry
}

function Box (entity) {
  this.entity = entity
  this.o3d = new THREE.Object3D()

  var material = new THREE.MeshBasicMaterial({
    color: typeof entity.context.color === 'string' ? parseInt(entity.context.color, 16) : 0xFFF000
  })

  this.o3d.add(new THREE.Mesh(getGeometry(), material))

  var scale = entity.context.scale || {x: 1, y: 1, z: 1}
  // Setting directly a new scale seems to bug out for some reason
  this.o3d.scale.x = scale.x
  this.o3d.scale.y = scale.y
  this.o3d.scale.z = scale.z
  this.o3d.updateMatrix()
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