import { copyFile, mkdir } from "node:fs/promises";

const installed = new URL("../node_modules/@azure/msal-browser/", import.meta.url);
const target = new URL("../public/sharepoint-auth/", import.meta.url);
await mkdir(target, { recursive: true });
await Promise.all([
  ["lib/msal-browser.min.js", "msal-browser.min.js"],
  ["lib/redirect-bridge/msal-redirect-bridge.min.js", "msal-redirect-bridge.min.js"],
  ["LICENSE", "LICENSE"]
].map(([source, destination]) => copyFile(new URL(source, installed), new URL(destination, target))));
