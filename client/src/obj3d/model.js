
// generic representation with obj file

var models = []

function loadModel() {
  var entity = this.entity
    , material = entity.context.material
    , model = entity.context.model

  if (!model) return
  if (models[model]) {
    return this.o3d.add(models[model])
  }

  var loader = material ? new THREE.OBJMTLLoader() : new THREE.OBJLoader()
  var onload = function (object) {
    this.o3d.add(object)
    models[entity.model] = object
  }.bind(this)

  var onerror = function(e) {
    console.log("error", e)
  }

  if (material)
    loader.load(model, material, onload, undefined, onerror)
  else
    loader.load(model, onload, undefined, onerror)
}

function Model (entity) {
  this.entity = entity
  this.o3d = new THREE.Object3D()

  loadModel.call(this)
}

module.exports = Model
