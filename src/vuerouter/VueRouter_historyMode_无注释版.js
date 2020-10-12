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
      current: window.location.pathname
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
        clickHander(e) {
          history.pushState({}, "", this.to);

          this.$router.data.current = this.to;

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
              click: this.clickHander
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
    window.addEventListener("popstate", () => {
      this.data.current = window.location.pathname;
    });
  }
}
