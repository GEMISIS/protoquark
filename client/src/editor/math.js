module.exports = {
  deg2rad: function deg2rad(deg) {
    return deg * Math.PI / 180
  },

  // http://www.mathopenref.com/coordpolygonarea2.html
  computePointsArea: function computePointsArea(points) {
    var area = 0         // Accumulates area in the loop
      , j = points.length-1  // The last vertex is the 'previous' one to the first

    for (i = 0; i < points.length; i++) {
      area = area +  (points[j].x + points[i].x) * (points[j].y-points[i].y)
      j = i
    }
    return area / 2
  },

  // https://github.com/substack/point-in-polygon
  isPointInside: function isPointInside(point, points) {
    var x = point.x, y = point.y
    var inside = false
    for (var i = 0, j = points.length - 1; i < points.length; j = i++) {
        var xi = points[i].x, yi = points[i].y
        var xj = points[j].x, yj = points[j].y
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
        if (intersect) inside = !inside;
    }
    return inside;
  }
}