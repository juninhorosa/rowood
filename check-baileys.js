import { createRequire } from "module";
const require = createRequire(import.meta.url);

const pkg = require("@whiskeysockets/baileys/package.json");

console.log("📦 Baileys instalado no Render:", pkg.version);
