const fs = require('fs');
const path = require('path');
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const types = require("@babel/types");

const PTG = new Map();

class CallGraphNode {
  constructor(filename, functionName) {
    this.filename = filename;
    this.functionName = functionName;
    this.targetPage = null;
    this.argumentIndex = -1;
    this.children = new Set();
  }
}

// const pageNodes = new Map();
const callGraphNodes = new Map(); // {filename: {functionName: CallGraphNode}}

const codes = new Map();
const asts = new Map();
const classes = new Map();
const classConstants = new Map(); // {class: {variable: value}}
const functions = new Map(); // {filename: {functionName: functionCode}}
const roots = new Set();

const pageGraph = new Map();
const pageRoots = new Map();

const project = process.argv[2];
const basePath = `${project}/build/default/cache/default/default@CompileArkTS/esmodule/debug`
// const directoryPath = `${project}/build/default/cache/default/default@CompileArkTS/esmodule/debug/product/phone/src/main/ets`; // 修改为你的目录路径
const directoryPath = `${project}/build/default/cache/default/default@CompileArkTS/esmodule/debug/entry/src/main/ets`; // 修改为你的目录路径

const mainPages = JSON.parse(fs.readFileSync(`${project}/src/main/resources/base/profile/main_pages.json`));
mainPages.src.forEach(name => {
  let filename = `${directoryPath}/${name}.js`
  if (!PTG.has(filename)) {
    PTG.set(filename, []);
  }
});

const callgraph = JSON.parse(fs.readFileSync('./callgraph.json'));
callgraph.forEach(edge => {
  let source = edge.source;
  let target = edge.target;
  if (source.label === 'anon' && target.label === 'anon') {
    return;
  }
  if (target.label === 'anon') {
    return;
  }

  source.file = source.file.replace(/\\/g, '/');
  if (!callGraphNodes.has(source.file)) {
    callGraphNodes.set(source.file, new Map());
  }
  let parent = callGraphNodes.get(source.file).get(source.label);
  if (!parent) {
    parent = new CallGraphNode(source.file, source.label);
  }
  callGraphNodes.get(source.file).set(source.label, parent);

  target.file = target.file.replace(/\\/g, '/');
  if (!callGraphNodes.has(target.file)) {
    callGraphNodes.set(target.file, new Map());
  }
  let child = callGraphNodes.get(target.file).get(target.label);
  if (!child) {
    child = new CallGraphNode(target.file, target.label);
  }
  callGraphNodes.get(target.file).set(target.label, child);
  child.children.add(parent);
});

function preHandleClass(filename, ast) {
  traverse(ast, {
    ClassDeclaration(path) {
      classes.set(path.node.id.name, filename);
    }
  })
}

function preHandlePageGraph(filename, ast) {
  traverse(ast, {
    CallExpression(path) {
      if (path.node.callee.object && path.node.callee.object.name === 'ViewPU' && path.node.callee.property.name === 'create') {
        path.node.arguments.forEach(arg => {
          if (types.isNewExpression(arg)) {
            let pageName = arg.callee.name;
            // console.log(pageName);
            let subPageFile = classes.get(pageName);
            // TODO: solve the difference between filename and classname
            if (!subPageFile) {
              // throw new Error('Page Not Found!');
              console.log(subPageFile);
            }
            if (!pageGraph.has(filename)) {
              pageGraph.set(filename, new Set());
            }
            if (filename !== subPageFile) {
              pageGraph.get(filename).add(subPageFile);
              console.log(`${filename.substring(filename.lastIndexOf('/') + 1)} -> ${subPageFile.substring(subPageFile.lastIndexOf('/') + 1)}`);
            }
          }
        });
      }
    }
  });
}

function preHandleConstant(filename, ast) {
  traverse(ast, {
    AssignmentExpression(path) {
      if (types.isMemberExpression(path.node.left) &&
        types.isIdentifier(path.node.left.object) &&
        types.isIdentifier(path.node.left.property)) {
        const objectName = path.node.left.object.name;
        const propertyName = path.node.left.property.name;
        if (classes.has(objectName)) { // check static property
          let value = path.node.right.value;
          if (types.isStringLiteral(path.node.right)) {
            if (!classConstants.has(objectName)) {
              classConstants.set(objectName, new Map());
            }
            let map = classConstants.get(objectName);
            map.set(propertyName, value);
          }
        }
      }
    }
  })
}

