var Maths = require("./math").maths
var Vec3 = require("./math").vec3
var Quat = require("./math").quat

function Entity(context) {
  this.context = context

  this.position = new Vec3()
  this.rotation = new Quat()

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
        var snapshotBefore = snapshots[i]
          , snapshotAfter = snapshots[i + 1]
          , t = (time - snapshotBefore.time) / (snapshotAfter.time - snapshotBefore.time)
          , position = new Vec3(snapshotBefore.x, snapshotBefore.y, snapshotBefore.z).lerp(snapshotAfter, t)
          , rotation = new Quat()

        Maths.slerp(rotation, snapshotBefore.rotation, snapshotAfter.rotation, t)

        return this.createSnapshot(time, position, rotation)
      }
    }
  },

  createSnapshot: function createSnapshot(time, position, rotation) {
    return {
      time: time,
      position: position,
      rotation: rotation
    }
  }
}

module.exports = Entity
