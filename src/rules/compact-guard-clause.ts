import type { Rule } from "eslint";
import type { Comment, IfStatement, Node, ReturnStatement, ThrowStatement } from "estree";

type GuardStatement = ReturnStatement | ThrowStatement;

function isGuardStatement(node: Node | null | undefined): node is GuardStatement {
  return (
    node != null && (node.type === "ReturnStatement" || node.type === "ThrowStatement")
  );
}

const DOCS_URL =
  "https://github.com/danielshawellis/eslint-plugin-compact-guards/blob/main/docs/rules/compact-guard-clause.md";

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Enforce compact guard clauses: omit braces and start the return/throw keyword on the same line as the closing parenthesis of the condition.",
      recommended: true,
      url: DOCS_URL,
    },
    fixable: "code",
    schema: [],
    messages: {
      compactGuard:
        "Guard clause should be compact: omit braces and start `{{keyword}}` on the same line as the closing parenthesis of the condition.",
      compactGuardUnsafe:
        "Guard clause should be compact, but it was not fixed automatically because relocating its comments could change their meaning; rewrite it manually.",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return {
      IfStatement(node: IfStatement) {
        // Only handle standalone guard clauses: skip `else if` branches...
        const parent = (node as Node & { parent?: Node }).parent;
        if (parent && parent.type === "IfStatement" && parent.alternate === node) {
          return;
        }
        // ...and skip `if` statements that carry an `else`/`else if` branch.
        if (node.alternate) {
          return;
        }

        const consequent = node.consequent;
        let statement: GuardStatement;
        let hasBraces = false;

        if (consequent.type === "BlockStatement") {
          if (consequent.body.length !== 1) {
            return;
          }
          const only = consequent.body[0];
          if (!isGuardStatement(only)) {
            return;
          }
          statement = only;
          hasBraces = true;
        } else if (isGuardStatement(consequent)) {
          statement = consequent;
        } else {
          return;
        }

        const closeParen = sourceCode.getTokenBefore(consequent);
        const keywordToken = sourceCode.getFirstToken(statement);
        if (!closeParen || !keywordToken || !closeParen.loc || !keywordToken.loc) {
          return;
        }

        const keyword = keywordToken.value;
        const keywordOnSameLine = closeParen.loc.end.line === keywordToken.loc.start.line;

        // Already compact: no braces and the keyword starts on the closing paren's line.
        if (!hasBraces && keywordOnSameLine) {
          return;
        }

        const regionStart = closeParen.range![1];
        const regionEnd = consequent.range![1];
        const [statementStart, statementEnd] = statement.range!;

        // A fix would collapse everything between the closing paren and the end of
        // the consequent down to a single space plus the guard statement text. Any
        // comment in that region but outside the statement itself would be dropped
        // or relocated, so those cases are reported without an automatic fix.
        const hasAmbiguousComments = sourceCode.getAllComments().some((comment: Comment) => {
          const [commentStart, commentEnd] = comment.range!;
          const insideRegion = commentStart >= regionStart && commentEnd <= regionEnd;
          const insideStatement =
            commentStart >= statementStart && commentEnd <= statementEnd;
          return insideRegion && !insideStatement;
        });

        if (hasAmbiguousComments) {
          context.report({ node, messageId: "compactGuardUnsafe", data: { keyword } });
          return;
        }

        context.report({
          node,
          messageId: "compactGuard",
          data: { keyword },
          fix(fixer) {
            const statementText = sourceCode.getText(statement);
            return fixer.replaceTextRange([regionStart, regionEnd], ` ${statementText}`);
          },
        });
      },
    };
  },
};

export default rule;
