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
  },

  sniper: {
    ammunition: 20,
    automatic: false,
    firerate: .33,
    damage: 1,
    speed: 200,
    recoil: 0,
    name: "Sniper Rifle"
  },

  assault: {
    ammunition: 100,
    automatic: true,
    firerate: 5,
    damage: .50,
    speed: 200,
    recoil: 5,
    name: "Assault Rifle"
  }
}