# Tail Call Optimization for JavaScript

Proper tail call is a technique where the program will not create additional stack frames for a recursion that fits the [tail call definition](https://webkit.org/blog/6240/ecmascript-6-proper-tail-calls-in-webkit/). Instead of having a recursion with all its stack saved in memory, we will have just one level of stack saved, optimizing the recursion stack.

The problem:

```JavaScript
factorial(10)
  //=> 3628800
factorial(32768)
  //=> RangeError: Maximum call stack size exceeded
```

## How It Works

Recursive calls that are in a proper tail position will be *trampolined*. Instead of recursing directly we return an anonymous funciton which continues the recursion. This process does not accumulate stack frames in proportion to the recursion depth. Memory related to stack frame overhead stays constant. 

```JavaScript
function factorial(x, acc = 1) {
    if (x <= 1) {
        return acc;
    } else {
        return factorial(x - 1, x * acc);
    }
}
```

transpiles to:

```JavaScript
var factorial = _trampoline(function factorial(x, acc = 1) {
    if (x <= 1) {
        return acc;
    } else {
        return () => {
            return factorial(x - 1, x * acc);
        }
    }
})
```

where _trampoline is defined as

```JavaScript
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
