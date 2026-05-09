Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/home/index',
        text: '回血',
        icon: '⌂'
      },
      {
        pagePath: '/pages/records/index',
        text: '记录',
        icon: '▤'
      },
      {
        pagePath: '/pages/settlement/index',
        text: '结算',
        icon: '♜'
      },
      {
        pagePath: '/pages/settings/index',
        text: '配置',
        icon: '⚙'
      }
    ]
  },

  methods: {
    onTabTap(e) {
      const { index } = e.currentTarget.dataset
      const item = this.data.list[index]
      if (!item || this.data.selected === index) return
      wx.switchTab({
        url: item.pagePath
      })
    },

    updateSelected() {
      const pages = getCurrentPages()
      if (!pages.length) return
      const current = '/' + pages[pages.length - 1].route
      const selected = this.data.list.findIndex((item) => item.pagePath === current)
      if (selected >= 0 && selected !== this.data.selected) {
        this.setData({ selected })
      }
    }
  },

  lifetimes: {
    attached() {
      this.updateSelected()
    }
  },

  pageLifetimes: {
    show() {
      this.updateSelected()
    }
  }
})
