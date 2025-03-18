import type { TypescriptContext } from '@ts-type-explorer/api';

function createContext() {
  let getContext: (() => (TypescriptContext | undefined)) | undefined;

  return {
    get: () => getContext?.(),
    set: (value: () => (TypescriptContext | undefined)) => {
      getContext = value;
    },
  };
}

export const context = createContext();