function preHandleFunctionAsts(filename, ast) {
  const code = codes.get(filename);
  if (!code) {
    throw new Error('code does not exist!');
  }
  traverse(ast, {
    FunctionDeclaration(path) {
      const functionName = path.node.id.name;
      const { start, end } = path.node;
      if (start !== undefined && end !== undefined) {
        const functionSourceCode = code.substring(start, end);
        if (!functions.has(filename)) {
          functions.set(filename, new Map());
        }
        let map = functions.get(filename);
        map.set(functionName, functionSourceCode);
      }
    },
    ClassDeclaration(path) {
      const { start, end } = path.node;
      const functionSourceCode = code.substring(start, end);
      path.traverse({
        ClassMethod(innerPath) {
          const functionName = innerPath.node.key.name;
          if (!functions.has(filename)) {
            functions.set(filename, new Map());
          }
          let map = functions.get(filename);
          map.set(functionName, functionSourceCode);
        }
      })
    }
  });
}

function preHandleRoots(filename, ast) {
  traverse(ast, {
    CallExpression(path) {
      if (path.node.callee.object && path.node.callee.object.name === 'router' && (path.node.callee.property.name === 'push' || path.node.callee.property.name === 'pushUrl' || path.node.callee.property.name === 'replace' || path.node.callee.property.name === 'replaceUrl')) {
        let url = '';
        path.node.arguments.forEach(arg => {
          if (types.isObjectExpression(arg)) {
            arg.properties.forEach(prop => {
              if (prop.key.name === 'url') {
                if (types.isStringLiteral(prop.value)) {
                  url = `${directoryPath}/${prop.value.value}.js`;
                } else if (types.isIdentifier(prop.value)) {
                  url = prop.value;
                } else if (types.isMemberExpression(prop.value) &&
                  types.isIdentifier(prop.value.object) &&
                  types.isIdentifier(prop.value.property)) {
                  const objectName = prop.value.object.name;
                  const propertyName = prop.value.property.name;
                  const value = classConstants.get(objectName)?.get(propertyName);
                  if (value) {
                    url = `${directoryPath}/${value}.js`;
                  }
                }
              }
            });
          }
        });
        let currentPath = path;
        while (currentPath.parentPath) {
          currentPath = currentPath.parentPath;
          if (types.isArrowFunctionExpression(currentPath.node)) {
            if (types.isCallExpression(currentPath.parent)) {
              const callee = currentPath.parentPath.node.callee;
              if (callee.property && callee.property.name) {
                const widget = callee.object.name;
                const action = callee.property.name;
                if (!widget || !action || !url) {
                  break;
                }
                console.log(`Current Page: ${filename}, Component: ${widget}, Event: ${action}, Target Page: ${url}`);
                let curRootPages = pageRoots.get(filename);
                for (let curRootPage of curRootPages) {
                  if (types.isIdentifier(url)) {
                    console.error('PageNode Error!');
                  }
                  let flag = true;
                  for (const { component: { type: t }, event: a, target: tp } of PTG.get(curRootPage)) {
                    if (widget === t && action === a && url === tp) {
                      flag = false;
                      break;
                    }
                  }
                  if (flag) {
                    PTG.get(curRootPage).push([
                      {
                        component: {
                          type: widget,
                        },
                        event: action,
                        target: url
                      }
                    ])
                  }
                }
                break;
              }
            }
          } else if (types.isDeclareFunction(currentPath.node)) {
            let functionName = currentPath.node.key.name;
            let callGraphNode = callGraphNodes.get(filename)?.get(functionName);
            if (callGraphNode) {
              roots.add(callGraphNode);
            } else {
              console.error('Call Graph Error!');
            }
            if (types.isIdentifier(url)) {
              path.node.params.forEach((param, index) => {
                if (param.name === url.name) {
                  callGraphNode.argumentIndex = index;
                }
              })
            } else {
              callGraphNode.targetPage = `${directoryPath}/${url}.js`;
            }
          } else if (types.isClassMethod(currentPath.node)) {
            let functionName = currentPath.node.key.name;
            let callGraphNode = callGraphNodes.get(filename)?.get(functionName);
            if (callGraphNode) {
              roots.add(callGraphNode);
              if (types.isIdentifier(url)) {
                currentPath.node.params.forEach((param, index) => {
                  if (param.name === url.name) {
                    callGraphNode.argumentIndex = index;
                  }
                })
              } else {
                callGraphNode.targetPage = url;
              }
            } else {
              console.error('Call Graph Error!');
            }
          }
        }
      }
    }
  });
}

