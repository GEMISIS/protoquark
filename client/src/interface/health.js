function Health (engine) {
  this.engine = engine
  this.el = document.createElement('div')
  this.el.className = 'health'
  this.bar = document.createElement('div')
  this.bar.className = 'bar'
  this.el.appendChild(this.bar)
  this.last = 100
  this.test = 100
  this.increment = 1
}

Health.prototype = {
  update: function update (dt) {
    this.test += this.increment * dt
    if (this.test <= 0) {
      this.increment = 5
    }
    else if (this.test >= 100) {
      this.increment = -5
    }

    var me = this.engine.you()

    if (!me) return

    var el = this.el
    var p = this.test

    this.bar.style.width = p + '%'

    if (p <= 30 && !el.classList.contains('danger')) {
      el.classList.remove('warning')
      el.classList.add('danger')
    }
    else if (p > 30 && p <= 50 && !el.classList.contains('warning')) {
      el.classList.remove('danger')
      el.classList.add('warning')
    }
    else if (p > 50) {
      if (el.classList.contains('danger'))
        el.classList.remove('danger')
      if (el.classList.contains('warning'))
        el.classList.remove('warning')
    }

    this.last = p
  }
}

module.exports = Health