var Box = require("../math").box
var math = require("../math")
var Vector3 = math.vec3

function Health (entity) {
  this.entity = entity
  this.o3d = new THREE.Object3D()
  this.box = new Box(new Vector3(-0.25, -0.25, -0.25), new Vector3(0.25, 0.25, 0.25))

  var self = this
  var loader = new THREE.OBJLoader()
  loader.load('../health.obj', function (object) {
    self.o3d.add(object)
    for ( var i = 0; i < self.o3d.children[0].children.length; i++ ) {
      self.o3d.children[0].children[i].material.color.setHex(0xFF0000)
    }
  })
}

Health.prototype = {
  update: function update (dt) {
    if(this.o3d != undefined) {
      var o3d = this.o3d
      var e = this.entity
      o3d.position.copy(e.position)
      o3d.rotation.y += 0.05
    }
  }
}

module.exports = Health