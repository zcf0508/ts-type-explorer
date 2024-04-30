/* eslint-disable import/no-extraneous-dependencies */
import type * as ts from "typescript/lib/tsserverlibrary"
import { type Language } from "@volar/language-core"
import { proxyCreateProgram } from "@volar/typescript"
import {
    VueCompilerOptions,
    createParsedCommandLine,
    createVueLanguagePlugin,
    resolveVueCompilerOptions,
} from "@vue/language-core"
import * as SourceMaps from "@volar/source-map"
import { SourceFileLocation, TypescriptContext } from "./types"

const windowsPathReg = /\\/g

// https://github.com/volarjs/volar.js/blob/v2.2.0-alpha.12/packages/typescript/lib/node/proxyCreateProgram.ts#L209
type VuePrograme = ts.Program & { __volar__?: { language: Language } }

let oldPrograme: VuePrograme | undefined

export function getPositionOfLineAndCharacterForVue(
    ctx: TypescriptContext,
    location: SourceFileLocation,
    startPos = -1
) {
    const fileName = location.fileName

    const compilerOptions = {
        ...ctx.program.getCompilerOptions(),
        rootDir: ctx.program.getCurrentDirectory(),
        declaration: true,
        emitDeclarationOnly: true,
        allowNonTsExtensions: true,
    }

    const options: ts.CreateProgramOptions = {
        host: ctx.ts.createCompilerHost(compilerOptions),
        rootNames: ctx.program.getRootFileNames(),
        options: compilerOptions,
        oldProgram: oldPrograme || ctx.program,
    }

    let vueOptions: VueCompilerOptions
    const createProgram = proxyCreateProgram(
        ctx.ts,
        ctx.ts.createProgram,
        (ts, _options) => {
            const { configFilePath } = _options.options
            vueOptions =
                typeof configFilePath === "string"
                    ? createParsedCommandLine(
                          ts,
                          ts.sys,
                          configFilePath.replace(windowsPathReg, "/")
                      ).vueOptions
                    : resolveVueCompilerOptions({
                          extensions: [".vue", ".cext"],
                      })
            return [
                createVueLanguagePlugin(
                    ts,
                    (id) => id,
                    _options.host?.useCaseSensitiveFileNames?.() ?? false,
                    () => "",
                    () =>
                        _options.rootNames.map((rootName) =>
                            rootName.replace(windowsPathReg, "/")
                        ),
                    _options.options,
                    vueOptions
                ),
            ]
        }
    )

    oldPrograme = oldPrograme ?? ctx.program

    if (!oldPrograme?.__volar__) {
        console.log("create vue program")
        oldPrograme = createProgram(options) as VuePrograme
    }

    if (oldPrograme.__volar__?.language.scripts) {
        const vFile = oldPrograme.__volar__.language.scripts.get(fileName)
        if (
            vFile?.generated?.root &&
            vFile?.generated?.root.languageId === "vue"
        ) {
            const code = vFile?.generated?.root?.embeddedCodes?.[0]
            if (code) {
                const sourceMap = new SourceMaps.SourceMap(code.mappings)
                startPos =
                    (sourceMap.getGeneratedOffset(startPos)?.[0] || -1) +
                    // https://github.com/volarjs/volar.js/blob/v2.2.0-alpha.12/packages/typescript/lib/node/proxyCreateProgram.ts#L143
                    (vFile?.generated?.root?.snapshot?.getLength() || 0)
            }
        }
    }

    return startPos
}
