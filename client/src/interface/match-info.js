var ce = require('../eltree')

function onMatchFinished (scores) {
  this.scores = scores
  this.el.classList.add("active")
  this.render()
}

function onHideMatchInfo() {
  this.el.classList.remove("active")
}

function MatchInfo (engine) {
  this.engine = engine
  this.tree = ce({
    tagName: 'div',
    className: 'matchInfo',
    textContent: 'Match Over',
    children: [{
      key: 'table',
      tagName: 'table',
      children: [{
        tagName: 'thead',
        children: [{
          key: 'row',
          tagName: 'tr',
          children: [
          { tagName: 'th', textContent: 'Rank' },
          { tagName: 'th', textContent: 'Player'},
          { tagName: 'th', textContent: 'Score'}
          ]
        }]
      }, {
        key: 'body',
        tagName: 'tbody'
      }]
    }]
    // {
    //   key: 'button',
    //   tagName: 'button',
    //   textContent: 'Close',
    // }]
  })
  if(this.tree.children.button !== undefined) {
    this.tree.children.button.el.onclick = onHideMatchInfo.bind(this)
  }
  this.el = this.tree.el
  this.scores = []

  engine.on('matchFinished', onMatchFinished.bind(this))
  engine.on('hideMatchInfo', onHideMatchInfo.bind(this))
}

MatchInfo.prototype = {
  open: function open () {
    this.el.classList.add("active")
    this.render()
  },
  close: function close () {
    this.el.classList.remove("active")
  },
  toggle: function toggle () {
    this.el.classList.toggle('active')
  },
  render: function render () {
    var body = this.tree.children.table.children.body.el
    while (body.firstChild) {
      body.removeChild(body.firstChild)
    }

    var scores = this.scores
    if(scores !== undefined)
    {
      Object.keys(this.scores).map(function(key) {
        return scores[key]
      }).sort(function (a, b) {
        if (a.score > b.score) return -1
        if (a.score < b.score) return 1
        return 0
      }).forEach(function (item, index, arr) {
        stats = [
          { tagName: 'td', textContent: index + 1 },
          { tagName: 'td', textContent: item.name },
          { tagName: 'td', textContent: item.score }
          ];
        body.appendChild(ce({
          tagName: 'tr',
          children: stats
        }).el)
      })
    }
  }
}

module.exports = MatchInfo