function buildPTG() {
  function dfs(callGraphNode, parentNode, targetPage, argumentIndex) {
    let functionCode = functions.get(callGraphNode.filename)?.get(callGraphNode.functionName);
    let ast;
    if (callGraphNode.functionName === 'anon') {
      ast = asts.get(callGraphNode.filename);
    } else {
      if (!functionCode) {
        return;
      }
      ast = parser.parse(functionCode, {
        sourceType: "module",
      });
    }
    traverse(ast, {
      CallExpression(path) {
        if (path.node.callee.object && path.node.callee.property.name === parentNode?.functionName) {
          if (!targetPage) {
            if (parentNode?.argumentIndex !== null && parentNode?.argumentIndex !== undefined && parentNode?.argumentIndex >= 0) {
              let idx = parentNode.argumentIndex;
              let arg = path.node.arguments[idx];
              if (types.isStringLiteral(arg)) {
                if (!arg.value.includes('pages/')) {
                  return;
                }
                targetPage = `${directoryPath}/${arg.value}.js`;
              } else if (types.isMemberExpression(arg) &&
                types.isIdentifier(arg.object) &&
                types.isIdentifier(arg.property)) {
                const objectName = arg.object.name;
                const propertyName = arg.property.name;
                const value = classConstants.get(objectName)?.get(propertyName);
                if (value) {
                  targetPage = `${directoryPath}/${value}.js`;
                }
              }
            }
          }

          let currentPath = path;
          while (currentPath.parentPath) {
            currentPath = currentPath.parentPath;
            if (types.isArrowFunctionExpression(currentPath.node)) {
              if (types.isCallExpression(currentPath.parent)) {
                const callee = currentPath.parentPath.node.callee;
                if (callee.property && callee.property.name) {
                  const widget = callee.object.name;
                  const action = callee.property.name;
                  if (action !== 'onClick') {
                    break;
                  }
                  const pageName = callGraphNode.filename;
                  if (!widget || !action || !targetPage) {
                    break;
                  }
                  console.log(`Current Page: ${pageName}, Component: ${widget}, Event: ${action}, Target Page: ${targetPage}`);
                  let curRootPages = pageRoots.get(pageName);
                  if (!curRootPages) {
                    break;
                  }
                  for (let curRootPage of curRootPages) {
                    let flag = true;
                    for (const { component: { type: t }, event: a, target: tp } of PTG.get(curRootPage)) {
                      if (widget === t && action === a && targetPage === tp) {
                        flag = false;
                        break;
                      }
                    }
                    if (flag) {
                      PTG.get(curRootPage).push({
                        component: {
                          type: widget,
                        },
                        event: action,
                        target: targetPage
                      });
                    }
                  }
                  return;
                }
              }
            } else if (types.isFunctionDeclaration(currentPath.node)) {
              break;
            } else if (types.isClassMethod(currentPath.node)) {
              break;
            }
          }
        }
      }
    });
    for (let childNode of callGraphNode.children) {
      dfs(childNode, callGraphNode, targetPage, argumentIndex);
    }
  }

  for (const root of roots) {
    dfs(root, null, root.targetPage, root.argumentIndex);
  }
}

function walkDir(directoryPath) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  entries.forEach(entry => {
    let entryPath = path.join(directoryPath, entry.name);
    entryPath = entryPath.replace(/\\/g, '/');
    if (entry.isDirectory()) {
      walkDir(entryPath);
    } else if (entryPath.endsWith('.js')) {
      const code = fs.readFileSync(entryPath, 'utf8');
      codes.set(entryPath, code);
      const ast = parser.parse(code, {
        sourceType: "module",
      });
      asts.set(entryPath, ast);
    }
  });
}

walkDir(basePath);

for (const [filename, ast] of asts) {
  preHandleClass(filename, ast);
  preHandleConstant(filename, ast);
  preHandleFunctionAsts(filename, ast);
}

for (const [filename, ast] of asts) {
  preHandlePageGraph(filename, ast);
}

function dfs(mainPage, curPage) {
  if (!pageRoots.has(curPage)) {
    pageRoots.set(curPage, new Set());
  }
  pageRoots.get(curPage).add(mainPage);
  if (pageGraph.has(curPage)) {
    for (const nextPage of pageGraph.get(curPage)) {
      dfs(mainPage, nextPage);
    }
  }
}

mainPages.src.forEach(mainPage => {
  dfs(`${directoryPath}/${mainPage}.js`, `${directoryPath}/${mainPage}.js`);
});

for (const [filename, ast] of asts) {
  preHandleRoots(filename, ast);
}

buildPTG();

let obj = Object.fromEntries(Array.from(PTG).map(([key, value]) => [key.substring(directoryPath.length + 1, key.lastIndexOf('.js')), Array.from(value)]));
Object.keys(obj).forEach(key => {
  value = obj[key];
  for (let obj of value) {
    obj.target = obj.target.substring(directoryPath.length + 1, obj.target.lastIndexOf('.js'));
  }
});
let jsonString = JSON.stringify(obj, null, 2);

// fs.writeFileSync('./PTG.json', jsonString);
fs.writeFileSync(`./PTG.ets`, `const PTGJson = \`${jsonString}\`;\nexport default PTGJson;`);
