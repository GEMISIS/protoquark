var loadOBJ = require('../stage/modelloader').loadOBJ

function Model(entity) {
  this.entity = entity
  this.o3d = new THREE.Object3D()

  loadOBJ(entity.context.model, entity.context.material, function(mesh) {
    this.o3d.add(mesh)
  }.bind(this))

  // var colors = [ 0x000000, 0xff0080, 0x8000ff, 0xffffff ];
  // var geometry = new THREE.Geometry();

  // for ( var i = 0; i < 2000; i ++ ) {
  //   var vertex = new THREE.Vector3();
  //   vertex.x = Math.random() * 4 - 2;
  //   vertex.y = Math.random() * 4 - 2;
  //   vertex.z = Math.random() * 4 - 2;
  //   geometry.vertices.push( vertex );

  //   geometry.colors.push( new THREE.Color( colors[ Math.floor( Math.random() * colors.length ) ] ) );
  // }
  // var material = new THREE.PointCloudMaterial( { size: 10, vertexColors: THREE. VertexColors, depthTest: false, opacity: 0.5, sizeAttenuation: false, transparent: false } );

  // var mesh = new THREE.PointCloud( geometry, material );
  // this.o3d.add( mesh );
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