const Benchmark = require('benchmark')
const fibonacci = require('../src/utils/fibonacci')

const babel = require('babel-core');
const plugin = require('../src/index');
// use our plugin to get tail-call-optimized version fibSeq function

var { code: optimizedFibonacciCode } = babel.transform(fibonacci.toString(), {plugins: [plugin]});
console.log(optimizedFibonacciCode)
var getFunction = new Function(`
    ${optimizedFibonacciCode};
    return fibonacci;
  `);
var optimizedFibonacci = getFunction();

const suite = new Benchmark.Suite()

suite
  .add('Fibonacci Sequence without TCO', () => fibonacci(200) === 280571172992510140037611932413038677189525)
  .add('Fibonacci Sequence with TCO', () => optimizedFibonacci(200) === 280571172992510140037611932413038677189525)

suite
  .on('cycle', function (event) {
    console.log(String(event.target))
  })
  .on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'))
  })
  .run()