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
  <img width="2527" height="1348" alt="Screenshot 2026-05-06 165957" src="https://github.com/user-attachments/assets/f562266c-e8d6-4f19-b752-1ecb5d9c0123" />

- Screenshot 2: Generated website in browser
<img width="1147" height="569" alt="Screenshot 2026-05-06 170051" src="https://github.com/user-attachments/assets/5dc63aec-f5b1-421a-b71d-c4ce656902db" />
<img width="2167" height="1136" alt="Screenshot 2026-05-06 170122" src="https://github.com/user-attachments/assets/12a3e3cf-879a-4fbc-87b5-91c31ada502a" />
<img width="2154" height="1211" alt="Screenshot 2026-05-06 170136" src="https://github.com/user-attachments/assets/435eb641-d445-4919-9668-d486f31a164b" />
<img width="2146" height="760" alt="Screenshot 2026-05-06 170153" src="https://github.com/user-attachments/assets/8589f5d0-87e6-471e-b3e1-e635bf68aaf4" />


---

## Demo video (placeholder)

- Demo video link: <add your link here>

