const path = require('path')
const fs = require('fs')
const babylon = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const babel = require("@babel/core");

let ID = 0;

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
      //  例如 如果当前js文件 有一句 import message from './message.js'， 
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
  };
}

//  从入口开始分析所有的依赖项,形成依赖图,采用广度遍历
function createGraph (entry) {

}

//  根据生成的依赖关系图,生成浏览器可执行文件
function bundle (graph) {

}