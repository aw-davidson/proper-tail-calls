const Benchmark = require('benchmark');
const babel = require('babel-core');
const fibonacci = require('../src/utils/fibonacci');

const plugin = require('../src/index');
// use our plugin to get tail-call-optimized version fibSeq function

const { code: optimizedFibonacciCode } = babel.transform(fibonacci.toString(), { plugins: [plugin] });
const getFunction = new Function(`
    ${optimizedFibonacciCode};
    return fibonacci;
  `);
const optimizedFibonacci = getFunction();

const suite = new Benchmark.Suite();

suite
  .add('Fibonacci Sequence without TCO', () => fibonacci(200) === 280571172992510140037611932413038677189525)
  .add('Fibonacci Sequence with TCO', () => optimizedFibonacci(200) === 280571172992510140037611932413038677189525);

suite
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log(`Fastest is ${this.filter('fastest').map('name')}`);
  })
  .run();
