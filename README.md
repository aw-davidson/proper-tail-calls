# Tail Call Optimization for JavaScript

## How It Works

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