const METHODS = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'DELETE',
  'OPTIONS',
  'PATCH'
]

class Node {

  constructor() {
    this.value
    this.params
    this.routes = new Map()
  }
}

class PrefixTree {

  constructor() {
    this._routes = new Map()
    for (const method of METHODS) {
      this._routes.set(method, new Node())
    }
  }

  add(method, path, value) {
    if (path.charAt(path.length - 1) === '/') {
      path = path.slice(0, path.length - 1)
    }
    const node = this._routes.get(method)
    this._addRoute(node, path, value)
    this._addRoute(node, path + '/', value)
  }

  _addRoute(root, path, value) {
    let current = root
    const paths = path.split('/')
    const params = []
    for (let i = 0; i < paths.length; i++) {
      const p = paths[i]
      if (p.charAt(0) === ':') {
        params.push({ number: i, name: p.slice(1, p.length) })
        if (current.routes.has('__')) {
          current = current.routes.get('__')
        } else {
          const newNode = new Node()
          current.routes.set('__', newNode)
          current = newNode
        }
      } else {
        if (current.routes.has(p)) {
          current = current.routes.get(p)
        } else {
          const newNode = new Node()
          current.routes.set(p, newNode)
          current = newNode
        }
      }
    }
    current.params = params
    current.value = value
  }

  find(method, path) {
    const methodNode = this._routes.get(method)
    const route = this._findRoute(methodNode, path)
    if (route === undefined) {
      return null
    }
    return {
      value: route.value,
      params: route.params,
    }
  }

  _findRoute(node, path) {
    const paths = path.split('/')
    let current = node
    for (let i = 0; i < paths.length; i++) {
      const p = paths[i]
      current = current.routes.get(p) || current.routes.get('__')
      if (current === undefined) {
        return
      }
    }
    if (current.params === undefined) {
      return
    }
    const params = {}
    for (const param of current.params) {
      params[param.name] = paths[param.number]
    }
    return {
      params,
      value: current.value
    }
  }
}

exports.PrefixTree = PrefixTree
