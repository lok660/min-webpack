const path = require('path')
const fs = require('fs')
//  babylon 主要将源码转成 AST
const babylon = require("@babel/parser")
//  遍历以及更新 AST node
const traverse = require("@babel/traverse").default
//  将 AST node 转换成 ES5 code
const babel = require("@babel/core")

let ID = 0

//  读取文件信息,并获得当前js文件的依赖关系
function createAsset (filename) {
  //  获取文件,返回的是字符串
  const content = fs.readFileSync(filename, 'utf-8')

  //  转换字符串为ast抽象语法树
  const ast = babylon.parse(content, {
    sourceType: 'module'
  })

  //  用来存储文件所依赖的模块(当前js文件Import哪些文件,都会保存在这个数组中)
  const dependencies = []

  //  遍历ast
  traverse(ast, {
    //  每次import语法的时候
    ImportDeclaration: ({ node }) => {
      //  把依赖的模块加入到数组中
      //  例如: 如果当前js文件 有一句 import message from './message.js'， 
      //  './message.js' === node.source.value
      dependencies.push(node.source.value)
    }
  })

  //  模块的id从0开始,相当于一个js文件,可以看成一个模块
  const id = ID++

  //  将ES6转成ES5
  const { code } = babel.transformFromAstSync(ast, null, {
    presets: ["@babel/preset-env"]
  })

  return {
    id,
    filename,
    dependencies,
    code
  }
}

//  从入口开始分析所有的依赖项,形成依赖图,采用广度遍历
function createGraph (entry) {

  const mainAsset = createAsset(entry)

  //  定义一个保存依赖项的数组(遍历,从第一个example/entry.js返回的信息)
  const queue = [mainAsset]

  for (const asset of queue) {
    const dirname = path.dirname(asset.filename)

    //  定义个保存子依赖项的属性(类似  {'./message.js' : 1} )
    asset.mapping = {}

    asset.dependencies.forEach(relativePath => {

      const absolutePath = path.join(dirname, relativePath)

      //  获得子模块的依赖项,代码,模块id,文件名
      const child = createAsset(absolutePath)

      //  给子依赖项赋值
      asset.mapping[relativePath] = child.id

      //  将子依赖项加入队列中,循环处理
      queue.push(child)

    })
  }

  return queue
}

//  根据生成的依赖关系图,生成浏览器可执行文件
function bundle (graph) {

  let modules = ''

  graph.forEach(mod => {
    //  循环依赖关系,并把每个模块中的代码存在function作用域里
    modules +=
      `${mod.id}:[
      function (require,module,exports) {
        ${mod.code}
      },
      ${JSON.stringify(mod.mapping)}
    ]`
  })

  // require, module, exports 不能直接在浏览器中使用，这里模拟了模块加载，执行，导出操作
  const result = `
    (function(modules){
      //  创建一个require()函数,接收一个 模块ID ,这里模拟了模块加载,执行,导出操作
      function require(id) {
        const [fn,mapping] = modules[id]

        function localRequire(relativePath) {
          //  根据mapping的路径,找到对应的模块id
          return require(mapping[relativePath])
        }

        const module = {exports: {}}

        //  执行转换的代码后,并输出
        fn(localRequire,module,module.exports)

        return modules.exports
      }

      //  执行入口文件
      require(0)

    })({${modules}})
  `

  return result
}

const graph = createGraph('./example/entry.js')

const result = bundle(graph)

//  打包生成文件
fs.writeFileSync('dist/output.js', result)