const DRAFT_KEY = "arapca-gorusme-formu-draft-v2";

const el = {
  loading: document.getElementById("loading-view"),
  error: document.getElementById("error-view"),
  errorMessage: document.getElementById("error-message"),
  retry: document.getElementById("btn-retry"),
  view: document.getElementById("form-view"),
  title: document.getElementById("form-title"),
  desc: document.getElementById("form-desc"),
  form: document.getElementById("form"),
  host: document.getElementById("section-host"),
  progress: document.getElementById("progress"),
  progressBar: document.getElementById("progress-bar"),
  progressText: document.getElementById("progress-text"),
  saveState: document.getElementById("save-state"),
  back: document.getElementById("btn-back"),
  next: document.getElementById("btn-next"),
  done: document.getElementById("done-view"),
  again: document.getElementById("btn-again"),
};

const state = {
  form: null,
  index: 0,
  answers: {},
  serverErrors: {},
  busy: false,
};

let saveTimer = null;
let noticeTimer = null;

const sections = () => state.form?.sections ?? [];

function show(view) {
  for (const node of [el.loading, el.error, el.view, el.done]) {
    if (node) node.hidden = node !== view;
  }
}

function showNotice(text) {
  el.saveState.textContent = text;
  el.saveState.classList.add("is-visible");
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => el.saveState.classList.remove("is-visible"), 2200);
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (!draft || typeof draft !== "object" || !draft.answers) return null;
    return draft;
  } catch {
    return null;
  }
}

function saveDraft() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          index: state.index,
          answers: state.answers,
          savedAt: new Date().toISOString(),
        }),
      );
      showNotice("Taslak kaydedildi");
    } catch {
      /* depolama kapali olabilir */
    }
  }, 400);
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* yoksay */
  }
}

function setValue(name, value) {
  state.answers[name] = value;
  delete state.serverErrors[name];
  saveDraft();
}

function fieldId(name) {
  return `f_${name}`;
}

function renderField(field) {
  const labelId = `${fieldId(field.name)}_label`;
  const errorId = `${fieldId(field.name)}_error`;
  const value = state.answers[field.name] ?? "";
  const serverError = state.serverErrors[field.name];

  if (field.type === "radio") {
    const group = document.createElement("fieldset");
    group.className = "field radio-field";
    group.dataset.field = field.name;

    const label = document.createElement("legend");
    label.className = "field-label";
    label.id = labelId;
    label.textContent = field.label;
    if (field.required) label.append(requiredMark());

    const options = document.createElement("div");
    options.className = "radio-group";

    for (const option of field.options ?? []) {
      const optLabel = document.createElement("label");
      optLabel.className = "radio-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = field.name;
      input.value = option;
      input.checked = value === option;
      input.addEventListener("change", () => {
        setValue(field.name, option);
        clearFieldError(group);
      });

      const text = document.createElement("span");
      text.textContent = option;

      optLabel.append(input, text);
      options.append(optLabel);
    }

    group.append(label, options);
    group.append(errorNode(field, errorId, serverError));
    return group;
  }

  const label = document.createElement("label");
  label.className = "field-label";
  label.id = labelId;
  label.htmlFor = fieldId(field.name);
  label.textContent = field.label;
  if (field.required) label.append(requiredMark());

  let input;
  if (field.type === "textarea") {
    input = document.createElement("textarea");
    input.rows = 4;
  } else {
    input = document.createElement("input");
    input.type = field.type === "date" ? "date" : field.type === "time" ? "time" : "text";
    if (field.type === "text") input.autocomplete = "off";
  }

  input.id = fieldId(field.name);
  input.name = field.name;
  input.value = value;
  input.setAttribute("aria-labelledby", labelId);
  if (serverError) {
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", errorId);
  }

  const wrap = document.createElement("div");
  wrap.className = "field";
  wrap.dataset.field = field.name;

  input.addEventListener("input", () => {
    setValue(field.name, input.value);
    clearFieldError(wrap);
  });

  wrap.append(label, input, errorNode(field, errorId, serverError));
  return wrap;
}

function requiredMark() {
  const mark = document.createElement("span");
  mark.className = "req";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = " *";
  return mark;
}

function errorNode(field, id, message) {
  const span = document.createElement("span");
  span.className = "error-text";
  span.id = id;
  span.hidden = !message;
  span.textContent = message || "";
  return span;
}

function clearFieldError(container) {
  const input = container.querySelector("input, textarea");
  const error = container.querySelector(".error-text");
  if (input) {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
  }
  if (error) {
    error.hidden = true;
    error.textContent = "";
  }
}

