# Lagou Edu Assignment Part 3 Module 1 VueRouter Code

**手写 VueRouter 代码：请访问`/src/vuerouter`文件夹**

## 3 处修改

较 history 模式的 VueRouter，hash 模式有 3 处变化：

### 修改 1

```js
export default class VueRouter {
  constructor(options) {
    this.options = options
    this.data = _Vue.observable({
      // 改动1：使用 # 之后的字符串作为 this.data.current
      // current: window.location.pathname
      current: window.location.hash.slice(1),
    })
    this.routeMap = {}
  }
}
```

### 修改 2

```js
export default class VueRouter {
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
      render(h) {...}
    });
  }
}
```

### 修改 3

```js
export default class VueRouter {
  initEvent() {
    // 改动3：增加 hashchange 事件 -> 当 hash 发生变化时修改 this.data.current
    // window.addEventListener("popstate", () => {
    //   this.data.current = window.location.pathname;
    // });
    window.addEventListener('hashchange', () => {
      this.data.current = window.location.hash.slice(1)
    })
  }
}
```

## 安装和测试

```
yarn install
```

### Compiles and hot-reloads for development

```
yarn serve
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
