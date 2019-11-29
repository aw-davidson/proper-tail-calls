const buildTrampolineAST = require('./buildTrampoline');
const findTailCalls = require('./findTailCalls');

module.exports = function babelVisitorExport(babel) {
  const { types: t } = babel;

  let trampolineId;
  return {
    name: 'proper-tail-calls-transformer',
    visitor: {
      // Program runs once and is called first
      Program(path) {
        const trampolineAST = buildTrampolineAST({
          TRAMPOLINE_PLACEHOLDER_NAME: path.scope.generateUidIdentifier('trampoline'),
        });
        trampolineId = trampolineAST.id;
        path.node.body.push(trampolineAST);
      },
      FunctionDeclaration(path) {
        transformProperTailCalls({ path, t, trampolineId });
      },
      VariableDeclarator(path) {
        if ((path.get('init').isArrowFunctionExpression() || path.get('init').isFunctionExpression()) && path.get('id').isIdentifier()) {
          const functionName = path.get('id').node.name;
          const functionBody = path.get('init');

          const { tailCalls, needsClosure } = findTailCalls(functionBody, functionName);

          if (tailCalls.length > 0 && !needsClosure) {
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
            const trampolined = t.callExpression(trampolineId, [functionBody.node]);
            functionBody.replaceWith(trampolined);
          }
        }
      },
    },
  };
};

function transformProperTailCalls({ path, t, trampolineId }) {
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
          t.callExpression(trampolineId, [functionExpressionWrapper]),
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
