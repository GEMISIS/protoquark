
var loadmodel = require('../stage/loadmodel')

function Model (entity) {
  this.entity = entity
  this.o3d = new THREE.Object3D()

  loadmodel(entity.context.model, entity.context.material, function(mesh) {
    this.o3d.add(mesh)
  }.bind(this))
}

Model.prototype = {
  update: function update (dt) {
    var o3d = this.o3d
    var e = this.entity
    o3d.position.copy(e.position)
    o3d.rotation.setFromQuaternion(e.rotation)
  }
}

module.exports = Model