var configs = require('../config/weapon')

var weapons = ['primary', 'secondary']

function createWeaponLabel (name) {
  var el = document.createElement("label")
  el.className = name
  addSpan('wepname', el)
  addSpan('clip', el)
  addSpan('ammunition', el)
  return el
}

function addSpan (name, el) {
  var span = document.createElement('span')
  span.className = name
  el[name] = span
  el.appendChild(span)
}

function swapWeapon(el, weaponId) {
  var weapon = configs[weaponId]
  el.wepname.textContent = weapon.name
}

function updateAmmunition(el, amount) {
  if (el.ammunition.amount != amount) {
    if (amount == null) {
      el.ammunition.textContent = "∞"
    }
    else {
      el.ammunition.textContent = ("00" + amount).slice(-3)
    }

    if (amount == 0) {
      el.ammunition.classList.add('empty')
    }
    else if (amount != 0) {
      el.ammunition.classList.remove('empty')
    }
  }

  el.ammunition.amount = amount
}

function updateClip(el, amount) {
  if (el.clip.amount != amount) {
    el.clip.textContent = ("0" + amount).slice(-2) + " / "
  }
  el.clip.amount = amount
}

function Weapon (engine) {
  this.current = {}
  this.engine = engine
  this.el = document.createElement("div")
  this.el.className = "weapon"
  this.primary = createWeaponLabel('primary')
  this.secondary = createWeaponLabel('secondary')
  this.el.appendChild(this.primary)
  this.el.appendChild(this.secondary)
}

Weapon.prototype = {
  update: function update (dt) {
    var me = this.engine.you()

    if (!me) return

    if (me.weapon.active != this.current.active) {
      if (this.current.active)
        this[this.current.active].classList.remove('active')
      this[me.weapon.active].classList.add('active')
      this.current.active = me.weapon.active
    }

    for (var i = 0; i < weapons.length; i++) {
      var weap = weapons[i]

      if (!me.weapon[weap]) continue

      if (me.weapon[weap].id != this.current[weap]) {
        swapWeapon(this[weap], me.weapon[weap].id)
        this.current[weap] = me.weapon[weap].id
      }

      updateAmmunition(this[weap], me.weapon[weap].ammunition)
      updateClip(this[weap], me.weapon[weap].clip)
    }
  }
}

module.exports = Weapon