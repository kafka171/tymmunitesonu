const KEY_STORAGE = "arapca-gorusme-admin-key";
const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 350;

const el = {
  login: document.getElementById("login-view"),
  loginForm: document.getElementById("login-form"),
  key: document.getElementById("admin-key"),
  loginError: document.getElementById("login-error"),
  panel: document.getElementById("panel-view"),
  panelSub: document.getElementById("panel-sub"),
  refresh: document.getElementById("btn-refresh"),
  csv: document.getElementById("btn-csv"),
  xlsx: document.getElementById("btn-xlsx"),
  tabResponses: document.getElementById("tab-responses"),
  tabStats: document.getElementById("tab-stats"),
  responsesView: document.getElementById("responses-view"),
  statsView: document.getElementById("stats-view"),
  filterDers: document.getElementById("filter-ders"),
  filterUnite: document.getElementById("filter-unite"),
  filterFrom: document.getElementById("filter-from"),
  filterTo: document.getElementById("filter-to"),
  search: document.getElementById("search"),
  clearFilters: document.getElementById("btn-clear-filters"),
  rows: document.getElementById("rows"),
  empty: document.getElementById("empty"),
  pagination: document.getElementById("pagination"),
  prev: document.getElementById("btn-prev"),
  next: document.getElementById("btn-next"),
  pageInfo: document.getElementById("page-info"),
  kpis: document.getElementById("kpis"),
  chartDers: document.getElementById("chart-ders"),
  chartUnite: document.getElementById("chart-unite"),
  chartDay: document.getElementById("chart-day"),
  chartOkul: document.getElementById("chart-okul"),
  errorView: document.getElementById("admin-error"),
  errorText: document.getElementById("admin-error-text"),
  retry: document.getElementById("btn-retry"),
  dialog: document.getElementById("detail-dialog"),
  detailTitle: document.getElementById("detail-title"),
  detailBody: document.getElementById("detail-body"),
  closeDialog: document.getElementById("btn-close-dialog"),
  closeDialog2: document.getElementById("btn-close-dialog-2"),
};

const state = {
  key: "",
  form: null,
  fields: [],
  filters: { ders: "", unite: "", from: "", to: "", q: "" },
  total: 0,
  offset: 0,
  rows: [],
  stats: null,
  activeTab: "responses",
};

let searchTimer = null;

function show(view) {
  for (const node of [el.login, el.panel, el.errorView]) {
    if (node) node.hidden = node !== view;
  }
}

