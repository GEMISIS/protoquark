// async obj and json model loader
// caches model if already loaded
var meshesOBJ = {}
var geometryJSON = {}
var materialsJSON = {}

function loadOBJ(modelfile, materialfile, onsuccess) {
  if (!modelfile) return
  onsuccess = typeof materialfile === 'function' ? materialfile : onsuccess
  materialfile = typeof materialfile === 'function' ? null : materialfile

  if (meshesOBJ[modelfile]) {
    return onsuccess(meshesOBJ[modelfile])
  }

  var loader = materialfile ? new THREE.OBJMTLLoader() : new THREE.OBJLoader()
  var onloaded = function (mesh) {
    meshesOBJ[modelfile] = mesh
    onsuccess(mesh)
  }

  if (materialfile)
    loader.load(modelfile, materialfile, onloaded)
  else
    loader.load(modelfile, onloaded)
}

/**
  * Load three.js json model with options.
  * onsuccess will get passed in the created geometry and supplied material
  * param {object} opts - options object
  * param {string} opts.modelfile - required
  * param {string} opts.texturepath - optional, if set opts.material is ignored. Only one of opts.material or opts.texturepath may be set
  * param {THREE.material} opts.material - optional, material that will override any defined in the json file.
  */
function loadJSON(opts, onsuccess) {
  var modelfile = opts.modelfile
  var texturepath = opts.texturepath

  if (geometryJSON[modelfile]) {
    return onsuccess(geometryJSON[modelfile], opts.material ? opts.material : materialsJSON[modelfile])
  }

  var loader = new THREE.JSONLoader()
  loader.load(modelfile, function(geometry, materials) {
    geometryJSON[modelfile] = geometry
    var material = new THREE.MeshFaceMaterial(materials)
    materialsJSON[modelfile] = material

    if (onsuccess) onsuccess(geometry, opts.material ? opts.material : material)
  }, texturepath)
}

module.exports = {
  loadOBJ: loadOBJ,
  loadJSON: loadJSON
}
