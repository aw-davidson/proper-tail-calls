const trampolineAST = require('./trampoline');
const findTailCalls = require('./findTailCalls');

module.exports = function babelVisitorExport(babel) {
  const { types: t } = babel;

  return {
    name: 'proper-tail-calls-transformer',
    visitor: {
      Program(path) {
        path.node.body.push(trampolineAST);
      },
      Function(path) {
        if (path.node.id) {
          const { tailCalls, needsClosure } = findTailCalls(
            path,
            path.node.id.name,
          );

          if (tailCalls.length > 0 && !needsClosure) {
            const functionExpressionWrapper = t.functionExpression(path.node.id, path.node.params, path.node.body);

            const trampolinedVariableDeclartion = t.variableDeclaration('var', [
              t.variableDeclarator(
                path.node.id,
                t.callExpression(trampolineAST.id, [functionExpressionWrapper]),
              ),
            ]);
            path.replaceWith(trampolinedVariableDeclartion);

            const wrapWithArrowFunction = (innerPath) => {
              const fn = t.arrowFunctionExpression(
                [],
                t.blockStatement([t.returnStatement(innerPath.node.argument)]),
              );

              innerPath.replaceWith(t.returnStatement(fn));
            };
            tailCalls.forEach(wrapWithArrowFunction);
          }
        }
      },
    },
  };
};
