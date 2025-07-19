#!/usr/bin/env node

import {barelyServe} from "barely-a-dev-server";
import { readFileSync } from 'fs';

const { clientPort } = JSON.parse(readFileSync('./server/config.json', 'utf-8'));

export const COMMON_BUILD_OPTIONS = {
  entryRoot: "./client",
  esbuildOptions: {chunkNames: "chunks/[name]-[hash]"}
}

if (process.argv.at(-1) === "--dev") {

  barelyServe({
    ...COMMON_BUILD_OPTIONS, port: clientPort});
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
