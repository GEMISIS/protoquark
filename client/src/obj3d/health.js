var Box = require("../math").box
var math = require("../math")
var Vector3 = math.vec3

function Health (entity) {
  this.entity = entity
  this.o3d = new THREE.Object3D()

  var self = this
  var loader = new THREE.OBJLoader()
  loader.load('/health.obj', function (object) {
    self.o3d.add(object)
    setColor(object.children, 0xFF0000)
  })
}

Health.prototype = {
  update: function update (dt) {
    var o3d = this.o3d
    var e = this.entity
    o3d.position.copy(e.position)
    o3d.rotation.y += 0.05
  }
}

function setColor(children, color) {
  for (var i = 0; i < children.length; i++) {
    children[i].material.color.setHex(color)
  }
}

module.exports = Health