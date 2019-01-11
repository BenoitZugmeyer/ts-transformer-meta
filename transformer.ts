import * as ts from "typescript"
import * as path from "path"

const indexTs = path.join(__dirname, "index.ts")

export default function transformer(
  program: ts.Program,
): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => (file: ts.SourceFile) =>
    visitSourceFileAndChildren(file, program, context)
}

function visitSourceFileAndChildren(
  sourceFile: ts.SourceFile,
  program: ts.Program,
  context: ts.TransformationContext,
) {
  return ts.visitEachChild(
    sourceFile,
    childNode => visitNodeAndChildren(childNode, program, context),
    context,
  )
}

function visitNodeAndChildren(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext,
): ts.Node {
  return ts.visitEachChild(
    transformNode(node, program),
    childNode => visitNodeAndChildren(childNode, program, context),
    context,
  )
}

function transformNode(node: ts.Node, program: ts.Program): ts.Node {
  const typeChecker = program.getTypeChecker()
  if (!isKeysCallExpression(node, typeChecker)) {
    return node
  }
  if (!node.typeArguments) {
    return ts.createArrayLiteral([])
  }
  const type = typeChecker.getTypeFromTypeNode(node.typeArguments[0])
  return generateTypeMeta(typeChecker, type)
}

function generateTypeMeta(
  typeChecker: ts.TypeChecker,
  type: ts.Type,
): ts.Expression {
  const props = [
    ts.createPropertyAssignment("flags", ts.createLiteral(type.flags)),
  ]
  if (type.isClassOrInterface()) {
    props.push(
      ts.createPropertyAssignment(
        "objectFlags",
        ts.createLiteral(type.objectFlags),
      ),
    )
    props.push(
      ts.createPropertyAssignment(
        "properties",
        ts.createArrayLiteral(
          type.getProperties().map(property => {
            return ts.createObjectLiteral(
              [
                ts.createPropertyAssignment(
                  "name",
                  ts.createLiteral(property.name),
                ),
                ts.createPropertyAssignment(
                  "value",
                  generateTypeMeta(
                    typeChecker,
                    typeChecker.getTypeAtLocation(property.valueDeclaration),
                  ),
                ),
                ts.createPropertyAssignment(
                  "optional",
                  ts.createLiteral(
                    Boolean(property.flags & ts.SymbolFlags.Optional),
                  ),
                ),
              ],
              true,
            )
          }),
        ),
      ),
    )
  }
  if (type.isUnionOrIntersection()) {
    props.push(
      ts.createPropertyAssignment(
        "types",
        ts.createArrayLiteral(
          type.types.map(type => generateTypeMeta(typeChecker, type)),
        ),
      ),
    )
  }
  if (type.isLiteral()) {
    props.push(
      ts.createPropertyAssignment("value", ts.createLiteral(type.value)),
    )
  }
  return ts.createObjectLiteral(props, true)
}

function isKeysCallExpression(
  node: ts.Node,
  typeChecker: ts.TypeChecker,
): node is ts.CallExpression {
  if (!ts.isCallExpression(node)) return false
  const signature = typeChecker.getResolvedSignature(node)
  if (!signature) return false
  const declaration = signature.getDeclaration()
  return Boolean(
    declaration &&
      declaration.getSourceFile().fileName === indexTs &&
      declaration.kind === ts.SyntaxKind.FunctionDeclaration &&
      declaration.name &&
      declaration.name.getText() === "meta",
  )
}
