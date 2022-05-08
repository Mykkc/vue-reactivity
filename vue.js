class Vue{
    constructor(obj_instance) {
        this.$data = obj_instance.data
        Observe(this.$data)
        Compile(obj_instance.el,this)
    }
}
function Observe(data_instance) {
    if (!data_instance || typeof data_instance !== 'object') {
        return
    }
    const dependency = new Dependency()
    Object.keys(data_instance).forEach(key => {
        let value = data_instance[key]
        Observe(value)
        // if (typeof value === 'object') {

        // }
        Object.defineProperty(data_instance, key, {
            enumerable: true,
            configurable: true,
            get() {
                console.log(`读取了属性${key}=>>>${value}`)
                Dependency.temp && console.log(Dependency.temp)
                // 添加订阅者到依赖实例数组     Dependency.temp已经是每一个key值得订阅者实例
                Dependency.temp && dependency.addSub(Dependency.temp)
                return value
            },
            set(newValue) {
                console.log(`设置了属性${key}的值${value}=>>>${newValue}`)
                value = newValue
                Observe(newValue)
                dependency.notify()
                
            },
        })
    })
}
// 模板语法编译
function Compile(element, vm) {
    vm.$el = document.querySelector(element)
    const fragment = document.createDocumentFragment()
    let child
    while (child = vm.$el.firstChild) {

        fragment.appendChild(child)
        
    }
    // console.log(vm.$el.childNode)
    fragment_compile(fragment)
    // console.log(fragment)
    function fragment_compile(node) {
        const pattern = /\{\{\s*(\S+)\s*\}\}/
        //类型为3 文本节点
        if (node.nodeType === 3) {
            //保存插值语法
            const text = node.nodeValue
            // console.log(node, node.nodeValue)
            //用pattern这个正则去提取key
            const result_regex = pattern.exec(node.nodeValue)
            // console.log(result_regex)
            if (result_regex) {
                // console.log(node.nodeValue)
                // console.log(vm.$data[result_regex[1]])
                //处理嵌套属性读取 转换为数组
                const arr = result_regex[1].split('.')
                const value = arr.reduce((total, current) => total[current], vm.$data)
                //replace 替换匹配的属性 改为 $data的值
                node.nodeValue = text.replace(pattern, value)
                // 创建订阅者
                new Watcher(vm, result_regex[1], newValue => {
                    node.nodeValue = text.replace(pattern, newValue)
                })
                // console.log(node.nodeValue)
            }
            return
        }
        node.childNodes.forEach(child=>fragment_compile(child))
    }
    vm.$el.appendChild(fragment)
}

// 依赖收集 发布订阅
class Dependency {
    constructor() {
        this.subscribe = []
    }
    addSub(sub) {
        this.subscribe.push(sub)
    }
    notify() {
        this.subscribe.forEach(sub=>sub.update())
    }
}

class Watcher{
    constructor(vm, key, callback) {
        this.vm = vm
        this.key = key
        this.callback = callback
        // 临时属性 触发getter
        Dependency.temp = this
        key.split('.').reduce((total, current) => total[current], vm.$data)
        // get会触发多次 需要清空
        Dependency.temp=null
    }
    update() {
        const value = this.key.split('.').reduce((total,current)=>total[current],this.vm.$data)
        this.callback(value)
    }
}