/* eslint-disable @typescript-eslint/no-misused-promises */

import { clearLocalBaselines, generateBaselineTests } from "./baselines"

beforeAll(async () => {
    await clearLocalBaselines()
})

describe("baselines", generateBaselineTests)
