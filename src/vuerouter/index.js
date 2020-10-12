let _Vue = null;

export default class VueRouter {
  static install(Vue) {
    if (VueRouter.install.installed) {
      return;
    }
    VueRouter.install.installed = true;

    _Vue = Vue;

    _Vue.mixin({
      beforeCreate() {
        if (this.$options.router) {
          _Vue.prototype.$router = this.$options.router;
          this.$options.router.init();
        }
      }
    });
  }

  constructor(options) {
    this.options = options;
    this.data = _Vue.observable({
      // 改动1：使用 # 之后的字符串作为 this.data.current
      // current: window.location.pathname
      current: window.location.hash.slice(1)
    });
    this.routeMap = {};
  }

  init() {
    this.createRouteMap();
    this.initComponents(_Vue);
    this.initEvent();
  }

  createRouteMap() {
    this.options.routes.forEach(route => {
      this.routeMap[route.path] = route.component;
    });
  }

  initComponents(Vue) {
    Vue.component("router-link", {
      props: {
        to: String
      },
      methods: {
        clickHandler(e) {
          // 改动2：点击链接直接修改 hash
          // history.pushState({}, "", this.to);
          // this.$router.data.current = this.to;
          window.location.hash = `#${this.to}`;

          e.preventDefault();
        }
      },
      render(h) {
        return h(
          "a",
          {
            attrs: {
              href: this.to
            },
            on: {
              click: this.clickHandler
            }
          },
          [this.$slots.default]
        );
      }
    });

    const self = this;
    Vue.component("router-view", {
      render(h) {
        const currentComponent =
          self.routeMap[self.data.current] || self.routeMap["*"];
        return h(currentComponent);
      }
    });
  }

  initEvent() {
    // 改动3：增加 hashchange 事件 -> 当 hash 发生变化时修改 this.data.current
    // window.addEventListener("popstate", () => {
    //   this.data.current = window.location.pathname;
    // });
    window.addEventListener("hashchange", () => {
      this.data.current = window.location.hash.slice(1);
    });
  }
}
