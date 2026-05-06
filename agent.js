require("dotenv").config();

const readline = require("readline");
const fs = require("fs");
const path = require("path");

const { systemPrompt } = require("./systemPrompt");
const { writeFile, executeCommand } = require("./tools");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const MOCK_MODE = String(process.env.MOCK_MODE || "").trim() === "1";

const USE_GROQ = !!GROQ_API_KEY && !MOCK_MODE;

function fileExists(filename) {
  return fs.existsSync(path.resolve(process.cwd(), filename));
}

function readTextFile(filename) {
  try {
    return fs.readFileSync(path.resolve(process.cwd(), filename), "utf8");
  } catch {
    return "";
  }
}

function hasRequiredSections(html) {
  const h = String(html || "").toLowerCase();
  return h.includes("<header") && h.includes('class="hero"') && h.includes("<footer");
}

function scriptLooksComplete(js) {
  const s = String(js || "");
  return s.includes("STORAGE_KEY") && s.includes("localStorage") && s.includes("render()");
}

function stylesLooksComplete(css) {
  const c = String(css || "");
  return c.includes(":root") && c.includes(".header") && c.includes(".footer") && c.length > 800;
}

function logPhase(phase, text) {
  console.log(`\n=== ${phase} ===`);
  if (text) console.log(text);
}

async function callGroq(messages) {
  async function requestOnce(body) {
    return fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  }

  // Try to force JSON (some models support this; if not, we fall back).
  const baseBody = {
    model: GROQ_MODEL,
    temperature: 0.2,
    max_tokens: 900,
    messages
  };

  let res = await requestOnce({
    ...baseBody,
    response_format: { type: "json_object" }
  });

  if (!res.ok) {
    // If response_format isn't supported, retry without it.
    res = await requestOnce(baseBody);
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Groq API error (${res.status}): ${txt}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim() !== "") return content;

  // Some responses come back with empty content even though the request succeeded.
  // Do one small retry with a stronger nudge.
  const retryMessages = [
    ...messages,
    {
      role: "user",
      content:
        'IMPORTANT: Reply with ONE valid JSON object only. Do not return an empty message. Use keys: step, content, tool_name, tool_args.'
    }
  ];

  const retryRes = await requestOnce({
    ...baseBody,
    messages: retryMessages,
    response_format: { type: "json_object" }
  });

  if (!retryRes.ok) {
    const txt = await retryRes.text();
    throw new Error(`Groq API error on retry (${retryRes.status}): ${txt}`);
  }

  const retryData = await retryRes.json();
  const retryContent = retryData?.choices?.[0]?.message?.content;
  if (typeof retryContent !== "string" || retryContent.trim() === "") {
    throw new Error(
      `No content returned from model (after retry). Raw response: ${JSON.stringify(
        retryData
      )}`
    );
  }
  return retryContent;
}

