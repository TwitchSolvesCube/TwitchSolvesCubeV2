#!/usr/bin/env node

import {barelyServe} from "barely-a-dev-server";

export const COMMON_BUILD_OPTIONS = {
  entryRoot: "./client",
  esbuildOptions: {chunkNames: "chunks/[name]-[hash]"}
}

if (process.argv.at(-1) === "--dev") {

  barelyServe(COMMON_BUILD_OPTIONS);

} else {

  const outDir = "./dist/web";
  await barelyServe({
    ...COMMON_BUILD_OPTIONS,
    dev: false,
    outDir,
  });

  console.log(`
Your app has been built in: ${outDir}
`)
}
