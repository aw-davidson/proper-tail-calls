const trampolineAST = require('./trampoline');
const template = require("@babel/template").default;

const isCallExpressionWithTco = (functionName, node) => {
  return node.type === 'CallExpression' && node.callee.name === functionName;
};

const isConditionalExpressionWithTco = (functionName, node) => {
  if (node.type === 'ConditionalExpression') {
    const { consequent, alternate } = node;

    return (
      isExpressionWithTco(functionName, consequent) ||
      isExpressionWithTco(functionName, alternate)
    );
  }

  return false;
};

const isExpressionWithTco = (functionName, node) => {
  return (
    isCallExpressionWithTco(functionName, node) ||
    isConditionalExpressionWithTco(functionName, node)
  );
};

const inFunctionTraversal = {
  ConditionalExpression(path) {
    if (
      path.parent.type === 'ArrowFunctionExpression' &&
      isConditionalExpressionWithTco(this.functionName, path.node)
    ) {
      this.tailCalls.push(path);
    }
  },

  ReturnStatement(path) {
    if (
      path.node.argument &&
      isExpressionWithTco(this.functionName, path.node.argument)
    ) {
      this.tailCalls.push(path);
    }
  },

  FunctionDeclaration() {
    this.needsClosure = true;
  },

  ArrowFunctionExpression() {
    this.needsClosure = true;
  },

  FunctionExpression() {
    this.needsClosure = true;
  }
};

function findTailCalls(fnPath, fnName) {
  const traverseContext = { tailCalls: [], functionName: fnName };
  fnPath.traverse(inFunctionTraversal, traverseContext);

  return {
    tailCalls: traverseContext.tailCalls,
    needsClosure: traverseContext.needsClosure
  };
}

module.exports = function(babel) {
  const { types: t } = babel;
  const wrapWithArrowFunction = path => {
    const id = path.scope.generateUidIdentifier('it');

    // create an arrow function that wraps and returns the expression
    // generating an arrow maintains lexical `this`
    const fn = t.arrowFunctionExpression(
      [id],
      t.blockStatement([t.returnStatement(path.node.argument)])
    );

    // replace the expression with the new wrapper that returns it
    path.replaceWith(fn);
  };
  return {
    name: 'ast-transform', // not required
    visitor: {
      Program(path) {
        path.node.body.push(trampolineAST);
      },
      Function(path) {
        if (path.node.id) {
          const { tailCalls, needsClosure } = findTailCalls(
            path,
            path.node.id.name
          );

          if (tailCalls.length > 0 && !needsClosure) {
            const functionExpressWrapperId = path.scope.generateUidIdentifier(`${path.node.id.name}`)
            const functionExpressionWrapper = t.functionExpression(path.node.id, path.node.params, path.node.body)

            let wrapper = t.variableDeclaration('var', [
              t.variableDeclarator(
                path.node.id,
                t.callExpression(trampolineAST.id, [functionExpressionWrapper])
              )
            ]);
            path.replaceWith(wrapper);

            // path.replaceWith(
            //   template('(FUNCTION(ARGUMENTS))')({
            //     FUNCTION: t.identifier('trampoline'),
            //     ARGUMENTS: path.node.id
            //   })
            // );

            tailCalls.forEach(wrapWithArrowFunction);
          }
        }
      }
    }
  };
};
