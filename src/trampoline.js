const template = require("@babel/template").default;

// TODO: generate unique name for trampoline
function trampoline(fn) {
    return function trampolined(...args) {
      let result = fn(...args);
  
      while (typeof result === 'function') {
        result = result();
      }
  
      return result;
    };
  }


const ast = template.ast(trampoline.toString());
module.exports = ast;