function buildSiteFiles() {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Scaler Academy — Todos (Clone)</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <header class="header">
      <div class="container header__inner">
        <div class="brand">
          <div class="brand__logo">S</div>
          <div class="brand__text">
            <div class="brand__name">Scaler</div>
            <div class="brand__sub">Academy</div>
          </div>
        </div>

        <nav class="nav">
          <a href="#" class="nav__link">Dashboard</a>
          <a href="#" class="nav__link nav__link--active">Todos</a>
          <a href="#" class="nav__link">Calendar</a>
          <a href="#" class="nav__link">Profile</a>
        </nav>

        <button class="btn btn--primary" id="btnLogin" type="button">Log in</button>
      </div>
    </header>

    <main>
      <section class="hero">
        <div class="container hero__inner">
          <div class="hero__left">
            <h1 class="hero__title">Mentee Dashboard — Todos</h1>
            <p class="hero__subtitle">
              A simple static clone inspired by Scaler Academy’s todo dashboard page.
              Add tasks, mark them done, and stay consistent.
            </p>

            <div class="hero__card">
              <div class="todo">
                <div class="todo__top">
                  <h2 class="todo__title">Today’s tasks</h2>
                  <span class="todo__meta" id="taskCount">0 tasks</span>
                </div>

                <form class="todo__form" id="todoForm" autocomplete="off">
                  <input
                    class="input"
                    id="todoInput"
                    placeholder="Add a new task (e.g., Solve 2 DSA questions)"
                  />
                  <button class="btn btn--dark" type="submit">Add</button>
                </form>

                <ul class="todo__list" id="todoList"></ul>

                <div class="todo__actions">
                  <button class="btn btn--ghost" id="clearDone" type="button">Clear done</button>
                  <button class="btn btn--ghost" id="clearAll" type="button">Clear all</button>
                </div>
              </div>
            </div>
          </div>

          <aside class="hero__right">
            <div class="stat">
              <div class="stat__label">Streak</div>
              <div class="stat__value">7 days</div>
              <div class="stat__hint">Keep building momentum.</div>
            </div>
            <div class="stat">
              <div class="stat__label">Next session</div>
              <div class="stat__value">Today, 7:30 PM</div>
              <div class="stat__hint">Be ready 5 minutes early.</div>
            </div>
            <div class="stat stat--accent">
              <div class="stat__label">Tip</div>
              <div class="stat__value">Small steps</div>
              <div class="stat__hint">Consistency beats intensity.</div>
            </div>
          </aside>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="container footer__inner">
        <div class="footer__left">
          <div class="footer__brand">Scaler (Clone)</div>
          <div class="footer__note">Made for Assignment 02 — AI Agent CLI Tool.</div>
        </div>
        <div class="footer__right">
          <a class="footer__link" href="#">Terms</a>
          <a class="footer__link" href="#">Privacy</a>
          <a class="footer__link" href="#">Contact</a>
        </div>
      </div>
    </footer>

    <script src="script.js"></script>
  </body>
</html>
`;

  const css = `
:root{
  --bg: #0b1220;
  --surface: rgba(255,255,255,0.06);
  --surface-2: rgba(255,255,255,0.10);
  --text: #e8ecf3;
  --muted: rgba(232,236,243,0.72);
  --brand: #ff6a3d;
  --brand-2: #ff905f;
  --shadow: 0 18px 50px rgba(0,0,0,0.35);
  --radius: 16px;
}

*{ box-sizing: border-box; }
html,body{ height: 100%; }
body{
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Apple Color Emoji", "Segoe UI Emoji";
  background:
    radial-gradient(1200px 700px at 20% -10%, rgba(255,106,61,0.25), transparent 55%),
    radial-gradient(1000px 600px at 85% 20%, rgba(72,173,255,0.18), transparent 55%),
    var(--bg);
  color: var(--text);
}

a{ color: inherit; text-decoration: none; }
.container{ width: min(1100px, 92%); margin: 0 auto; }

.header{
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(10px);
  background: rgba(11,18,32,0.7);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.header__inner{
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  gap: 18px;
}

.brand{ display: flex; align-items: center; gap: 10px; }
.brand__logo{
  width: 38px; height: 38px;
  border-radius: 12px;
  display: grid; place-items: center;
  font-weight: 800;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  color: #111;
}
.brand__name{ font-weight: 800; letter-spacing: 0.2px; }
.brand__sub{ font-size: 12px; color: var(--muted); margin-top: 2px; }

.nav{ display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.nav__link{
  padding: 8px 10px;
  border-radius: 12px;
  color: var(--muted);
  transition: background 120ms ease, color 120ms ease;
}
.nav__link:hover{ background: rgba(255,255,255,0.06); color: var(--text); }
.nav__link--active{
  background: rgba(255,106,61,0.14);
  color: var(--text);
  border: 1px solid rgba(255,106,61,0.25);
}

.btn{
  border: 0;
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 700;
}
.btn--primary{
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  color: #121826;
}
.btn--dark{
  background: rgba(255,255,255,0.12);
  color: var(--text);
  border: 1px solid rgba(255,255,255,0.14);
}
.btn--ghost{
  background: transparent;
  color: var(--muted);
  border: 1px solid rgba(255,255,255,0.14);
}
.btn--ghost:hover{ color: var(--text); background: rgba(255,255,255,0.06); }

.hero{ padding: 34px 0 40px; }
.hero__inner{
  display: grid;
  grid-template-columns: 1.4fr 0.8fr;
  gap: 20px;
  align-items: start;
}
.hero__title{ margin: 0; font-size: clamp(28px, 3vw, 40px); letter-spacing: -0.4px; }
.hero__subtitle{ margin: 10px 0 0; color: var(--muted); line-height: 1.55; max-width: 62ch; }

.hero__card{ margin-top: 18px; }
.todo{
  background: var(--surface);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow);
}
.todo__top{
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.todo__title{ margin: 0; font-size: 18px; }
.todo__meta{ color: var(--muted); font-size: 13px; }

.todo__form{
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.input{
  flex: 1;
  padding: 12px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.08);
  color: var(--text);
  outline: none;
}
.input::placeholder{ color: rgba(232,236,243,0.55); }
.input:focus{ border-color: rgba(255,106,61,0.45); }

.todo__list{
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 10px;
}
.todo__item{
  display: grid;
  grid-template-columns: 20px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
}
.todo__check{
  width: 18px; height: 18px;
}
.todo__text{
  color: var(--text);
  line-height: 1.35;
}
.todo__text--done{
  color: rgba(232,236,243,0.55);
  text-decoration: line-through;
}
.todo__remove{
  background: transparent;
  border: 1px solid rgba(255,255,255,0.14);
  color: var(--muted);
  border-radius: 10px;
  padding: 7px 10px;
  cursor: pointer;
}
.todo__remove:hover{
  background: rgba(255,255,255,0.06);
  color: var(--text);
}

.todo__actions{
  display: flex;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.stat{
  background: var(--surface);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow);
  margin-bottom: 14px;
}
.stat--accent{
  border-color: rgba(255,106,61,0.25);
  background: rgba(255,106,61,0.10);
}
.stat__label{ color: var(--muted); font-size: 13px; }
.stat__value{ font-size: 22px; font-weight: 800; margin-top: 6px; }
.stat__hint{ color: var(--muted); margin-top: 8px; line-height: 1.45; }

.footer{
  border-top: 1px solid rgba(255,255,255,0.08);
  background: rgba(11,18,32,0.6);
  padding: 18px 0;
}
.footer__inner{
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.footer__brand{ font-weight: 800; }
.footer__note{ color: var(--muted); font-size: 13px; margin-top: 4px; }
.footer__right{ display: flex; gap: 12px; }
.footer__link{ color: var(--muted); padding: 6px 8px; border-radius: 10px; }
.footer__link:hover{ color: var(--text); background: rgba(255,255,255,0.06); }

@media (max-width: 900px){
  .hero__inner{ grid-template-columns: 1fr; }
}
@media (max-width: 560px){
  .nav{ display: none; }
}
`;

  const js = `
const STORAGE_KEY = "scaler_clone_todos_v1";

const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");
const taskCount = document.getElementById("taskCount");
const clearDone = document.getElementById("clearDone");
const clearAll = document.getElementById("clearAll");
const btnLogin = document.getElementById("btnLogin");

function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function render() {
  const todos = loadTodos();
  todoList.innerHTML = "";

  for (const item of todos) {
    const li = document.createElement("li");
    li.className = "todo__item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo__check";
    checkbox.checked = !!item.done;
    checkbox.addEventListener("change", () => {
      const next = loadTodos().map((t) => (t.id === item.id ? { ...t, done: !t.done } : t));
      saveTodos(next);
      render();
    });

    const text = document.createElement("div");
    text.className = "todo__text" + (item.done ? " todo__text--done" : "");
    text.textContent = item.text;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "todo__remove";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      const next = loadTodos().filter((t) => t.id !== item.id);
      saveTodos(next);
      render();
    });

    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(removeBtn);
    todoList.appendChild(li);
  }

  taskCount.textContent = todos.length === 1 ? "1 task" : \`\${todos.length} tasks\`;
}

todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = todoInput.value.trim();
  if (!value) return;

  const next = loadTodos();
  next.unshift({ id: crypto.randomUUID(), text: value, done: false });
  saveTodos(next);
  todoInput.value = "";
  render();
});

clearDone.addEventListener("click", () => {
  const next = loadTodos().filter((t) => !t.done);
  saveTodos(next);
  render();
});

clearAll.addEventListener("click", () => {
  saveTodos([]);
  render();
});

btnLogin.addEventListener("click", () => {
  alert("This is a static clone for an assignment. No real login here.");
});

render();
`;

  return { html, css, js };
}

function mockModelResponse() {
  const done =
    fileExists("index.html") && fileExists("styles.css") && fileExists("script.js");

  if (!done) {
    const missing = [];
    if (!fileExists("index.html")) missing.push("index.html");
    if (!fileExists("styles.css")) missing.push("styles.css");
    if (!fileExists("script.js")) missing.push("script.js");

    return JSON.stringify({
      step: "THINK",
      content: `MOCK_MODE is on. I will generate the missing files one by one: ${missing.join(
        ", "
      )}.`,
      tool_name: "",
      tool_args: ""
    });
  }

  return JSON.stringify({
    step: "OUTPUT",
    content: "All files already exist. Generation complete.",
    tool_name: "",
    tool_args: ""
  });
}

function mockPlannerNextTool() {
  const { html, css, js } = buildSiteFiles();

  const currentHtml = fileExists("index.html") ? readTextFile("index.html") : "";
  const currentCss = fileExists("styles.css") ? readTextFile("styles.css") : "";
  const currentJs = fileExists("script.js") ? readTextFile("script.js") : "";

  // If Groq created incomplete placeholder files before a fallback, overwrite them.
  if (!fileExists("index.html") || !hasRequiredSections(currentHtml)) {
    return JSON.stringify({
      step: "TOOL",
      content: "Create/overwrite index.html (must include header, hero, footer)",
      tool_name: "writeFile",
      tool_args: JSON.stringify({ filename: "index.html", content: html })
    });
  }

  if (!fileExists("styles.css") || !stylesLooksComplete(currentCss)) {
    return JSON.stringify({
      step: "TOOL",
      content: "Create/overwrite styles.css (full styling)",
      tool_name: "writeFile",
      tool_args: JSON.stringify({ filename: "styles.css", content: css })
    });
  }

  if (!fileExists("script.js") || !scriptLooksComplete(currentJs)) {
    return JSON.stringify({
      step: "TOOL",
      content: "Create/overwrite script.js (todo interactivity)",
      tool_name: "writeFile",
      tool_args: JSON.stringify({ filename: "script.js", content: js })
    });
  }

  return JSON.stringify({
    step: "OUTPUT",
    content: "All website files created. Open index.html in a browser.",
    tool_name: "",
    tool_args: ""
  });
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toolResultToObserve(result) {
  return `TOOL_RESULT: ${JSON.stringify(result)}`;
}

async function runAgent(userInstruction) {
  const messages = [
    { role: "system", content: systemPrompt.trim() },
    {
      role: "user",
      content: `User instruction: ${userInstruction}\n\nCreate index.html, styles.css, script.js in the current folder.`
    }
  ];

  logPhase("START", `Instruction received: ${userInstruction}`);
  let useGroq = USE_GROQ;
  if (!useGroq) {
    logPhase(
      "THINK",
      "No Groq API key found (or MOCK_MODE=1). Running in MOCK_MODE so the demo still generates files."
    );
  }

  const maxTurns = 30;
  for (let turn = 1; turn <= maxTurns; turn++) {
    let raw;
    if (useGroq) {
      try {
        raw = await callGroq(messages);
      } catch (err) {
        logPhase(
          "OBSERVE",
          `Groq call failed. Falling back to MOCK_MODE.\n${err?.message || err}`
        );
        useGroq = false;
        raw = turn === 1 ? mockModelResponse() : mockPlannerNextTool();
      }
    } else {
      raw = turn === 1 ? mockModelResponse() : mockPlannerNextTool();
    }
    const obj = safeJsonParse(raw);

    if (!obj || typeof obj !== "object") {
      throw new Error(
        `Model did not return valid JSON.\n---\n${raw}\n---\nTip: tighten your systemPrompt.`
      );
    }

    const step = String(obj.step || "").trim();
    const content = String(obj.content || "").trim();
    const toolName = String(obj.tool_name || "").trim();
    const toolArgs = String(obj.tool_args || "").trim();

    if (step === "THINK") logPhase("THINK", content);
    else if (step === "TOOL") logPhase("TOOL", `${toolName} ${toolArgs}`);
    else if (step === "OBSERVE") logPhase("OBSERVE", content);
    else if (step === "OUTPUT") logPhase("OUTPUT", content);
    else logPhase(step || "STEP", content);

    messages.push({ role: "assistant", content: raw });

    if (toolName) {
      let argsObj = {};
      try {
        argsObj = toolArgs ? JSON.parse(toolArgs) : {};
      } catch {
        argsObj = { raw: toolArgs };
      }

      let result;
      if (toolName === "writeFile") {
        result = writeFile(argsObj.filename, argsObj.content);
      } else if (toolName === "executeCommand") {
        result = executeCommand(argsObj.cmd);
      } else {
        result = { ok: false, error: `Unknown tool: ${toolName}` };
      }

      logPhase("OBSERVE", JSON.stringify(result, null, 2));
      messages.push({ role: "user", content: toolResultToObserve(result) });
      continue;
    }

    const done =
      fileExists("index.html") && fileExists("styles.css") && fileExists("script.js");
    if (step === "OUTPUT" && done) return;
  }

  throw new Error("Agent did not finish within maxTurns.");
}

function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("AI Agent CLI Tool");
  console.log('Type an instruction (e.g., "Clone scaler academy website")');
  rl.question("> ", async (instruction) => {
    try {
      await runAgent(instruction);
      console.log("\nDone. Open index.html in your browser.");
    } catch (err) {
      console.error("\nError:", err.message || err);
      process.exitCode = 1;
    } finally {
      rl.close();
    }
  });
}

main();

