## Assignment 02 — AI Agent CLI Tool (Node.js)

This project is a **simple conversational CLI AI agent** (not an autonomous system).

When you run the CLI and type:

`Clone scaler academy website`

the agent uses a **basic agent loop**:

**START → THINK → TOOL → OBSERVE → OUTPUT**

and generates these static website files in the current folder:

- `index.html`
- `styles.css`
- `script.js`

The generated website includes:

- Header
- Hero section
- Footer

Reference page: `https://www.scaler.com/academy/mentee-dashboard/todos`

---

## Folder structure

```
AI Agent CLI Tool/
  agent.js
  tools.js
  systemPrompt.js
  package.json
  README.md
  .env.example
  (generated) index.html
  (generated) styles.css
  (generated) script.js
```

---

## Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Create `.env`

Copy `.env.example` to `.env` and add your key:

```env
GROQ_API_KEY=your_api_key_here
```

Optional:

```env
GROQ_MODEL=llama-3.3-70b-versatile
```

---

## Run the CLI

```bash
node agent.js
```

Example prompt to type:

`Clone scaler academy website`

When it finishes, open:

- `index.html` (double-click it)

---

## Live Server (for evaluation/demo)

Because the output is plain static HTML/CSS/JS, it works with any live server.

- **VS Code**: install the “Live Server” extension → right-click `index.html` → “Open with Live Server”
- **No extension** (one-liner):

```bash
npx serve .
```

---

## Mock mode (optional)

If you don’t have an API key during a demo, you can still generate the files with a built-in mock planner:

```bash
powershell -NoProfile -Command "$env:MOCK_MODE='1'; node agent.js"
```

---

## Screenshots (placeholders)

- Screenshot 1: CLI output (THINK/TOOL/OBSERVE/OUTPUT)
- Screenshot 2: Generated website in browser

---

## Demo video (placeholder)

- Demo video link: <add your link here>

