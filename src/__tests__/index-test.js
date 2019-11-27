const babel = require('babel-core');
const plugin = require('../');

var example = `
function simpleTailCall() {
    return simpleTailCall()
}
`;

it('works', () => {
  const {code} = babel.transform(example, {plugins: [plugin]});
  expect(code).toMatchSnapshot();
});