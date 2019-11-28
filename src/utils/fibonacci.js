function fibonacci(n, last = 1, beforeLast = 0) {
    if (n === 0) {
      return beforeLast
    }
  
    return fibonacci(n - 1, last + beforeLast, last)
  }
  
  module.exports = fibonacci