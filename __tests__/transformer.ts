import * as ts from "typescript"
import { existsSync, readFileSync } from "fs"
import * as path from "path"
import transformer from "../transformer"

class VirtualHost implements ts.CompilerHost {
  files = new Map<string, string>()
  outputFiles = new Map<string, string>()
  modulesResolution = new Map<string, string>()

  getSourceFile(
    fileName: string,
    languageVersion: ts.ScriptTarget,
    _onError?: (message: string) => void,
  ): ts.SourceFile | undefined {
    const sourceText = this.readFile(fileName)
    return sourceText === undefined
      ? undefined
      : ts.createSourceFile(fileName, sourceText, languageVersion)
  }
  getDefaultLibFileName() {
    return path.join(path.dirname(require.resolve("typescript")), "lib.d.ts")
  }
  writeFile(fileName: string, content: string) {
    this.outputFiles.set(fileName, content)
  }
  getCurrentDirectory() {
    return "/"
  }
  getDirectories(_path: string) {
    return []
  }
  getCanonicalFileName(fileName: string) {
    return fileName
  }
  getNewLine() {
    return "\n"
  }
  useCaseSensitiveFileNames() {
    return true
  }
  fileExists(fileName: string): boolean {
    if (this.files.has(fileName)) {
      return true
    }
    return existsSync(fileName)
  }
  readFile(fileName: string): string | undefined {
    if (this.files.has(fileName)) {
      return this.files.get(fileName)
    }
    try {
      return readFileSync(fileName, { encoding: "utf-8" })
    } catch (e) {}
  }
  resolveModuleNames(
    moduleNames: string[],
    _containingFile: string,
  ): ts.ResolvedModule[] {
    return moduleNames.map(name => {
      const resolved = this.modulesResolution.get(name)
      if (!resolved) {
        throw new Error(`Unable to resolve module ${name}`)
      }
      return {
        resolvedFileName: resolved,
      }
    })
  }
}

function throwIfDiagnostics(
  diagnostics: ReadonlyArray<ts.Diagnostic>,
  host: ts.FormatDiagnosticsHost,
) {
  if (diagnostics.length > 0) {
    const formatedDiagnostics = ts.formatDiagnostics(diagnostics, host)
    throw new Error(formatedDiagnostics)
  }
}

function compile(input: string): string | undefined {
  const options: ts.CompilerOptions = {
    module: ts.ModuleKind.ES2015,
    target: ts.ScriptTarget.ES2018,
  }
  const host = new VirtualHost()
  host.files.set("input.ts", input)
  host.modulesResolution.set(
    "ts-transformer-meta",
    path.join(__dirname, "..", "index.ts"),
  )
  host.modulesResolution.set("typescript", require.resolve("typescript"))
  const program = ts.createProgram(["input.ts"], options, host)

  throwIfDiagnostics(
    [
      ...program.getOptionsDiagnostics(),
      ...program.getGlobalDiagnostics(),
      ...program.getSyntacticDiagnostics(),
      ...program.getSemanticDiagnostics(),
      ...program.getDeclarationDiagnostics(),
      ...program.getConfigFileParsingDiagnostics(),
    ],
    host,
  )

  const emitResult = program.emit(undefined, undefined, undefined, undefined, {
    before: [transformer(program)],
  })

  throwIfDiagnostics(emitResult.diagnostics, host)

  return host.outputFiles.get("input.js")
}

test("optional property", () => {
  expect(
    compile(`
    import { meta } from 'ts-transformer-meta'
    interface Foo {
      a?: number
    }
    meta<Foo>()
    `),
  ).toMatchSnapshot()
})

test("nested interfaces", () => {
  expect(
    compile(`
    import { meta } from 'ts-transformer-meta'
    interface Bar {
      b: number
    }
    interface Foo {
      a: Bar
    }
    meta<Foo>()
    `),
  ).toMatchSnapshot()
})

test("classes", () => {
  expect(
    compile(`
    import { meta } from 'ts-transformer-meta'
    class Biz {
      get foo() {
        return 42
      }
    }
    meta<Biz>()
    `),
  ).toMatchSnapshot()
})

test("union", () => {
  expect(
    compile(`
    import { meta } from 'ts-transformer-meta'
    meta<"foo" | "bar">()
    `),
  ).toMatchSnapshot()
})

test("enum", () => {
  expect(
    compile(`
    import { meta } from 'ts-transformer-meta'
    enum A {
      Foo,
      Bar,
    }
    meta<A>()
    `),
  ).toMatchSnapshot()
})
