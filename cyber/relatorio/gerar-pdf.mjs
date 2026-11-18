// Gera ../relatorio-gestao-de-risco.pdf a partir de relatorio.html, pelo protocolo de depuração do Chrome.
// Precisa do Chrome ou do Chromium 131 ou mais novo (numeração das páginas pelo CSS), do Node 22 ou mais novo e do
// pdftotext (poppler), que acha a página de cada título para o sumário.
// Rodar: node gerar-pdf.mjs   (ou CHROME=/caminho/do/chrome node gerar-pdf.mjs)
import { execFileSync, execSync, spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const chrome = process.env.CHROME ?? execSync("command -v google-chrome || command -v chromium || command -v chromium-browser", { shell: "/bin/bash" }).toString().trim();
const perfil = mkdtempSync(join(tmpdir(), "relatorio-"));
const proc = spawn(chrome, ["--headless", "--remote-debugging-port=0", "--allow-file-access-from-files", `--user-data-dir=${perfil}`, "about:blank"]);

const url = await new Promise((ok, erro) => {
  let log = "";
  proc.stderr.on("data", (d) => {
    log += d;
    const m = /DevTools listening on (ws:\S+)/.exec(log);
    if (m) ok(m[1]);
  });
  proc.on("exit", () => erro(new Error(log)));
});

const ws = new WebSocket(url);
await new Promise((ok) => ws.addEventListener("open", ok));
let id = 0;
const pend = new Map();
const eventos = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) {
    pend.get(m.id)(m);
    pend.delete(m.id);
  } else eventos.forEach((f) => f(m));
});
const send = (method, params = {}, sessionId) =>
  new Promise((ok, erro) => {
    const n = ++id;
    pend.set(n, (m) => (m.error ? erro(new Error(m.error.message)) : ok(m.result)));
    ws.send(JSON.stringify({ id: n, method, params, sessionId }));
  });

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
await send("Page.enable", {}, sessionId);
const carregou = new Promise((ok) => eventos.push((m) => m.method === "Page.loadEventFired" && ok()));
await send("Page.navigate", { url: `file://${join(aqui, "relatorio.html")}` }, sessionId);
await carregou;
await send("Runtime.evaluate", { expression: "document.fonts.ready.then(() => true)", awaitPromise: true }, sessionId);
const imprimir = async () =>
  Buffer.from((await send("Page.printToPDF", { preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false }, sessionId)).data, "base64");
const avaliar = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true }, sessionId)).result.value;

// 1ª passada: imprime e procura em que página cada título do sumário aparece (pulando capa e sumário)
const saida = join(aqui, "..", "relatorio-gestao-de-risco.pdf");
writeFileSync(saida, await imprimir());
const paginas = execFileSync("pdftotext", ["-layout", saida, "-"]).toString().split("\f");
const titulos = await avaliar(`[...document.querySelectorAll(".sumario .pg")].map((pg) => {
  const h = document.getElementById(pg.dataset.alvo);
  const n = h.querySelector(".n").textContent;
  return { alvo: pg.dataset.alvo, n, t: h.textContent.slice(n.length).trim() };
})`);
const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const achados = {};
for (const { alvo, n, t } of titulos) {
  const re = new RegExp(`^\\s*${esc(n)}\\s+${esc(t)}\\s*$`, "m");
  const i = paginas.findIndex((p, k) => k >= 2 && re.test(p));
  if (i < 0) throw new Error(`Título não achado no PDF: ${n} ${t}`);
  achados[alvo] = i + 1;
}

// 2ª passada: preenche os números e imprime de novo
await avaliar(`for (const [alvo, pg] of Object.entries(${JSON.stringify(achados)})) document.querySelector(\`.pg[data-alvo="\${alvo}"]\`).textContent = pg`);
writeFileSync(saida, await imprimir());

ws.close();
proc.kill();
rmSync(perfil, { recursive: true, force: true });
console.log("PDF gerado: cyber/relatorio-gestao-de-risco.pdf");