function getKey() {
  try {
    return sessionStorage.getItem(KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

function setKey(key) {
  try {
    if (key) sessionStorage.setItem(KEY_STORAGE, key);
    else sessionStorage.removeItem(KEY_STORAGE);
  } catch {
    /* yoksay */
  }
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: {
      accept: "application/json",
      "x-admin-key": state.key,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const err = new Error(data?.error || `HTTP ${response.status}`);
    err.status = response.status;
    err.code = response.status;
    throw err;
  }
  return data;
}

/* ---------- Yanitlar: filtre + sayfalama ---------- */

function filterQuery(extra = {}) {
  const params = new URLSearchParams();
  const f = state.filters;
  if (f.ders) params.set("ders", f.ders);
  if (f.unite) params.set("unite", f.unite);
  if (f.from) params.set("from", f.from);
  if (f.to) params.set("to", f.to);
  if (f.q) params.set("q", f.q);
  for (const [k, v] of Object.entries(extra)) params.set(k, String(v));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function loadResponses() {
  const list = await api(
    `/api/responses${filterQuery({ limit: PAGE_SIZE, offset: state.offset })}`,
  );
  state.rows = list.rows || [];
  state.total = list.total ?? 0;
  renderRows();
}

function hasFilters() {
  return Object.values(state.filters).some(Boolean);
}

function renderRows() {
  el.rows.replaceChildren();

  const from = state.total === 0 ? 0 : state.offset + 1;
  const to = state.offset + state.rows.length;

  el.panelSub.textContent = hasFilters()
    ? `Filtrelenmiş: ${state.total} yanıt`
    : `${state.total} yanıt`;

  el.empty.hidden = state.rows.length > 0;
  el.empty.textContent =
    state.total === 0
      ? hasFilters()
        ? "Filtrelere uyan yanıt yok."
        : "Henüz yanıt yok."
      : "";

  for (const row of state.rows) {
    const tr = document.createElement("tr");

    const cells = [
      row.id,
      formatDate(row.created_at),
      row.ders_adi,
      row.unite,
      row.okul_adi,
      row.ogretmen_kodu,
    ];

    cells.forEach((value, index) => {
      const td = document.createElement("td");
      td.textContent = value === "" || value === null || value === undefined ? "—" : String(value);
      if (index === 0) td.className = "num";
      tr.append(td);
    });

    const actions = document.createElement("td");
    actions.className = "row-actions";

    const detail = document.createElement("button");
    detail.type = "button";
    detail.className = "link-btn";
    detail.textContent = "Detay";
    detail.addEventListener("click", () => openDetail(row));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "link-btn danger";
    remove.textContent = "Sil";
    remove.addEventListener("click", () => removeRow(row));

    actions.append(detail, remove);
    tr.append(actions);
    el.rows.append(tr);
  }

  const pages = Math.max(1, Math.ceil(state.total / PAGE_SIZE));
  const page = Math.floor(state.offset / PAGE_SIZE) + 1;
  el.pagination.hidden = state.total <= PAGE_SIZE;
  el.prev.disabled = state.offset <= 0;
  el.next.disabled = to >= state.total;
  el.pageInfo.textContent = `Sayfa ${page} / ${pages} · ${from}–${to} arası`;
}

function onFilterChange() {
  state.offset = 0;
  loadResponses().catch(handleLoadError);
}

function handleLoadError(err) {
  window.alert(err.message || "Yanıtlar yüklenemedi.");
}

/* ---------- Istatistikler ---------- */

async function loadStats() {
  const stats = await api("/api/stats");
  state.stats = stats;
  renderStats();
}

function renderStats() {
  const s = state.stats;
  if (!s) return;

  const kpis = [
    { label: "Toplam yanıt", value: s.total },
    { label: "Bugün", value: s.bugun },
    { label: "Son 7 gün", value: s.son7gun },
    { label: "Farklı okul", value: s.okulSayisi },
    { label: "Farklı öğretmen", value: s.ogretmenSayisi },
  ];

  el.kpis.replaceChildren();
  for (const kpi of kpis) {
    const card = document.createElement("div");
    card.className = "kpi";

    const value = document.createElement("strong");
    value.textContent = String(kpi.value);

    const label = document.createElement("span");
    label.textContent = kpi.label;

    card.append(value, label);
    el.kpis.append(card);
  }

  renderBars(el.chartDers, s.byDers);
  renderBars(el.chartUnite, s.byUnite);
  renderBars(el.chartOkul, s.topOkul);
  renderDayBars(el.chartDay, s.byDay);
}

function renderBars(container, items) {
  container.replaceChildren();
  if (!items || items.length === 0) {
    container.append(emptyNote("Veri yok"));
    return;
  }

  const max = Math.max(...items.map((i) => i.count), 1);
  for (const item of items) {
    const bar = document.createElement("div");
    bar.className = "bar-row";

    const label = document.createElement("span");
    label.className = "bar-label";
    label.textContent = item.name || "—";

    const track = document.createElement("span");
    track.className = "bar-track";

    const fill = document.createElement("span");
    fill.className = "bar-fill";
    fill.style.width = `${Math.round((item.count / max) * 100)}%`;

    const value = document.createElement("span");
    value.className = "bar-value";
    value.textContent = String(item.count);

    track.append(fill);
    bar.append(label, track, value);
    container.append(bar);
  }
}

function renderDayBars(container, items) {
  container.replaceChildren();
  if (!items || items.length === 0) {
    container.append(emptyNote("Veri yok"));
    return;
  }

  const recent = items.slice(-30);
  const max = Math.max(...recent.map((i) => i.count), 1);

  const wrap = document.createElement("div");
  wrap.className = "day-cols";

  for (const item of recent) {
    const col = document.createElement("div");
    col.className = "day-col";
    col.title = `${item.day}: ${item.count} yanıt`;

    const bar = document.createElement("span");
    bar.className = "day-bar";
    const pct = Math.max(4, Math.round((item.count / max) * 100));
    bar.style.height = `${pct}%`;

    const label = document.createElement("span");
    label.className = "day-label";
    label.textContent = item.day.slice(5);

    col.append(bar, label);
    wrap.append(col);
  }

  container.append(wrap);
}

function emptyNote(text) {
  const p = document.createElement("p");
  p.className = "empty-note";
  p.textContent = text;
  return p;
}

/* ---------- Gorunum sekmeleri ---------- */

function setTab(tab) {
  state.activeTab = tab;
  const isResponses = tab === "responses";

  el.tabResponses.classList.toggle("active", isResponses);
  el.tabResponses.setAttribute("aria-selected", String(isResponses));
  el.tabStats.classList.toggle("active", !isResponses);
  el.tabStats.setAttribute("aria-selected", String(!isResponses));

  el.responsesView.hidden = !isResponses;
  el.statsView.hidden = isResponses;

  if (!isResponses && !state.stats) {
    loadStats().catch(handleLoadError);
  }
}

/* ---------- Detay / silme ---------- */

function openDetail(row) {
  el.detailTitle.textContent = `Yanıt #${row.id}`;
  el.detailBody.replaceChildren();

  const meta = document.createElement("p");
  meta.className = "detail-meta";
  meta.textContent = `Kayıt: ${formatDate(row.created_at)}`;
  el.detailBody.append(meta);

  for (const section of state.form.sections) {
    const block = document.createElement("section");
    block.className = "detail-section";

    const h3 = document.createElement("h3");
    h3.textContent = section.title;
    block.append(h3);

    for (const field of section.fields) {
      const item = document.createElement("div");
      item.className = "detail-item";

      const label = document.createElement("div");
      label.className = "detail-label";
      label.textContent = field.label;

      const value = document.createElement("div");
      value.className = "detail-value";
      const text = String(row[field.name] ?? "").trim();
      value.textContent = text || "—";
      if (!text) value.classList.add("muted");

      item.append(label, value);
      block.append(item);
    }

    el.detailBody.append(block);
  }

  if (typeof el.dialog.showModal === "function") {
    el.dialog.showModal();
  } else {
    el.dialog.setAttribute("open", "");
  }
}

function closeDetail() {
  if (typeof el.dialog.close === "function") el.dialog.close();
  else el.dialog.removeAttribute("open");
}

async function removeRow(row) {
  const label = [row.okul_adi, row.ogretmen_kodu].filter(Boolean).join(" · ");
  const ok = window.confirm(
    `#${row.id} numaralı yanıt silinsin mi?${label ? `\n\n${label}` : ""}\n\nBu işlem geri alınamaz.`,
  );
  if (!ok) return;

  try {
    await api(`/api/responses?id=${row.id}`, { method: "DELETE" });
    state.rows = state.rows.filter((r) => r.id !== row.id);
    state.stats = null;
    await loadResponses();
  } catch (err) {
    window.alert(err.message || "Kayıt silinemedi.");
  }
}

/* ---------- Indirme ---------- */

function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function downloadExport(format, button) {
  const old = button.textContent;
  button.disabled = true;
  button.textContent = "Hazırlanıyor…";

  try {
    const response = await fetch(`/api/export${filterQuery({ format })}`, {
      headers: { "x-admin-key": state.key },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text.slice(0, 200) || "Dosya oluşturulamadı.");
    }

    const blob = await response.blob();
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(blob, `gorusme-formu-yanitlari-${stamp}.${format}`);
  } catch (err) {
    window.alert(err.message || "İndirme başarısız.");
  } finally {
    button.disabled = false;
    button.textContent = old;
  }
}

/* ---------- Yardimcilar ---------- */

function formatDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fillFilterSelect(select, options, placeholder) {
  select.replaceChildren();

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = placeholder;
  select.append(defaultOption);

  for (const option of options) {
    const opt = document.createElement("option");
    opt.value = option;
    opt.textContent = option;
    select.append(opt);
  }
}

/* ---------- Giris ---------- */

async function login(key) {
  state.key = key;
  el.loginError.hidden = true;

  try {
    const [formData, list] = await Promise.all([
      api("/api/form"),
      api(`/api/responses${filterQuery({ limit: PAGE_SIZE, offset: 0 })}`),
    ]);

    state.form = formData.form;
    state.fields = state.form.sections.flatMap((s) => s.fields);
    state.rows = list.rows || [];
    state.total = list.total ?? 0;

    const dersField = state.form.sections[0]?.fields.find((f) => f.name === "ders_adi");
    const uniteField = state.form.sections[0]?.fields.find((f) => f.name === "unite");
    fillFilterSelect(el.filterDers, dersField?.options ?? [], "Tüm dersler");
    fillFilterSelect(el.filterUnite, uniteField?.options ?? [], "Tüm üniteler");

    setKey(key);
    show(el.panel);
    setTab("responses");
    renderRows();
  } catch (err) {
    const status = err.status || err.code;

    if (status === 401 || status === 503 || status === 500) {
      setKey("");
      state.key = "";
      show(el.login);
      el.loginError.textContent =
        status === 401
          ? "Anahtar kabul edilmedi."
          : err.message || "Sunucu yapılandırma hatası.";
      el.loginError.hidden = false;

      el.key.focus();
      el.key.select();
      return;
    }

    el.errorText.textContent = "Yanıtlar yüklenemedi. Lütfen tekrar deneyin.";
    show(el.errorView);
    console.error(err);
  }
}

/* ---------- Olaylar ---------- */

el.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const key = el.key.value.trim();
  if (!key) {
    el.loginError.textContent = "Lütfen yönetici anahtarını girin.";
    el.loginError.hidden = false;
    return;
  }
  login(key);
});

el.refresh.addEventListener("click", () => {
  state.stats = null;
  if (state.activeTab === "responses") loadResponses().catch(handleLoadError);
  else loadStats().catch(handleLoadError);
});

el.csv.addEventListener("click", () => downloadExport("csv", el.csv));
el.xlsx.addEventListener("click", () => downloadExport("xlsx", el.xlsx));

el.tabResponses.addEventListener("click", () => setTab("responses"));
el.tabStats.addEventListener("click", () => setTab("stats"));

el.filterDers.addEventListener("change", () => {
  state.filters.ders = el.filterDers.value;
  onFilterChange();
});

el.filterUnite.addEventListener("change", () => {
  state.filters.unite = el.filterUnite.value;
  onFilterChange();
});

el.filterFrom.addEventListener("change", () => {
  state.filters.from = el.filterFrom.value;
  onFilterChange();
});

el.filterTo.addEventListener("change", () => {
  state.filters.to = el.filterTo.value;
  onFilterChange();
});

el.search.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.filters.q = el.search.value.trim();
    onFilterChange();
  }, SEARCH_DEBOUNCE_MS);
});

el.clearFilters.addEventListener("click", () => {
  state.filters = { ders: "", unite: "", from: "", to: "", q: "" };
  el.filterDers.value = "";
  el.filterUnite.value = "";
  el.filterFrom.value = "";
  el.filterTo.value = "";
  el.search.value = "";
  onFilterChange();
});

el.prev.addEventListener("click", () => {
  state.offset = Math.max(0, state.offset - PAGE_SIZE);
  loadResponses().catch(handleLoadError);
});

el.next.addEventListener("click", () => {
  if (state.offset + PAGE_SIZE < state.total) {
    state.offset += PAGE_SIZE;
    loadResponses().catch(handleLoadError);
  }
});

el.retry.addEventListener("click", () => {
  if (state.key) login(state.key);
  else show(el.login);
});

el.closeDialog.addEventListener("click", closeDetail);
el.closeDialog2.addEventListener("click", closeDetail);

el.dialog.addEventListener("click", (event) => {
  if (event.target === el.dialog) closeDetail();
});

/* ---------- Baslangic ---------- */

const savedKey = getKey();
if (savedKey) {
  login(savedKey);
} else {
  show(el.login);
  el.key.focus();
}
