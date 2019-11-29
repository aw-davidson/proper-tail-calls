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
      FunctionDeclaration(path) {
        transformProperTailCalls({ path, t });
      },
      VariableDeclarator(path) {
        if ((path.get('init').isArrowFunctionExpression() || path.get('init').isFunctionExpression()) && path.get('id').isIdentifier()) {
          const functionName = path.get('id').node.name;
          const functionBody = path.get('init');

          const { tailCalls, needsClosure } = findTailCalls(functionBody, functionName);

          if (tailCalls.length > 0 && !needsClosure) {
            const trampolined = t.callExpression(t.identifier('trampoline'), [functionBody.node]);
            functionBody.replaceWith(trampolined);

            const wrapWithArrowFunction = (innerPath) => {
              if (!t.isBlockStatement(functionBody.node.body)) {
                const fn = t.arrowFunctionExpression(
                  [],
                  t.blockStatement([t.returnStatement(innerPath.node)]),
                );

                innerPath.replaceWith(fn);
              } else {
                const fn = t.arrowFunctionExpression(
                  [],
                  t.blockStatement([innerPath.node]),
                );

                innerPath.replaceWith(t.returnStatement(fn));
              }
            };

            tailCalls.forEach(wrapWithArrowFunction);
          }
        }
      },
    },
  };
};

function transformProperTailCalls({ path, t }) {
  if (path.node.id) {
    const { tailCalls, needsClosure } = findTailCalls(
      path,
      path.node.id.name,
    );

    if (tailCalls.length > 0 && !needsClosure) {
      const functionExpressionWrapper = t.functionExpression(
        path.node.id,
        path.node.params,
        path.node.body,
      );

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
}
