const babel = require('babel-core');
const plugin = require('../');

const example = `
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
`;

const countVowelsExample = `
const isVowel = (char) => /[aeioue]/.test(char.toLowerCase())
function countVowels(count, str) {
  count += isVowel(str[0]) ? 1 : 0;
  if (str.length <= 1) {
    return count;
  }
  return countVowels(count, str.slice(1));
}
`;

it('works', () => {
  const { code } = babel.transform(example, { plugins: [plugin] });
  expect(code).toMatchSnapshot();
});

it('transforms proper tail calls', () => {
  const { code } = babel.transform(fibExample, { plugins: [plugin] });
  const f = new Function(`
    ${code};
    return fib;
  `);
  const fib = f();
  expect(fib(10)).toBe(55);
});

it('does not produce stack overflow where a normal function would', () => {
  const { code } = babel.transform(countVowelsExample, { plugins: [plugin] });
  const f = new Function(`
    ${code};
    return countVowels;
  `);
  const countVowels = f();
  expect(countVowels(0, 'a'.repeat(10000))).toBe(10000);

  const getOverflowFn = new Function(`
  ${countVowelsExample};
  return countVowels;
`);
  const countVowelsOverflow = getOverflowFn();

  try {
    countVowelsOverflow(0, 'a'.repeat(10000));
  } catch (e) {
    expect(e).toEqual(RangeError('Maximum call stack size exceeded'));
  }
});

it('works for ternary expressions', () => {
  const ternaryCode = 'const counter = (n, acc = 0) => n === 0 ? acc : counter(n - 1, acc + 1)';

  const { code } = babel.transform(ternaryCode, { plugins: [plugin] });
  expect(code).toMatchSnapshot();
});
