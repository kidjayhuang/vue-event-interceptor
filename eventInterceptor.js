/**
 * @author  huangjiehong
 * @date   2018-10-19
 * vue全局methods拦截器,从routes的每个component函数返回值中劫持methods方法集合，达到拦截的目的
 */
function eventInterceptor (routerInstance) {
  for (let k in routerInstance.options.routes) { //遍历路由实例，获取所有单页面组件
    let singleCom = routerInstance.options.routes[k].component
    outerRecursion(singleCom)
  }
  return routerInstance
}

/**
 * 外层递归函数，主要判断组件是异步引用还是同步引用，异步引用是一个返回promise对象的函数，同步引用是一个对象，最终统一为一个组件对象传给内递归函数
 * @param {Object} component router的各个component对象
 */
function outerRecursion (ele) {
  if (typeof ele === 'function') {
    // 1: 用函数的方式异步加载  写法：const Wheel = () => import('wheel')
    ele().then(e => {
      // 要是有报错 Cannot read property 'then' of undefined 证明某个页面把函数写在了components里面
      innerRecursion(e.default)
    })
  } else {
    // 2: 直接加载，同步 写法：import Register from '../page/register'
    innerRecursion(ele)
  }
}

/**
 * 内层递归函数，遍历组件的methods对象，劫持上面的方法，如果有子组件，则沿着组件树遍历子组件，递归执行outerRecursion函数
 * @param {Object} currentCom router的各个component对象
 */
function innerRecursion (currentCom,beforeFn) {
  if (currentCom.methods) {
    // 遍历methods对象上的方法
    for (let k in currentCom.methods) {
      let originFn = currentCom.methods[k]
      currentCom.methods[k] = function () {
          // 鉴于 vue @click写法不一，有不传$event的情况，所以用原生的全局window.event属性！！！impotant
          beforeFn.call(this)

          originFn.apply(this, arguments)
      }
    }
  }
  if (currentCom.components) {
    // 递归处理子组件
    for (let k in currentCom.components) {
      let childCom = currentCom.components[k]
      outerRecursion(childCom)
    }
  }
}

export default eventInterceptor
