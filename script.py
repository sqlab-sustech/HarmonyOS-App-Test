import os

project = 'D:/project/CS490/HarmoneyOpenEye/entry'
os.system(f'js-callgraph --cg {project}/build/default/cache/default/default@CompileArkTS/esmodule/debug --output callgraph.json')
# os.system(f'js-callgraph --cg D:/project/CS490/{project}/product/phone/build/default/cache/default/default@CompileArkTS/esmodule/debug --output callgraph.json')
os.system(f'node ptg.js {project}')