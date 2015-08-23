//
// Note that damage of 1 if full health
// Damage of .5 is half
// etc
//

module.exports = {
  pistol: {
    ammunition: 50,
    automatic: false,
    firerate: 4,
    damage: .34,
    speed: 90,
    name: "Pistol",
    recoil: 0,
    model: "/models/pistol.json",
    shootAnimation: 'pistol_shoot',
    reloadAnimation: 'pistol_reload',
  },

  sniper: {
    ammunition: 20,
    automatic: false,
    firerate: .33,
    damage: 1,
    speed: 200,
    recoil: 0,
    name: "Sniper Rifle",
    model: "/models/sniper.json",
    shootAnimation: 'sniper',
  },

  shotgun: {
    ammunition: 20,
    automatic: false,
    firerate: .33,
    damage: 1,
    speed: 200,
    recoil: 0,
    name: "Shotgun",
    model: "/models/shotgun.json",
    shootAnimation: 'shotgun',
  },

  smg: {
    ammunition: 100,
    automatic: true,
    firerate: 5,
    damage: .50,
    speed: 200,
    recoil: 5,
    name: "SMG",
    model: "/models/smg.json",
    shootAnimation: 'smg_shoot',
    reloadAnimation: 'assault_reload',
  },

  assault: {
    ammunition: 100,
    automatic: true,
    firerate: 5,
    damage: .50,
    speed: 200,
    recoil: 5,
    name: "Assault Rifle",
    model: "/models/assault.json",
    shootAnimation: 'assault_shoot',
    reloadAnimation: 'assault_reload',
  }
}