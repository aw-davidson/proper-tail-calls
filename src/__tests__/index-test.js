const babel = require('babel-core');
const plugin = require('../');

var example = `
function simpleTailCall() {
    return simpleTailCall()
}
`;

const fibExample = `
 function fib (n, last = 1, beforeLast = 0) {
  if (n === 0) {
    return beforeLast
  }

  return fib(n - 1, last + beforeLast, last)
}
`

const countVowelsExample = `
const isVowel = (char) => /[aeioue]/.test(char.toLowerCase())
function countVowels(count, str) {
  count += isVowel(str[0]) ? 1 : 0;
  if (str.length <= 1) {
    return count;
  }
  return countVowels(count, str.slice(1));
}
`

it('works', () => {
  const {code} = babel.transform(example, {plugins: [plugin]});
  expect(code).toMatchSnapshot();
});

it('transforms proper tail calls', () => {
  var {code} = babel.transform(fibExample, {plugins: [plugin]});
  var f = new Function(`
    ${code};
    return fib;
  `);
  var fib = f();
  expect(fib(10)).toBe(55)
});

it('does not produce stack overflow where a normal function would', () => {
  var {code} = babel.transform(countVowelsExample, {plugins: [plugin]});
  var f = new Function(`
    ${code};
    return countVowels;
  `);
  var countVowels = f();
  expect(countVowels(0, "a".repeat(10000))).toBe(10000)

  const getOverflowFn = new Function(`
  ${countVowelsExample};
  return countVowels;
`);
  var countVowels = getOverflowFn();

  try {
    countVowels(0, "a".repeat(10000))
  } catch (e) {
    expect(e).toEqual(RangeError(`Maximum call stack size exceeded`))
  }
});