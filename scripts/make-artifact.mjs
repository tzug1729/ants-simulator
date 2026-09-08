/**
 * ビルド済みの単一 HTML を Artifact 用の断片に変換する。
 * Artifact 側が <!doctype>/<head>/<body> を用意するので、中身だけを取り出す。
 */
import { readFileSync, writeFileSync } from "node:fs";

const source = "dist/index.html";
const target = "dist/artifact.html";

const html = readFileSync(source, "utf8");
const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? "";
const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? "";

if (!body.trim()) throw new Error(`${source} から body を取り出せませんでした`);

// charset / viewport / favicon は Artifact の外枠が持っている
const keptHead = head
  .replace(/<meta\b[^>]*>/gi, "")
  .replace(/<link\b[^>]*>/gi, "")
  .trim();
if (/<link\b/i.test(keptHead)) throw new Error("head から link を取り除けませんでした");
const fragment = `${keptHead}\n${body.trim()}\n`;

writeFileSync(target, fragment, "utf8");
console.log(`${target}  ${(Buffer.byteLength(fragment) / 1024).toFixed(1)} KB`);
