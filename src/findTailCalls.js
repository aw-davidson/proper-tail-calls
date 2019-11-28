
function isProperCallExpression(functionName, node) {
  return node.type === 'CallExpression' && node.callee.name === functionName;
}

function isProperExpression(functionName, node) {
  return isProperCallExpression(functionName, node)
    || isProperConditionalExpression(functionName, node);
}

function isProperConditionalExpression(functionName, node) {
  if (node.type === 'ConditionalExpression') {
    const { consequent, alternate } = node;

    return (
      isProperExpression(functionName, consequent)
      || isProperExpression(functionName, alternate)
    );
  }

  return false;
}

const functionTraversal = {
  ConditionalExpression(path) {
    if (
      path.parent.type === 'ArrowFunctionExpression'
      && isProperConditionalExpression(this.functionName, path.node)
    ) {
      this.tailCalls.push(path);
    }
  },

  ReturnStatement(path) {
    if (
      path.node.argument
      && isProperExpression(this.functionName, path.node.argument)
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
  },
};

function findTailCalls(fnPath, fnName) {
  const traverseContext = { tailCalls: [], functionName: fnName };
  fnPath.traverse(functionTraversal, traverseContext);

  return {
    tailCalls: traverseContext.tailCalls,
    needsClosure: traverseContext.needsClosure,
  };
}

module.exports = findTailCalls;
