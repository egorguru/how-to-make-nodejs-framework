exports.compose = middleware => (ctx, next) => {
  const dispatch = i => {
    let fn = middleware[i]
    if (i === middleware.length) {
      fn = next
    }
    if (!fn) {
      return Promise.resolve()
    }
    try {
      return Promise.resolve(fn(ctx, () => dispatch(i + 1)))
    } catch (err) {
      return Promise.reject(err)
    }
  }
  return dispatch(0)
}