function renderSection() {
  const list = sections();
  const section = list[state.index];
  if (!section) return;

  el.host.replaceChildren();

  const band = document.createElement("div");
  band.className = "section-band";

  const h2 = document.createElement("h2");
  h2.textContent = section.title;
  band.append(h2);

  if (section.description) {
    const p = document.createElement("p");
    p.className = "section-desc";
    p.textContent = section.description;
    band.append(p);
  }

  el.host.append(band);

  for (const field of section.fields) {
    el.host.append(renderField(field));
  }

  const total = list.length;
  const pct = Math.round(((state.index + 1) / total) * 100);  el.progressBar.style.width = `${pct}%`;
  el.progress.setAttribute("aria-valuenow", String(pct));
  el.progressText.textContent = `Bölüm ${state.index + 1} / ${total}`;
  el.back.hidden = state.index === 0;
  el.next.textContent = state.index === total - 1 ? "Gönder" : "Sonraki";

  const head = el.view.querySelector(".card-head");
  if (head) head.hidden = state.index !== 0;

  window.scrollTo({ top: 0, behavior: "smooth" });
  document.title = `${section.title} · Görüşme Formu`;
}

function validateSection() {
  const section = sections()[state.index];
  let firstInvalid = null;

  for (const field of section.fields) {
    const container = el.host.querySelector(`[data-field="${field.name}"]`);
    if (!container) continue;

    const raw = state.answers[field.name] ?? "";
    const value = String(raw).trim();
    let message = "";

    if (field.required && value === "") {
      message = "Bu soru zorunludur.";
    } else if (field.type === "radio" && value !== "" && !(field.options ?? []).includes(value)) {
      message = "Geçersiz seçenek.";
    } else if (field.type === "date" && value !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      message = "Geçerli bir tarih girin.";
    } else if (field.type === "time" && value !== "" && !/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
      message = "Geçerli bir saat girin.";
    }

    const error = container.querySelector(".error-text");
    const input = container.querySelector("input, textarea");

    if (message) {
      if (error) {
        error.textContent = message;
        error.hidden = false;
      }
      if (input) {
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", error?.id ?? "");
      }
      if (!firstInvalid) firstInvalid = container;
    } else {
      clearFieldError(container);
    }
  }

  if (firstInvalid) {
    const focusable = firstInvalid.querySelector("input, textarea");
    firstInvalid.scrollIntoView({ block: "center", behavior: "smooth" });
    focusable?.focus({ preventScroll: true });
    return false;
  }
  return true;
}

function goTo(index) {
  state.index = Math.max(0, Math.min(index, sections().length - 1));
  renderSection();
  saveDraft();
}

async function submit() {
  if (state.busy) return;
  state.busy = true;
  el.next.disabled = true;
  el.next.textContent = "Gönderiliyor…";

  try {
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state.answers),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok) {
      if (data?.errors && typeof data.errors === "object") {
        state.serverErrors = data.errors;
        const list = sections();
        const firstIndex = list.findIndex((s) =>
          s.fields.some((f) => Object.hasOwn(data.errors, f.name)),
        );
        if (firstIndex >= 0) {
          state.index = firstIndex;
          renderSection();
        }
        showNotice("Lütfen işaretli alanları kontrol edin");
      } else {
        showNotice(data?.error || "Gönderilemedi, lütfen tekrar deneyin");
      }
      return;
    }

    clearDraft();
    state.answers = {};
    state.index = 0;
    show(el.done);
    window.scrollTo({ top: 0, behavior: "smooth" });
    el.done.querySelector("h2")?.focus?.();
  } catch {
    showNotice("Bağlantı hatası, lütfen tekrar deneyin");
  } finally {
    state.busy = false;
    el.next.disabled = false;
    el.next.textContent =
      state.index === sections().length - 1 ? "Gönder" : "Sonraki";
  }
}

el.form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (state.busy) return;

  if (!validateSection()) return;

  if (state.index < sections().length - 1) {
    goTo(state.index + 1);
  } else {
    submit();
  }
});

el.back.addEventListener("click", () => {
  if (state.index > 0) goTo(state.index - 1);
});

el.form.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.shiftKey) return;
  const tag = event.target.tagName;
  if (tag === "TEXTAREA" || tag === "BUTTON") return;
  event.preventDefault();
  el.form.requestSubmit();
});

el.again.addEventListener("click", () => {
  state.answers = {};
  state.serverErrors = {};
  state.index = 0;
  el.form.reset();
  show(el.view);
  renderSection();
});

el.retry.addEventListener("click", () => init());

async function init() {
  show(el.loading);
  el.error.hidden = true;

  try {
    const response = await fetch("/api/form", { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data?.form?.sections?.length) throw new Error("Form tanımı boş.");
    state.form = data.form;
  } catch (err) {
    el.errorMessage.textContent =
      "Form tanımı sunucudan alınamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.";
    show(el.error);
    console.error(err);
    return;
  }

  el.title.textContent = state.form.title;
  el.desc.textContent = state.form.description;

  const draft = loadDraft();
  if (draft) {
    state.answers = draft.answers;
    state.index = Math.min(Number(draft.index) || 0, state.form.sections.length - 1);
  }

  show(el.view);
  renderSection();

  if (draft) showNotice("Taslağınız geri yüklendi");
}

init();
