var loadOBJ = require('../stage/modelloader').loadOBJ
var colorChildren = require('../stage/colorchildren')

function Pickup(entity) {
  this.entity = entity
  this.o3d = new THREE.Object3D()

  if (entity.model) {
    loadOBJ(entity.model, function(mesh) {
      this.o3d.add(mesh)
      colorChildren(mesh.children, typeof entity.color === 'undefined' ? 0xFF5555 : entity.color)
    }.bind(this))
  }
}

Pickup.prototype = {
  update: function update (dt) {
    var o3d = this.o3d
    var e = this.entity
    o3d.position.copy(e.position)
    o3d.rotation.y += 0.05
    o3d.visible = !e.respawning
  }
}

module.exports = Pickup