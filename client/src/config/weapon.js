//
// Note that damage of 1 if full health
// Damage of .5 is half
// etc
//
// readyTime uses either the reloadAnimation (if it has one), or shootAnimation otherwise.
// It is the start time into the animation to play when switching weapons.
//

module.exports = {
  pistol: {
    ammunition: 50,
    clip: 3,
    automatic: false,
    firerate: 4,
    reloadTime: 1.5,
    damage: .34,
    speed: 90,
    name: "Pistol",
    recoil: 0,
    model: "/models/pistol.json",
    shootAnimation: "pistol_shoot",
    reloadAnimation: "pistol_reload",
    readyTime: .84
  },

  // Note due to the animations in sinper and shotgun, they should only have a clip of size 1
  sniper: {
    ammunition: 20,
    clip: 1,
    automatic: false,
    firerate: .33,
    reloadTime: 5.0,
    damage: 1,
    speed: 200,
    recoil: 0,
    name: "Sniper Rifle",
    model: "/models/sniper.json",
    shootAnimation: "sniper",
  },

  shotgun: {
    ammunition: 20,
    clip: 1,
    automatic: false,
    firerate: .75,
    reloadTime: 3.0,
    damage: 1,
    speed: 100,
    recoil: 0,
    name: "Shotgun",
    model: "/models/shotgun.json",
    shootAnimation: "shotgun",
    readyTime: .84
  },

  smg: {
    ammunition: 100,
    clip: 30,
    automatic: true,
    firerate: 10,
    reloadTime: 2.5,
    damage: .25,
    speed: 200,
    recoil: 5,
    name: "SMG",
    model: "/models/smg.json",
    shootAnimation: "smg_shoot",
    reloadAnimation: "assault_reload",
    readyTime: .90
  },

  assault: {
    ammunition: 100,
    clip: 20,
    automatic: true,
    firerate: 5,
    reloadTime: 2.5,
    damage: .50,
    speed: 150,
    recoil: 5,
    name: "Assault Rifle",
    model: "/models/assault.json",
    shootAnimation: "assault_shoot",
    reloadAnimation: "assault_reload",
    readyTime: .90
  }
}