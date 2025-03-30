import assert from 'node:assert';
import path from 'node:path';
import { getSymbolOrTypeOfNode, getSymbolType } from '@ts-type-explorer/api';
import { createTsContext } from '../lib/tsUtil';

// describe("symbols of symbols", () => {
//     it("test", () => {
//         const ctx = createTsContext(
//             path.join(__dirname, "../cases/promise.ts")
//         )

//         const { sourceFile, typeChecker } = ctx

//         const node = sourceFile
//             .getChildren()[0]
//             .getChildren()[0]
//             .getChildren()[1]

//         const { symbol } = getSymbolOrTypeOfNode(ctx, node)!
//         assert(symbol)

//         const type = getSymbolType(ctx, symbol)

//         const prop = type.getProperties()[3]

//         assert.strictEqual(
//             typeChecker.symbolToString(prop),
//             "[Symbol.toStringTag]",
//         )
//     })
// })
