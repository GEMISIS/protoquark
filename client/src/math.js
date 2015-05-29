var math = {
  maths: THREE.Math,
  vec3: THREE.Vector3,
  mat4: THREE.Matrix4,
  quat: THREE.Quaternion,
  triangle: THREE.Triangle,
  euler: THREE.Euler,
  box: THREE.Box3,
  plane: THREE.Plane,
  triangle: THREE.Triangle,

  isInside: function isInside(p, tri) {
    var Vector3 = math.vec3
    var a = tri.a
      , b = tri.b
      , c = tri.c
      , cb = new Vector3().subVectors(c, b)
      , ca = new Vector3().subVectors(c, a)
      , ba = new Vector3().subVectors(b, a)
      , ab = new Vector3().subVectors(a, b)
      , pa = new Vector3().subVectors(p, a)
      , pb = new Vector3().subVectors(p, b)
      , temp1 = new Vector3()
      , temp2 = new Vector3()

    if (temp1.crossVectors(cb, pb).dot(temp2.crossVectors(cb, ab)) < -Number.EPSILON)
      return false

    if (temp1.crossVectors(ca, pa).dot(temp2.crossVectors(ca, ba)) < -Number.EPSILON)
      return false

    return temp1.crossVectors(ba, pa).dot(temp2.crossVectors(ba, ca)) > -Number.EPSILON
  },

  // return lowest positive root by solving quadratic formula, returns infinity if no solution
  getLowestPositiveRoot: function getLowestPositiveRoot(a, b, c, max) {
      var determinant = b * b - 4 * a * c
      if (determinant < 0) return Number.POSITIVE_INFINITY

      var sqrtD = Math.sqrt(determinant)
      var r1 = (-b - sqrtD) / (2*a)
      var r2 = (-b + sqrtD) / (2*a)
      max = max || Number.POSITIVE_INFINITY

      if (r1 > 0 && r1 < r2 && r1 < max)
        return r1

      if (r2 > 0 && r2 < r1 && r2 < max)
        return r2

      return Number.POSITIVE_INFINITY
    }
}

module.exports = math