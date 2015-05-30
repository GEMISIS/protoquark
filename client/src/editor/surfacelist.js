var Triangle = THREE.Triangle
var Plane = THREE.Plane
var Matrix4 = THREE.Matrix4
var Vector3 = THREE.Vector3
var Vector4 = THREE.Vector4
var Ray = THREE.Ray
var isPointInsideXZ = require("./math").isPointInsideXZ

//
// Surface is any 'flat' non vertical surface - used for quick picking in 3d mode
//

function SurfaceList() {
  this.tris = []
  this.planes = []
}

SurfaceList.prototype = {
  addTri: function addTri(vertices, index, id) {
    var tri = new Triangle(vertices[index++], vertices[index++], vertices[index++])
      , plane = new Plane(tri.normal(), -tri.normal().dot(tri.a))

    plane.id = tri.id = id

    this.tris.push(tri)
    this.planes.push(plane)
  },

  // returns id of section picked or null
  pick: function pick(mouse, viewport, camera) {
    var halfWidth = (viewport.x || viewport.width) / 2
      , halfHeight = (viewport.y || viewport.height) / 2
      , ndcX = (mouse.x - halfWidth) / halfWidth
      , ndcY = (halfHeight - mouse.y) / halfHeight
      , projectionInverse = new Matrix4().getInverse(camera.projectionMatrix)
      , viewInverse = new Matrix4().getInverse(camera.matrixWorldInverse)
      , viewProjectionInverse = new Matrix4().multiplyMatrices(viewInverse, projectionInverse)
      , temp

    temp = new Vector4(ndcX, ndcY, -1, 1).applyMatrix4(projectionInverse)
    temp.multiplyScalar(1 / temp.w)
    var near = new Vector4().copy(temp).applyMatrix4(viewInverse)

    temp = new Vector4(ndcX, ndcY, 1, 1).applyMatrix4(projectionInverse)
    temp.multiplyScalar(1 / temp.w)
    var far = new Vector4().copy(temp).applyMatrix4(viewInverse)

    var ray = new Ray(new Vector3(near.x, near.y, near.z), new Vector3().subVectors(far, near).normalize())
      , nearestPlane
      , nearestDist = Number.POSITIVE_INFINITY
    for (var i = 0; i < this.tris.length; i++) {
      var plane = this.planes[i]
      var tri = this.tris[i]
      var dist = ray.distanceToPlane(plane)

      // Since all the surfaces lie flatly on the xz plane, we can make this assumption (for now, might have differing y values for a surface)
      // doing a <= check since distance might be same if coplanar but we know later sections are 'in front' of other sections
      // so this will provide the corret ordering
      var point = dist !== null ? ray.at(dist) : null
      if (dist !== null && dist <= nearestDist && isPointInsideXZ(point, [tri.a, tri.b, tri.c])) {
        nearestDist = dist
        nearestPlane = plane
      }
    }

    return {
      pick: !!nearestPlane,
      id: nearestPlane ? nearestPlane.id : null,
      ceiling: nearestPlane ? nearestPlane.normal.y < 0 : false
    }
  }
}

module.exports = SurfaceList
