// Copyright (c) 2026 Beijing Volcano Engine Technology Co., Ltd.
// SPDX-License-Identifier: MIT

import { hookResponse } from "./dev-command.mjs";

const host = process.argv[2];
let response = host === "cursor" ? { permission: "allow" } : {};
try {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
    if (input.length > 1_000_000) throw new Error("Hook input too large");
  }
  response = hookResponse(JSON.parse(input), host);
} catch { /* Invalid input and filesystem errors must not block development. */ }
process.stdout.write(`${JSON.stringify(response)}\n`);
