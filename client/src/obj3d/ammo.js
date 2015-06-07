var loadmodel = require('../stage/loadmodel')
var colorChildren = require('../stage/colorchildren')

function Ammo (entity) {
  this.entity = entity
  this.o3d = new THREE.Object3D()

  loadmodel('/ammo.obj', function(mesh) {
    this.o3d.add(mesh)
    colorChildren(mesh.children, 0x5555FF)
  }.bind(this))
}

Ammo.prototype = {
  update: function update (dt) {
    var o3d = this.o3d
    var e = this.entity
    o3d.position.copy(e.position)
    o3d.rotation.y += 0.05
  }
}

module.exports = Ammo