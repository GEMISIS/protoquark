var Maths = require("./math").maths
var Vec3 = require("./math").vec3
var Quat = require("./math").quat

function Entity() {
  this.position = new Vec3()

  // ordered array of snapshots based on time with most recent snapshot at end of list.
  this.snapshots = []
}

Entity.prototype = {
  getSnapshot: function getSnapshot(time) {
    var snapshots = this.snapshots

    if (!snapshots.length)
      return {}

    // Time is more recent than any entry. Return most recent
    if (time > snapshots[snapshots.length - 1].time) 
      return snapshots[snapshots.length - 1];

    // Time is older than any snapshot. Return oldest snapshot
    if (time < snapshots[0].time)
      return snapshots[0]

    // Lerp between snapshots, find lower time first
    for (var i = snapshots.length - 2; i > -1; i--) {
      if (snapshots[i].time < time) {
        // Snapshot between i and i + 1
        break;
      }
    }
  },
}
module.exports = Entity