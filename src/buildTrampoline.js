const template = require('@babel/template').default;

function TRAMPOLINE_PLACEHOLDER_NAME(fn) {
  return function trampolined(...args) {
    let result = fn(...args);
    while (typeof result === 'function') {
      result = result();
    }

    return result;
  };
}

module.exports = template(TRAMPOLINE_PLACEHOLDER_NAME.toString());
