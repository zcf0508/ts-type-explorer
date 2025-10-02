import type { Language } from '@volar/language-core';
import type { TypeScriptServiceScript } from '@volar/typescript';
import type * as ts from 'typescript/lib/tsserverlibrary';
import type { SourceFileLocation, TypescriptContext } from './types';

type VueProject = ts.server.Project & {
  // https://github.com/vuejs/language-tools/blob/v2.0.16/packages/typescript-plugin/index.ts#L75
  __vue__?: { language: Language }
};

type VueProgram = ts.Program & {
  // https://github.com/vuejs/language-tools/blob/v2.0.16/packages/typescript-plugin/index.ts#L75
  __vue__?: { language: Language }
};

function getMappingOffset(
  language: Language,
  serviceScript: TypeScriptServiceScript,
): number {
  if (serviceScript.preventLeadingOffset) {
    return 0;
  }
  const sourceScript = language.scripts.fromVirtualCode(serviceScript.code);
  return sourceScript.snapshot.getLength();
}

export function getPositionOfLineAndCharacterForVue(
  ctx: TypescriptContext & { sourceFile: ts.SourceFile },
  location: SourceFileLocation,
  startPos = -1,
): [number, (startPos: number) => ts.LineAndCharacter | undefined] {
  const fileName = location.fileName;

  const project = ctx.project as VueProject;
  const program = ctx.program as VueProgram;

  let fixLocation = (startPos: number): ts.LineAndCharacter | undefined => undefined;

  if (!project?.__vue__ && !program?.__vue__) {
    console.log('Vue language not found');
    return [startPos, fixLocation] as const;
  }

  const language = (project.__vue__?.language || program.__vue__?.language)!;
  if (language?.scripts) {
    const vFile = language.scripts.get(fileName);
    const serviceScript
            = vFile?.generated?.languagePlugin.typescript?.getServiceScript(
              vFile.generated.root,
            );
    if (vFile?.generated?.root?.languageId === 'vue' && serviceScript) {
      const sourceMap = language.maps.get(serviceScript.code, vFile);

      const snapshotLength = getMappingOffset(language, serviceScript);

      for (const [generatedLocation] of sourceMap.toGeneratedLocation(
        startPos,
      )) {
        if (generatedLocation) {
          startPos = generatedLocation + snapshotLength;
        }
      }

      fixLocation = (startPos: number) => {
        for (const [sourceLocation] of sourceMap.toSourceLocation(
          startPos - snapshotLength,
        )) {
          if (sourceLocation) {
            const restoreLocation
                            = ctx.sourceFile.getLineAndCharacterOfPosition(
                              sourceLocation,
                            );
            return restoreLocation;
          }
        }

        return undefined;
      };
    }
  }

  return [startPos, fixLocation] as const;
}
