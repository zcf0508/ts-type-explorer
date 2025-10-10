import type { Language } from '@volar/language-core';
import type { TypeScriptServiceScript } from '@volar/typescript';
import type * as ts from 'typescript/lib/tsserverlibrary';
import type { SourceFileLocation, TypescriptContext } from './types';

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

export function getVueLanguage(projectOrProgram: ts.Program | ts.server.Project): Language | undefined {
  // https://github.com/vuejs/language-tools/blob/v2.0.16/packages/typescript-plugin/index.ts#L75
  // https://github.com/vuejs/language-tools/blob/v3.1.1/packages/typescript-plugin/index.ts#L39
  if ('__vue__' in projectOrProgram) {
    return (projectOrProgram.__vue__ as { language: Language }).language;
  }
  return undefined;
}

export function getPositionOfLineAndCharacterForVue(
  ctx: TypescriptContext & { sourceFile: ts.SourceFile },
  location: SourceFileLocation,
  startPos = -1,
  language: Language | undefined = undefined,
): [number, (startPos: number) => ts.LineAndCharacter | undefined] {
  const fileName = location.fileName;

  let fixLocation = (startPos: number): ts.LineAndCharacter | undefined => undefined;

  if (!language) {
    console.log('Vue language not found');
    return [startPos, fixLocation] as const;
  }

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
