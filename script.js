
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

  taskCount.textContent = todos.length === 1 ? "1 task" : `${todos.length} tasks`;
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
