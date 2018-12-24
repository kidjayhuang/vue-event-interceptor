# vue-event-interceptor
拦截vue所有方法 methods


## 1: 拦截器原理，入口部分
 
**app.js**
```js
import eventInterceptor from "./utils/eventInterceptor";

const router = new VueRouter({

  mode: "history",

  routes

});

function beforeFn(){
  //拦截代码，
}
eventInterceptor(router,beforeFn)
```


**eventInterceptor.js**
```js

function eventInterceptor (routerInstance) {

  for (let k in routerInstance.options.routes) { //遍历路由实例，获取所有单页面组件

    let singleCom = routerInstance.options.routes[k].component

    outerRecursion(singleCom)
  }

  return routerInstance
}
```

>将vue路由实例传进拦截器函数，获取所有单页组件

## 2： 外层递归部分
```js
function outerRecursion (ele) {
  if (typeof ele === 'function') {
    ele().then(e => {
      innerRecursion(e.default)
      })
    } else {
     innerRecursion(ele)
  }
}
```
>由于vue路由的引用有两种形式，同步跟异步的，为别写成 1：const Component = () => import('path') 2：import Component from 'path'
第一种是一个返回promise对象的函数，第二种直接是一个对象，外递归函数的作用就分别处理这两种形式，最终传递一个组件对象给内递归函数

## 3： 内层递归遍历部分
```js
function innerRecursion (currentCom,beforeFn) {
  if (currentCom.methods) {
    for (let k in currentCom.methods) {
      let originFn = currentCom.methods[k]
      currentCom.methods[k] = function () {
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
```
 
**包装事件：**
内递归函数将判断传进来的组件对象，如果有methods属性，就遍历methods，将原事件，存起来，然后赋值一个新事件，
在新事件的最后执行原事件，执行原事件前就可以写自己的拦截代码，包装事件需要注意的有3点，
* 1：作用域 
* 2：参数 
* 3：事件对象，
前面两点就不详说，主要是事件对象，鉴于vue添加事件的写法有很多:
1. @click="getPrizes"  
2. @click="getPrizes()" 
3. @click="getPrizes(11)" 
4. @click="getPrizes(11,$event)"

1、4都是可以获取事件对象，而  2、3则获取不了，为了不影响开发体验，选择用原生的window.event事件对象，可以在开发无感知的状态下进行拦截
