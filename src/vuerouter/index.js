let _Vue = null;

export default class VueRouter {
  // 在 @/router/index.js 中会调用 Vue.use(VueRouter)，这时 Vue 会自动运行下面这个静态方法 install
  static install(Vue) {
    // 1. 判断当前插件是否已经被安装
    if (VueRouter.install.installed) {
      return;
    }
    VueRouter.install.installed = true;
    // 为什么使用 `VueRouter.install` 而不是 `this.install`？？
    // 首先 VueRouter 类中的静态方法是 VueRouter 这个类共享的
    // 并且 静态方法先于构造函数执行
    // this 和 super 指向类的实例，实例只有在类被创建（构造）后才存在
    // 所以 类的静态方法中不能使用 this 和 super，而直接使用`类名.静态方法`是可以的

    // 因为要在 Vue 的实例方法中使用构造函数，比如在创建组件时要使用 `Vue.component`，所以->
    // 2. 把 Vue 构造函数记录到全局变量
    _Vue = Vue;

    // 3. 把创建 Vue 实例时传入的 router 对象注入到“所有” Vue 实例上
    // 要让所有的实例共享一个成员->prototype，那么想到写：
    // _Vue.prototype.$router = this.$options.router，但是：
    // 这里的 this 指向 VueRouter（因为谁调用install，this就指向谁）
    // 我们需要让这里的 this 指向 Vue 实例
    // 那么只能使用 -> 混入，即：
    // 对所有的 Vue 实例 混入一个选项 -> beforeCreate
    _Vue.mixin({
      beforeCreate() {
        // Vue 的组件中不会存在 $options.router，所以用这个方法排除 Vue 的组件
        if (this.$options.router) {
          // 只有 Vue 的 非组件的 实例会运行下面这句代码
          _Vue.prototype.$router = this.$options.router;
          // 在 Vue 的实例中运行 $options.router.init() 方法
          this.$options.router.init();
        }
      }
    });
  }

  constructor(options) {
    // 记录在 @/router/index.js 中对 VueRouter 进行实例化时：
    // const router = new VueRouter({ routes });
    // 传入的这个参数：路由规则 { routes }
    this.options = options;
    // data 是一个响应式的对象
    // Vue 提供的静态方法 observable 用来创建响应式对象，用来渲染函数和计算属性
    this.data = _Vue.observable({
      // 这样 current 就是一个响应式对象了
      // 将其设置成当前页面路由而非写死成"/"可以防止页面刷新时总是渲染成"/"的bug
      current: window.location.pathname
    });
    // routeMap 是经过解析的路由信息（由 options 传入）
    // routeMap 对象中 「键」是路由地址string 「值」是此路由对应的需要渲染的组件
    this.routeMap = {};
  }

  // init 方法 包装下面的一系列方法，在静态 install 方法中被调用
  init() {
    this.createRouteMap();
    // 此处直接传入全局变量 _Vue
    this.initComponents(_Vue);
    this.initEvent();
  }

  // 解析实例化时传入的 routes/options 对象，存储到 this.routeMap 里
  // 从而，当路由地址发生变化时，可以及时找到对应的需要渲染的组件
  createRouteMap() {
    // 解析方法：遍历所有的路由规则，即：传入的 options，即： { routes: [{...}, {...}] }）
    // 把这些规则解析成键值对的形式：「键」是路由地址string 「值」是此路由对应的需要渲染的组件
    this.options.routes.forEach(route => {
      this.routeMap[route.path] = route.component;
    });
  }

  // 创建 <router-link> 和 <router-view> 组件
  // 此处传入 Vue 这个类是为了减少对外部依赖（比不传 Vue 而直接在函数中使用 _Vue 要好一些）
  initComponents(Vue) {
    // 使用 Vue 提供的 component 方法注册新组件
    Vue.component("router-link", {
      props: {
        to: String
      },
      // 注册点击事件
      methods: {
        clickHander(e) {
          // 1. 修改地址栏路由
          // 传参：pushState(data: any, title: string, url?: string): void
          history.pushState({}, "", this.to);
          // 2. 更新响应式 VueRouter.data.current 路由
          // 此处 this 指向 Vue 这个类，在静态函数 install 中已经将 router 挂载在 Vue 的原型中的 $router 上了，所以：
          this.$router.data.current = this.to;
          // 3. 阻止页面刷新
          e.preventDefault();
        }
      },
      // 如果只使用默认的「运行时」版本的 Vue，则需要自己写 render 函数，将 template 编译成可渲染的虚拟dom
      render(h) {
        // h 函数的作用是创建虚拟dom，这里返回创建的虚拟dom
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
      // 如果在配置文件 vue.config.js 中配置 `runtimeCompiler: true` 则可以：
      // 这里使用 slot 插槽实现模板的功能
      // template: "<a :href='to'><slot></slot></a>"
    });

    // 将 VueRouter 实例保存在 self 中
    const self = this;
    Vue.component("router-view", {
      render(h) {
        // 这里的 this 指向 Vue 这个类，所以使用上面保存的 self 来获取 routeMap
        // 当找不到路由时渲染”*“对应的组件（一般为404页面）
        const currentComponent =
          self.routeMap[self.data.current] || self.routeMap["*"];
        return h(currentComponent);
      }
      // 如果在配置文件 vue.config.js 中配置 `runtimeCompiler: true` 则可以：
      // template: self.routeMap[self.data.current]
    });
  }

  // 使用浏览器的前进和后退时路由发生改变触发 popstate 事件，当该事件发生时需要渲染当下路由对应的组件
  // 更新响应式 data.current 来使 <router-view> 组件得到更新
  initEvent() {
    window.addEventListener("popstate", () => {
      this.data.current = window.location.pathname;
    });
  }
}
