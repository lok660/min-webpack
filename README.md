# min-webpack
build own's webpack

## AST

![image](https://user-images.githubusercontent.com/16753554/70860867-fae7b780-1f61-11ea-9f0c-0fb4d12c3c44.png)

- 代码风格,语法的检查,IDE中的错误提示,格式化,自动补全等等
- 优化变更代码，代码压缩,Tree-Sharking等等
- es6转es5,以及TypeScript、JSX等转化为原生Javascript等等

## AST解析语法树

![2](https://user-images.githubusercontent.com/16753554/70860748-9546fb80-1f60-11ea-861c-d12267ee2208.png)

这一步就是parse的内容，解析读取到的模块的内容。

- 替换require，替换依赖的路径，把修改后的模板放进sourceCode
- 把依赖放进dependencies数组中

用到了几个库来做这件事：

- babylon 主要是把源码解析成AST
- @babel/traverse 遍历节点（遍历到对应的节点）以**深度优先**的形式遍历AST，并进行修改和转化
- @babel/types 替换遍历到的节点
- @babel/generator 替换好的结果生成,根据AST生成新的代码
- (traverse和generator是es6模块 引用的时候要require(‘@babel/traverse’).default 不然默认导出的是一个对象)
- @babel/core Babel核心库，被很多babel配套设施依赖，用于加载 preset 和 plugin

Babel转化的核心链路：原始代码-原始AST -转化后的AST-转化后的代码



## 整体流程分析

1、读取入口文件。

2、将内容转换成 ast 语法树。

3、深度遍历语法树，找到所有的依赖，并加入到一个数组中。

4、将 ast 代码转换回可执行的 js 代码。

5、编写 require 函数，根据入口文件，自动执行完所有的依赖。

## craeteAsset

1、使用 nodejs 中的 file 模块获取文件内容。

2、使用 @babel/parser 将文件内容转换成 ast 抽象语法树。

3、使用 @babel/traverse 对 ast 进行遍历，将入口文件的依赖保存起来。

4、使用 babel.transformFromAstSync 将 ast 转换成可执行的 js 代码。

5、返回一个模块，包含：模块 id，filename，dependencies，code 字段。

## createGraph

1、接收入口文件路径，处理入口模块，调用 craeteAsset 生成处理好的模块。

2、新建一个数组，深度遍历入口文件以及入口文件的依赖文件，并将 craeteAsset 生成后的文件加入数组中。

3、返回数组。

## bundle

1、传入 createGraph 生成的数组。

2、遍历数组，把执行的 code 加入到一个函数级作用域中，并增加一个子依赖的属性 mapping。

3、编写一个 require 方法（因为打包出来的代码是 commonjs 语法，这里为了解析 require 方法）。

4、require 中循环加载所有依赖项，并执行。

5、返回处理结果。