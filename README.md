# Proper Tail Calls in JavaScript

Proper tail calls are recursive function calls that do not need to allocate extra stack space proportional to recursion depth. They are a part of the ECMAScript 6 standard but are currently [only supported in Safari](https://kangax.github.io/compat-table/es6/). This plugin implements proper tail calls through a technique called function [trampolining](https://raganwald.com/2013/03/28/trampolines-in-javascript.html). Using the proper-tail-calls plugin, a program could make an unbounded number of consecutive tail calls without unboundedly growing the stack.

## Example

```JavaScript
function factorial(num, accumulated = 1) {
    if (num <= 1) {
        return accumulated;
    } else {
        return factorial(num - 1, num * accumulated); // proper tail position
    }
}

factorial(10)
  //=> 3628800
factorial(32687)
  //=> RangeError: Maximum call stack size exceeded

const properFactorial = babel.transform(factorial.toString(), {
  plugins: ["proper-tail-calls"]
})
properFactorial(32687)
  //=> Infinity
```

## How It Works

Recursive calls that are in a [proper tail position](https://webkit.org/blog/6240/ecmascript-6-proper-tail-calls-in-webkit/) will be *trampolined*. Instead of recursing directly, the recursive call is deferred and a wrapper function is returned.

The factorial example above transpiles to:

```JavaScript
var factorial = _trampoline(function factorial(num, accumulated = 1) {
    if (num <= 1) {
        return accumulated;
    } else {
        return () => {
            return factorial(num - 1, num * accumulated);
        }
    }
})

function _trampoline(fn) {
  return function trampolined(...args) {
    let result = fn(...args);
    while (typeof result === 'function') {
      result = result();
    }

    return result;
  };
}
```

## Installation

```sh
$ npm install --save-dev proper-tail-calls
```

## Usage

Add the following line to your .babelrc file:

```json
{
  "plugins": ["proper-tail-calls"]
}
```

```sh
babel --plugins proper-tail-calls script.js
```

### Via Node API

```javascript
require("@babel/core").transform("code", {
  plugins: ["proper-tail-calls"]
});
```
