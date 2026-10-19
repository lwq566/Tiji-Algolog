(() => {
  'use strict';

  /* ------------------------------------------------------------------------ */
  /*  Tiny helpers                                                            */
  /* ------------------------------------------------------------------------ */

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const pad2 = (value) => String(value).padStart(2, '0');

  const escapeHtml = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (char) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[char],
    );

  const uid = (prefix) =>
    `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

  const icon = (name, className = '') => {
    const body = ICONS[name] || ICONS.info;
    return `<svg class="ui-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  };

  const ICONS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15.3 15.3 0 0 1 0 18a15.3 15.3 0 0 1 0-18Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 9.5h18"/><path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2"/>',
    flame: '<path d="M12.2 21c3.9 0 6.8-2.5 6.8-6.4c0-2.6-1.4-4.9-3.3-6.9c-.7-.7-1.4-1.5-2.1-2.5c-.3-.5-1-.4-1.2.1c-.5 1.4-1.2 2.2-2.2 3.2C9 9.8 8 11 8 13.1c0 .8.2 1.5.6 2.1c-.6-.2-1.1-.7-1.4-1.4c-.2-.5-.9-.6-1.2-.1c-.5.7-.8 1.6-.8 2.6C5.2 19 8 21 12.2 21Z"/><path d="M12 17.5c1.2 0 2-.8 2-1.9c0-.8-.4-1.4-1.2-2.2c-.4-.4-.8-.8-1.1-1.4c-.4.6-.8 1-1.2 1.5c-.6.7-.9 1.3-.9 2.1c0 1.1.9 1.9 2.4 1.9Z"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.7"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
    check: '<path d="m5 12.5 4.3 4.3L19 7"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12.2 2.7 2.8L16.3 9"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7.8 18.2 3 20l1.8-4.8Z"/>',
    trash: '<path d="M4 6h16M9 6V3.5h6V6M6.5 6l.8 14.5h9.4L17.5 6"/><path d="M10 10v7M14 10v7"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4 10.5 13.5"/><path d="M19 14.5V20H4V5h5.5"/>',
    'chevron-left': '<path d="m14.5 6-6 6 6 6"/>',
    'chevron-right': '<path d="m9.5 6 6 6-6 6"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.7"/><path d="m16 16 4.5 4.5"/>',
    download: '<path d="M12 3v12M7.5 10.5 12 15l4.5-4.5"/><path d="M4.5 19.5h15"/>',
    upload: '<path d="M12 16V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4.5 19.5h15"/>',
    folder: '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h4l2 2.5h7A2.5 2.5 0 0 1 21 10v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5Z"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    alert: '<path d="M10.3 4.1 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.1a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4.5"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none"/>',
    sparkles: '<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/><path d="m5 14 .6 1.9L7.5 16.5l-1.9.6L5 19l-.6-1.9L2.5 16.5l1.9-.6Z"/>',
    award: '<circle cx="12" cy="9" r="5.5"/><path d="m8.4 13.4-1 7.1 4.6-2.4 4.6 2.4-1-7.1"/>',
    'arrow-right': '<path d="M4 12h15M14 7l5 5-5 5"/>',
    inbox: '<path d="M4 5.5h16v13H4z"/><path d="M4 13h4.5l1.5 2h4l1.5-2H20"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.3 2"/>',
    tag: '<path d="M3 11V4h7l10 10-7 7L3 11Z"/><circle cx="7.6" cy="7.6" r="1.2"/>',
    book: '<path d="M4 4.5h6a3 3 0 0 1 3 3V20a3 3 0 0 0-3-3H4Z"/><path d="M20 4.5h-4a3 3 0 0 0-3 3V20a3 3 0 0 1 3-3h4Z"/>',
    database: '<ellipse cx="12" cy="5.5" rx="7.5" ry="3"/><path d="M4.5 5.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6"/><path d="M4.5 11.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6"/>',
  };

  const SITE_COLORS = [
    '#1F7A5C',
    '#2F63B6',
    '#B8742B',
    '#7452B8',
    '#B94343',
    '#0E7490',
    '#596A5F',
    '#B08A2E',
  ];

  const QUICK_TAGS = [
    '动态规划',
    '贪心',
    '二分',
    '图论',
    '数据结构',
    '字符串',
    '数学',
    '搜索',
    '模拟',
    '构造',
  ];

  const DIFFICULTY_OPTIONS = [
    '入门',
    '普及-',
    '普及/提高-',
    '普及+/提高',
    '提高+/省选-',
    '省选/NOI-',
    'NOI/NOI+/CTSC',
    '未评定',
    ...Array.from({ length: 28 }, (_, index) => String(800 + index * 100)),
  ];

  /* ------------------------------------------------------------------------ */
  /*  Dates                                                                    */
  /* ------------------------------------------------------------------------ */

  const dateKey = (date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

  const parseDateKey = (key) => {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  };

  const todayKey = () => dateKey(new Date());

  const addDays = (key, amount) => {
    const date = parseDateKey(key);
    date.setDate(date.getDate() + amount);
    return dateKey(date);
  };

  const daysBetween = (fromKey, toKey) =>
    Math.round((parseDateKey(toKey) - parseDateKey(fromKey)) / 86400000);

  const isValidDateKey = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const weekdayName = (key) => {
    const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return names[parseDateKey(key).getDay()];
  };

  const formatDateLong = (key) => {
    const date = parseDateKey(key);
    return `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  };

  const formatDateFull = (key) => {
    const date = parseDateKey(key);
    return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  };

  const formatMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split('-').map(Number);
    return `${year} 年 ${month} 月`;
  };

  const formatMonthOption = (monthKey) => {
    const [year, month] = monthKey.split('-').map(Number);
    return `${year} 年 ${month} 月`;
  };

  const relativeDate = (key) => {
    const today = todayKey();
    if (key === today) return '今天';
    if (key === addDays(today, -1)) return '昨天';
    return formatDateLong(key);
  };

  /* ------------------------------------------------------------------------ */
  /*  App state                                                                */
  /* ------------------------------------------------------------------------ */

  const fallbackApi = {
    async loadData() {
      try {
        const raw = localStorage.getItem('algolog-data');
        return { data: raw ? JSON.parse(raw) : { version: 1, sites: [], records: [] } };
      } catch {
        return { data: { version: 1, sites: [], records: [] } };
      }
    },
    async saveData(data) {
      localStorage.setItem('algolog-data', JSON.stringify(data));
      return { ok: true, savedAt: new Date().toISOString() };
    },
    async exportData() {
      return { canceled: false, error: '浏览器预览模式不支持文件导出，请使用桌面应用。' };
    },
    async importData() {
      return { canceled: false, error: '浏览器预览模式不支持文件导入，请使用桌面应用。' };
    },
    async openExternal(url) {
      window.open(url, '_blank', 'noopener');
      return { ok: true };
    },
    async revealData() {
      return { ok: false, error: '浏览器预览模式没有数据目录。' };
    },
    async getInfo() {
      return { version: '1.0.0', dataPath: '浏览器 localStorage' };
    },
  };

  const api = window.algolog || fallbackApi;

  const state = {
    data: { version: 1, sites: [], records: [] },
    view: 'dashboard',
    monthCursor: todayKey().slice(0, 7),
    selectedDate: todayKey(),
    heatYear: new Date().getFullYear(),
    filters: { search: '', siteId: 'all', month: 'all', date: null },
    info: { version: '1.0.0', dataPath: '' },
    pendingRecordDate: null,
    siteModalPending: null,
    confirmCallback: null,
  };

  let saveChain = Promise.resolve();
  let modalPreviousFocus = null;

  /* ------------------------------------------------------------------------ */
  /*  Data helpers                                                             */
  /* ------------------------------------------------------------------------ */

  const safeColor = (value) =>
    typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : SITE_COLORS[0];

  function normalizeClientData(raw) {
    const data = raw && typeof raw === 'object' ? raw : {};
    const sites = [];
    const siteIds = new Set();

    for (const item of Array.isArray(data.sites) ? data.sites : []) {
      if (!item || typeof item !== 'object') continue;
      const id = String(item.id || '').trim();
      const name = String(item.name || '').trim();
      if (!id || !name || siteIds.has(id)) continue;
      siteIds.add(id);
      sites.push({
        id,
        name,
        url: typeof item.url === 'string' ? item.url : '',
        color: safeColor(item.color),
        createdAt: item.createdAt || new Date().toISOString(),
      });
    }

    const records = [];
    const recordIds = new Set();
    for (const item of Array.isArray(data.records) ? data.records : []) {
      if (!item || typeof item !== 'object') continue;
      const id = String(item.id || '').trim();
      const siteId = String(item.siteId || '').trim();
      const date = String(item.date || '');
      const problemTitle = String(item.problemTitle || '').trim();
      const problemNumber = String(item.problemNumber || '').trim();
      if (!id || !siteId || !isValidDateKey(date) || !problemTitle || !problemNumber) continue;
      if (recordIds.has(id)) continue;
      recordIds.add(id);
      records.push({
        id,
        date,
        siteId,
        problemNumber,
        problemTitle,
        difficulty: String(item.difficulty || '').trim(),
        tags: Array.isArray(item.tags)
          ? [...new Set(item.tags.map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 12)
          : [],
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
      });
    }

    return { version: 1, sites, records };
  }

  const siteById = (id) => state.data.sites.find((site) => site.id === id) || null;

  const siteName = (id) => siteById(id)?.name || '未知题站';

  const countByDate = () => {
    const counts = {};
    for (const record of state.data.records) {
      counts[record.date] = (counts[record.date] || 0) + 1;
    }
    return counts;
  };

  const heatLevel = (count) => {
    if (!count) return 0;
    if (count <= 2) return 1;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
  };

  function computeStats() {
    const records = state.data.records;
    const counts = countByDate();
    const days = Object.keys(counts).sort();
    const today = todayKey();
    const yesterday = addDays(today, -1);

    let current = 0;
    let cursor = counts[today] ? today : counts[yesterday] ? yesterday : null;
    while (cursor && counts[cursor]) {
      current += 1;
      cursor = addDays(cursor, -1);
    }

    let longest = 0;
    let run = 0;
    let previous = null;
    for (const day of days) {
      run = previous && addDays(previous, 1) === day ? run + 1 : 1;
      longest = Math.max(longest, run);
      previous = day;
    }

    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 12);
    const previousMonthPrefix = `${previousMonthDate.getFullYear()}-${pad2(
      previousMonthDate.getMonth() + 1,
    )}`;

    const thisMonth = records.filter((record) => record.date.startsWith(monthPrefix)).length;
    const previousMonth = records.filter((record) =>
      record.date.startsWith(previousMonthPrefix),
    ).length;

    return {
      total: records.length,
      activeDays: days.length,
      current,
      longest,
      thisMonth,
      previousMonth,
      todayCount: counts[today] || 0,
      todayRecords: records
        .filter((record) => record.date === today)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
      counts,
    };
  }

  function parseTags(value) {
    return [
      ...new Set(
        String(value || '')
          .split(/[,，;；\s]+/)
          .map((tag) => tag.trim().replace(/^#+/, '').slice(0, 24))
          .filter(Boolean),
      ),
    ].slice(0, 8);
  }

  function difficultyClass(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const numeric = Number(raw);
    if (Number.isFinite(numeric) && numeric >= 500 && numeric <= 4000) {
      if (numeric <= 1200) return 'diff-easy';
      if (numeric <= 1800) return 'diff-mid';
      if (numeric <= 2400) return 'diff-hard';
      return 'diff-extreme';
    }
    if (/NOI|CTSC|省选/i.test(raw)) return 'diff-extreme';
    if (/提高\+|提高\s*\/\s*省选/.test(raw)) return 'diff-hard';
    if (/提高/.test(raw)) return 'diff-mid';
    if (/入门|普及/.test(raw)) return 'diff-easy';
    return '';
  }

  function normalizeUrlInput(raw) {
    let value = String(raw || '').trim();
    if (!value) throw new Error('请填写题站网址。');
    if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('只支持 http 或 https 网址。');
    }
    if (!url.hostname || (!url.hostname.includes('.') && url.hostname !== 'localhost')) {
      throw new Error('请输入有效的网址，例如 codeforces.com。');
    }
    return url.href;
  }

  function displayHost(url) {
    try {
      return new URL(url).hostname.replace(/^www\./i, '');
    } catch {
      return url || '未设置网址';
    }
  }

  function getFilteredRecords() {
    const { search, siteId, month, date } = state.filters;
    const keyword = search.trim().toLowerCase();
    let records = [...state.data.records];

    if (date) {
      records = records.filter((record) => record.date === date);
    } else if (month !== 'all') {
      records = records.filter((record) => record.date.startsWith(month));
    }

    if (siteId !== 'all') {
      records = records.filter((record) => record.siteId === siteId);
    }

    if (keyword) {
      records = records.filter((record) => {
        const haystack = [
          record.problemNumber,
          record.problemTitle,
          record.difficulty,
          siteName(record.siteId),
          ...(record.tags || []),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(keyword);
      });
    }

    return records.sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      if (byDate !== 0) return byDate;
      return String(b.createdAt).localeCompare(String(a.createdAt));
    });
  }

  const filtersActive = () =>
    Boolean(
      state.filters.search.trim() ||
        state.filters.siteId !== 'all' ||
        state.filters.month !== 'all' ||
        state.filters.date,
    );

  /* ------------------------------------------------------------------------ */
  /*  Chrome                                                                   */
  /* ------------------------------------------------------------------------ */

  const VIEW_META = {
    dashboard: {
      eyebrow: 'OVERVIEW',
      title: '总览',
      subtitle: '把每一次 AC，都变成看得见的积累。',
    },
    records: {
      eyebrow: 'PRACTICE LOG',
      title: '刷题记录',
      subtitle: '按日期回看每一道题，也可以随时补记。',
    },
    sites: {
      eyebrow: 'JUDGE SITES',
      title: '题站管理',
      subtitle: '先收录常用题站，记录题目时就能直接选择。',
    },
  };

  function setSavePill(mode, text) {
    const pill = $('#save-pill');
    if (!pill) return;
    pill.dataset.state = mode;
    $('#save-text').textContent = text;
  }

  function renderChrome() {
    const meta = VIEW_META[state.view];
    $('#page-eyebrow').textContent = meta.eyebrow;
    $('#page-title').textContent = meta.title;
    $('#page-subtitle').textContent = meta.subtitle;

    const today = todayKey();
    $('#today-label').textContent = `${formatDateFull(today)} · ${weekdayName(today)}`;

    $$('.nav-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.view === state.view);
    });

    $('#nav-record-count').textContent = state.data.records.length;
    $('#nav-site-count').textContent = state.data.sites.length;
    $('#app-version').textContent = state.info.version || '1.0.0';

    const stats = computeStats();
    $('#side-streak').textContent = `${stats.current} 天`;
    $('#side-streak-note').textContent = stats.todayCount
      ? `今天已打卡，连续 ${stats.current} 天。`
      : stats.current
        ? `已经连续 ${stats.current} 天，别断在今天。`
        : stats.longest
          ? `最长连续 ${stats.longest} 天。今天记一题，重新开始。`
          : '今天还没有记录，开个好头吧。';
    $('#side-streak-bar').style.width = `${Math.min(100, (stats.current / 7) * 100)}%`;
  }

  function hydrateIcons(root = document) {
    $$('[data-icon]', root).forEach((element) => {
      if (element.dataset.iconReady === '1') return;
      element.innerHTML = icon(element.dataset.icon);
      element.dataset.iconReady = '1';
    });
  }

  /* ------------------------------------------------------------------------ */
  /*  Rendering                                                                */
  /* ------------------------------------------------------------------------ */

  function render() {
    renderChrome();

    const sections = {
      dashboard: $('#view-dashboard'),
      records: $('#view-records'),
      sites: $('#view-sites'),
    };

    Object.entries(sections).forEach(([name, section]) => {
      section.hidden = name !== state.view;
    });

    if (state.view === 'dashboard') renderDashboard(sections.dashboard);
    else if (state.view === 'records') renderRecordsView(sections.records);
    else renderSitesView(sections.sites);

    hydrateIcons();
  }

  /* Dashboard --------------------------------------------------------------- */

  function renderDashboard(root) {
    const stats = computeStats();
    const counts = stats.counts;
    const monthGrid = buildMonthGrid(state.monthCursor);
    const selectedRecords = state.data.records
      .filter((record) => record.date === state.selectedDate)
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    const heatmap = buildHeatmap(state.heatYear, counts);
    const hasSites = state.data.sites.length > 0;

    const heroCta = hasSites
      ? `<button class="btn btn-hero btn-lg" type="button" data-action="add-record">${icon('plus')} 记录今天的题</button>`
      : `<button class="btn btn-hero btn-lg" type="button" data-action="add-site">${icon('plus')} 添加第一个题站</button>`;

    root.innerHTML = `
      <section class="hero">
        <div class="hero-copy">
          <p class="hero-kicker">${formatDateFull(todayKey())} · ${weekdayName(todayKey())}</p>
          <h2>${stats.total ? '今天，继续向前。' : '今天，写下一道题。'}</h2>
          <p class="hero-sub">${
            stats.total
              ? '每一道题都留在这张日历上。颜色深一点，离目标就近一点。'
              : '从添加第一个题站开始，把每一道题都留在这张日历上。'
          }</p>
        </div>
        <div class="hero-side">
          <div class="hero-count">
            <strong>${stats.todayCount}</strong>
            <span>今日已刷</span>
          </div>
          ${heroCta}
        </div>
      </section>

      <div class="stats-grid">
        ${statCard('list', '累计题数', stats.total, '题', `本月 +${stats.thisMonth}`)}
        ${statCard('calendar', '活跃天数', stats.activeDays, '天', `${state.data.sites.length} 个题站`)}
        ${statCard('flame', '当前连续', stats.current, '天', `最长 ${stats.longest} 天`, 'tone-gold')}
        ${statCard('sparkles', '本月题数', stats.thisMonth, '题', `上月 ${stats.previousMonth} 题`, 'tone-blue')}
      </div>

      <div class="dash-grid">
        <div class="dash-main">
          <section class="card heat-card">
            ${renderHeatmap(heatmap)}
          </section>
          <section class="card calendar-card">
            ${renderCalendar(monthGrid, counts, selectedRecords)}
          </section>
        </div>
        <div class="dash-side">
          ${renderTodayCard(stats)}
          ${renderSiteBars(stats.total)}
        </div>
      </div>
    `;
  }

  function statCard(iconName, label, value, unit, note, tone = '') {
    return `
      <article class="stat-card">
        <div class="stat-icon ${tone}" data-icon="${iconName}"></div>
        <div>
          <p class="stat-label">${label}</p>
          <p class="stat-value">${value}<small>${unit}</small></p>
          <p class="stat-note">${note}</p>
        </div>
      </article>
    `;
  }

  function buildMonthGrid(monthKey) {
    const [year, month] = monthKey.split('-').map(Number);
    const first = new Date(year, month - 1, 1, 12);
    const offset = (first.getDay() + 6) % 7;
    const cells = [];
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(year, month - 1, 1 - offset + index, 12);
      cells.push({
        key: dateKey(date),
        day: date.getDate(),
        inMonth: date.getMonth() === month - 1,
      });
    }
    return cells;
  }

  function renderCalendar(grid, counts, selectedRecords) {
    const [year, month] = state.monthCursor.split('-').map(Number);
    const today = todayKey();
    const selectedCount = selectedRecords.length;

    const dayCells = grid
      .map((cell) => {
        const count = counts[cell.key] || 0;
        const level = heatLevel(count);
        const classes = [
          'cal-day',
          `level-${level}`,
          cell.inMonth ? '' : 'is-out',
          cell.key === today ? 'is-today' : '',
          cell.key === state.selectedDate ? 'is-selected' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return `
          <button class="${classes}" type="button" data-action="calendar-day" data-date="${cell.key}" title="${formatDateFull(cell.key)} · ${count} 题" aria-label="${formatDateFull(cell.key)}，${count} 题">
            <span class="cal-num">${cell.day}</span>
            ${count ? `<span class="cal-count">${count} 题</span>` : '<span class="cal-count"></span>'}
          </button>
        `;
      })
      .join('');

    const detailItems = selectedRecords
      .slice(0, 4)
      .map(
        (record) => `
          <button class="day-item" type="button" data-action="edit-record" data-id="${escapeHtml(record.id)}">
            <span class="day-item-no">${escapeHtml(record.problemNumber)}</span>
            <span class="day-item-title">${escapeHtml(record.problemTitle)}</span>
            <span class="day-item-site">${escapeHtml(siteName(record.siteId))}</span>
          </button>
        `,
      )
      .join('');

    const detail =
      selectedCount > 0
        ? `
          <div class="day-list">${detailItems}</div>
          <div class="day-detail-head" style="margin-top: 7px; margin-bottom: 0;">
            <span class="card-sub">${selectedCount > 4 ? `还有 ${selectedCount - 4} 道题` : '当天记录'}</span>
            <button class="text-btn" type="button" data-action="view-day-records" data-date="${state.selectedDate}">
              查看全部 ${icon('arrow-right')}
            </button>
          </div>
        `
        : `<div class="day-empty"><span>这天还没有记录。</span><button class="text-btn" type="button" data-action="add-record" data-date="${state.selectedDate}">${icon('plus')} 补记一道</button></div>`;

    return `
      <div class="card-head">
        <div>
          <h3 class="card-title">刷题日历 <span class="card-pill">${year} 年 ${month} 月</span></h3>
          <p class="card-sub">颜色越深，说明当天刷得越多。</p>
        </div>
        <div class="card-tools">
          <button class="text-btn" type="button" data-action="month-today">今天</button>
          <button class="nav-arrow" type="button" data-action="month-prev" aria-label="上个月">${icon('chevron-left')}</button>
          <button class="nav-arrow" type="button" data-action="month-next" aria-label="下个月">${icon('chevron-right')}</button>
        </div>
      </div>
      <div class="calendar-weekdays">
        <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>
      </div>
      <div class="calendar-grid">${dayCells}</div>
      <div class="calendar-legend">
        <span>少</span>
        <i class="legend-cell level-0"></i>
        <i class="legend-cell level-1"></i>
        <i class="legend-cell level-2"></i>
        <i class="legend-cell level-3"></i>
        <i class="legend-cell level-4"></i>
        <span>多</span>
      </div>
      <div class="day-detail">
        <div class="day-detail-head">
          <div class="day-detail-title">${formatDateLong(state.selectedDate)} <span>${weekdayName(state.selectedDate)} · ${selectedCount} 题</span></div>
          <button class="text-btn" type="button" data-action="add-record" data-date="${state.selectedDate}">${icon('plus')} 再加一题</button>
        </div>
        ${detail}
      </div>
    `;
  }

  function buildHeatmap(year, counts) {
    const firstKey = `${year}-01-01`;
    const lastKey = `${year}-12-31`;
    const first = parseDateKey(firstKey);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(year, 0, 1 - offset, 12);
    const startKey = dateKey(start);
    const totalDays = daysBetween(startKey, lastKey) + 1;
    const columns = Math.ceil(totalDays / 7);
    const weeks = [];
    let cursor = new Date(start);

    for (let week = 0; week < columns; week += 1) {
      const days = [];
      for (let day = 0; day < 7; day += 1) {
        const key = dateKey(cursor);
        const inYear = cursor.getFullYear() === year;
        days.push({ key, inYear, count: inYear ? counts[key] || 0 : 0 });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(days);
    }

    const labels = [];
    let previousColumn = -3;
    for (let month = 0; month < 12; month += 1) {
      const monthStart = dateKey(new Date(year, month, 1, 12));
      let column = Math.floor(daysBetween(startKey, monthStart) / 7);
      if (column <= previousColumn) column = previousColumn + 1;
      labels.push({ column, text: `${month + 1} 月` });
      previousColumn = column;
    }

    const yearRecords = state.data.records.filter((record) =>
      record.date.startsWith(String(year)),
    );
    const active = new Set(yearRecords.map((record) => record.date)).size;

    return { year, columns, weeks, labels, total: yearRecords.length, active };
  }

  function renderHeatmap(heatmap) {
    const today = todayKey();
    const cells = heatmap.weeks
      .flat()
      .map((day) => {
        if (!day.inYear) return '<span class="heat-cell is-empty"></span>';
        const level = heatLevel(day.count);
        return `<button class="heat-cell level-${level}${day.key === today ? ' is-today' : ''}" type="button" data-action="open-date" data-date="${day.key}" title="${formatDateFull(day.key)} · ${day.count} 题" aria-label="${formatDateFull(day.key)}，${day.count} 题"></button>`;
      })
      .join('');

    const monthLabels = heatmap.labels
      .map(
        (label) =>
          `<span style="grid-column: ${label.column + 1} / span 1">${label.text}</span>`,
      )
      .join('');

    const weekdays = ['一', '', '三', '', '五', '', '']
      .map((label) => `<span>${label}</span>`)
      .join('');

    return `
      <div class="card-head">
        <div>
          <h3 class="card-title">年度热力图 <span class="card-pill">${heatmap.year} 年</span></h3>
          <p class="card-sub">过去一年的坚持，一眼就能看见。</p>
        </div>
        <div class="card-tools">
          <button class="text-btn" type="button" data-action="heat-current">今年</button>
          <button class="nav-arrow" type="button" data-action="heat-prev" aria-label="上一年">${icon('chevron-left')}</button>
          <button class="nav-arrow" type="button" data-action="heat-next" aria-label="下一年" ${heatmap.year >= new Date().getFullYear() ? 'disabled' : ''}>${icon('chevron-right')}</button>
        </div>
      </div>
      <div class="heatmap">
        <div class="heat-weekdays">${weekdays}</div>
        <div class="heat-map-wrap">
          <div class="heat-months" style="--cols: ${heatmap.columns}">${monthLabels}</div>
          <div class="heat-grid" style="--cols: ${heatmap.columns}">${cells}</div>
        </div>
      </div>
      <div class="heat-foot">
        <span>${heatmap.total} 题 · ${heatmap.active} 个活跃日</span>
        <span class="heat-legend">少 <i class="heat-cell level-0"></i><i class="heat-cell level-1"></i><i class="heat-cell level-2"></i><i class="heat-cell level-3"></i><i class="heat-cell level-4"></i> 多</span>
      </div>
    `;
  }

  function renderTodayCard(stats) {
    const records = stats.todayRecords;
    const items = records
      .slice(0, 5)
      .map(
        (record) => `
          <button class="today-item" type="button" data-action="edit-record" data-id="${escapeHtml(record.id)}">
            <span class="today-item-no">${escapeHtml(record.problemNumber)}</span>
            <span class="today-item-body">
              <span class="today-item-title">${escapeHtml(record.problemTitle)}</span>
              <span class="today-item-meta">
                <i class="site-dot" style="background: ${safeColor(siteById(record.siteId)?.color)}"></i>
                ${escapeHtml(siteName(record.siteId))}
                ${record.difficulty ? ` · ${escapeHtml(record.difficulty)}` : ''}
              </span>
            </span>
          </button>
        `,
      )
      .join('');

    let empty = '';
    if (!records.length) {
      empty = state.data.sites.length
        ? `<div class="empty compact">
            <div class="empty-icon" data-icon="book"></div>
            <h3>今天还没有记录</h3>
            <p>刚 AC 的题，趁热记下来。</p>
            <button class="btn btn-soft" type="button" data-action="add-record">${icon('plus')} 记录一题</button>
          </div>`
        : `<div class="empty compact">
            <div class="empty-icon" data-icon="globe"></div>
            <h3>先从一个题站开始</h3>
            <p>添加 Codeforces、洛谷等常用网站，之后就能选择它们记录题目。</p>
            <button class="btn btn-soft" type="button" data-action="add-site">${icon('plus')} 添加题站</button>
          </div>`;
    }

    return `
      <section class="card today-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">今日记录</h3>
            <p class="card-sub">${formatDateLong(todayKey())} · ${weekdayName(todayKey())}</p>
          </div>
          <span class="card-pill">${records.length} 题</span>
        </div>
        ${records.length ? `<div class="today-list">${items}</div>` : empty}
        ${
          records.length > 5
            ? `<button class="text-btn" type="button" data-action="view-day-records" data-date="${todayKey()}" style="margin-top: 4px;">查看今天全部 ${records.length} 题 ${icon('arrow-right')}</button>`
            : ''
        }
      </section>
    `;
  }

  function renderSiteBars(total) {
    const rows = state.data.sites
      .map((site) => ({
        site,
        count: state.data.records.filter((record) => record.siteId === site.id).length,
      }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    let body;
    if (!rows.length) {
      body = `<div class="side-empty">${
        state.data.sites.length
          ? '还没有刷题记录。记录第一题后，这里会出现各题站的占比。'
          : '还没有题站。先添加 <strong>Codeforces</strong>、<strong>洛谷</strong> 等常用网站。'
      }</div>`;
    } else {
      const max = rows[0].count;
      body = `<div class="site-bar-list">${rows
        .map(
          (row) => `
            <div class="site-bar">
              <div class="site-bar-head">
                <span class="site-bar-name"><i class="site-dot" style="background: ${safeColor(row.site.color)}"></i><span>${escapeHtml(row.site.name)}</span></span>
                <span class="site-bar-count">${row.count} 题 · ${total ? Math.round((row.count / total) * 100) : 0}%</span>
              </div>
              <div class="site-bar-track"><span style="width: ${Math.max(5, (row.count / max) * 100)}%; background: ${safeColor(row.site.color)}"></span></div>
            </div>
          `,
        )
        .join('')}</div>`;
    }

    return `
      <section class="card sites-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">题站分布</h3>
            <p class="card-sub">看看时间都花在了哪里。</p>
          </div>
        </div>
        ${body}
      </section>
    `;
  }

  /* Records ----------------------------------------------------------------- */

  function renderRecordsView(root) {
    const records = state.data.records;
    const monthSet = new Set(records.map((record) => record.date.slice(0, 7)));
    monthSet.add(todayKey().slice(0, 7));
    if (state.filters.month !== 'all') monthSet.add(state.filters.month);
    if (state.filters.date) monthSet.add(state.filters.date.slice(0, 7));
    const months = [...monthSet].sort().reverse();

    const monthOptions = [
      `<option value="all">全部月份</option>`,
      ...months.map(
        (month) =>
          `<option value="${month}" ${state.filters.month === month ? 'selected' : ''}>${formatMonthOption(month)}</option>`,
      ),
    ].join('');

    const siteOptions = [
      `<option value="all">全部题站</option>`,
      ...state.data.sites.map(
        (site) =>
          `<option value="${escapeHtml(site.id)}" ${state.filters.siteId === site.id ? 'selected' : ''}>${escapeHtml(site.name)}</option>`,
      ),
    ].join('');

    const dateChip = state.filters.date
      ? `<div class="filter-date-chip">${icon('calendar')} ${formatDateFull(state.filters.date)} · ${weekdayName(state.filters.date)} <button type="button" data-action="clear-date" aria-label="清除日期筛选">${icon('x')}</button></div>`
      : '';

    root.innerHTML = `
      <div class="records-toolbar">
        <label class="search-field">
          ${icon('search')}
          <input class="input" id="record-search" type="search" placeholder="搜索题目、题号、标签、题站…" value="${escapeHtml(state.filters.search)}" autocomplete="off" spellcheck="false" />
        </label>
        <select class="select" id="filter-site" aria-label="按题站筛选">${siteOptions}</select>
        <select class="select" id="filter-month" aria-label="按月份筛选">${monthOptions}</select>
        <button class="btn btn-ghost" type="button" data-action="clear-filters" ${filtersActive() ? '' : 'disabled'}>清除筛选</button>
      </div>
      ${dateChip}
      <div class="records-meta">
        <div><strong id="records-count">0</strong> 条记录 <span id="filter-note"></span></div>
        <div class="meta-actions">
          <span>按日期倒序</span>
          <button class="btn btn-soft" type="button" data-action="add-record">${icon('plus')} 记录一题</button>
        </div>
      </div>
      <div id="records-list"></div>
    `;

    refreshRecordList();
    hydrateIcons(root);
  }

  function refreshRecordList() {
    const list = $('#records-list');
    if (!list) return;

    const filtered = getFilteredRecords();
    const countElement = $('#records-count');
    const noteElement = $('#filter-note');
    if (countElement) countElement.textContent = filtered.length;
    if (noteElement) {
      noteElement.textContent = filtersActive() ? '· 已筛选' : '· 全部记录';
    }

    const clearButton = $('[data-action="clear-filters"]');
    if (clearButton) clearButton.disabled = !filtersActive();

    if (!filtered.length) {
      list.innerHTML = renderRecordsEmpty();
      hydrateIcons(list);
      return;
    }

    const groups = new Map();
    for (const record of filtered) {
      if (!groups.has(record.date)) groups.set(record.date, []);
      groups.get(record.date).push(record);
    }

    list.innerHTML = [...groups.entries()]
      .map(
        ([date, records]) => `
          <section class="date-group">
            <div class="date-group-head">
              <strong>${formatDateLong(date)}</strong>
              <span>${weekdayName(date)}</span>
              <span class="date-group-count">${records.length} 题</span>
            </div>
            <div class="record-list-card">
              ${records.map(renderRecordRow).join('')}
            </div>
          </section>
        `,
      )
      .join('');

    hydrateIcons(list);
  }

  function renderRecordRow(record) {
    const site = siteById(record.siteId);
    const tags = (record.tags || []).slice(0, 4);
    const extraTags = (record.tags || []).length - tags.length;

    return `
      <article class="record-row">
        <span class="record-no" title="${escapeHtml(record.problemNumber)}">${escapeHtml(record.problemNumber)}</span>
        <div class="record-main">
          <button class="record-title" type="button" data-action="edit-record" data-id="${escapeHtml(record.id)}" title="${escapeHtml(record.problemTitle)}">${escapeHtml(record.problemTitle)}</button>
          <div class="record-meta">
            <span class="site-chip"><i style="background: ${safeColor(site?.color)}"></i>${escapeHtml(site?.name || '未知题站')}</span>
            ${record.difficulty ? `<span class="difficulty-chip ${difficultyClass(record.difficulty)}">${escapeHtml(record.difficulty)}</span>` : ''}
            ${tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('')}
            ${extraTags > 0 ? `<span class="tag-chip">+${extraTags}</span>` : ''}
          </div>
        </div>
        <div class="record-actions">
          <button class="icon-btn" type="button" data-action="edit-record" data-id="${escapeHtml(record.id)}" title="编辑这道题" aria-label="编辑这道题">${icon('edit')}</button>
          <button class="icon-btn danger" type="button" data-action="delete-record" data-id="${escapeHtml(record.id)}" title="删除这道题" aria-label="删除这道题">${icon('trash')}</button>
        </div>
      </article>
    `;
  }

  function renderRecordsEmpty() {
    const hasRecords = state.data.records.length > 0;
    const hasSites = state.data.sites.length > 0;
    let title = '还没有刷题记录';
    let text = '先在题站管理中添加 Codeforces、洛谷等网站，然后记录第一道题。';
    let action = `<button class="btn btn-primary" type="button" data-action="add-site">${icon('plus')} 添加题站</button>`;

    if (hasRecords) {
      title = '没有找到符合条件的记录';
      text = '试试换一个月份、题站，或者清除搜索关键词。';
      action = `<button class="btn btn-ghost" type="button" data-action="clear-filters">清除筛选</button>`;
    } else if (hasSites) {
      text = '题站已经准备好了，记录今天 AC 的第一道题吧。';
      action = `<button class="btn btn-primary" type="button" data-action="add-record">${icon('plus')} 记录一题</button>`;
    }

    return `
      <div class="records-empty">
        <div class="empty">
          <div class="empty-icon" data-icon="${hasRecords ? 'search' : 'book'}"></div>
          <h3>${title}</h3>
          <p>${text}</p>
          ${action}
        </div>
      </div>
    `;
  }

  /* Sites ------------------------------------------------------------------- */

  function renderSitesView(root) {
    const sites = state.data.sites;
    const intro = `
      <div class="sites-intro">
        <div>
          <h2>已收录 ${sites.length} 个题站</h2>
          <p>记录题目时，网站必须从这里选择。名称和网址都可以随时修改。</p>
        </div>
        <button class="btn btn-primary" type="button" data-action="add-site">${icon('plus')} 添加题站</button>
      </div>
    `;

    if (!sites.length) {
      root.innerHTML = `
        ${intro}
        <div class="card">
          <div class="empty" style="padding: 52px 20px;">
            <div class="empty-icon" data-icon="globe"></div>
            <h3>还没有添加题站</h3>
            <p>把常用的刷题网站收进来，比如 Codeforces、洛谷、AtCoder。之后记录题目时就能直接选择，也能按题站统计。</p>
            <button class="btn btn-primary" type="button" data-action="add-site">${icon('plus')} 添加第一个题站</button>
          </div>
        </div>
      `;
      hydrateIcons(root);
      return;
    }

    const cards = sites.map((site) => {
      const siteRecords = state.data.records.filter((record) => record.siteId === site.id);
      const active = new Set(siteRecords.map((record) => record.date)).size;
      const latest = [...siteRecords].sort((a, b) => b.date.localeCompare(a.date))[0];
      const initial = site.name.trim().charAt(0).toUpperCase() || '?';
      const host = displayHost(site.url);

      return `
        <article class="site-card" style="--site-color: ${safeColor(site.color)}">
          <div class="site-head">
            <div class="site-logo">${escapeHtml(initial)}</div>
            <div class="site-copy">
              <div class="site-name" title="${escapeHtml(site.name)}">${escapeHtml(site.name)}</div>
              ${
                site.url
                  ? `<button class="site-url" type="button" data-action="open-url" data-url="${escapeHtml(site.url)}" title="${escapeHtml(site.url)}">${icon('external')} ${escapeHtml(host)}</button>`
                  : `<span class="site-url">未设置网址</span>`
              }
            </div>
            <div class="site-actions">
              <button class="icon-btn" type="button" data-action="edit-site" data-id="${escapeHtml(site.id)}" title="编辑题站" aria-label="编辑题站">${icon('edit')}</button>
              <button class="icon-btn danger" type="button" data-action="delete-site" data-id="${escapeHtml(site.id)}" title="删除题站" aria-label="删除题站">${icon('trash')}</button>
            </div>
          </div>
          <div class="site-stats">
            <div class="site-stat"><strong>${siteRecords.length}</strong><span>累计题数</span></div>
            <div class="site-stat"><strong>${active}</strong><span>活跃天数</span></div>
            <div class="site-last">最近练习<br>${latest ? relativeDate(latest.date) : '还没有记录'}</div>
          </div>
        </article>
      `;
    });

    root.innerHTML = `
      ${intro}
      <div class="sites-grid">
        ${cards.join('')}
        <button class="add-site-card" type="button" data-action="add-site">
          <span class="add-site-icon">${icon('plus')}</span>
          <span>添加题站</span>
          <span style="font-size: 9px; opacity: 0.7;">支持任意 OJ</span>
        </button>
      </div>
    `;
    hydrateIcons(root);
  }

  /* ------------------------------------------------------------------------ */
  /*  Navigation                                                               */
  /* ------------------------------------------------------------------------ */

  function navigate(view) {
    if (!VIEW_META[view] || state.view === view) return;
    state.view = view;
    render();
    $('#main-scroll').scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goToDateRecords(date) {
    state.filters = { search: '', siteId: 'all', month: 'all', date };
    if (state.view !== 'records') navigate('records');
    else render();
  }

  function shiftMonth(delta) {
    const [year, month] = state.monthCursor.split('-').map(Number);
    const next = new Date(year, month - 1 + delta, 1, 12);
    state.monthCursor = `${next.getFullYear()}-${pad2(next.getMonth() + 1)}`;
    const today = todayKey();
    if (!state.selectedDate.startsWith(state.monthCursor)) {
      state.selectedDate =
        state.monthCursor === today.slice(0, 7) ? today : `${state.monthCursor}-01`;
    }
    render();
  }

  function jumpToCurrentMonth() {
    state.monthCursor = todayKey().slice(0, 7);
    state.selectedDate = todayKey();
    render();
  }

  /* ------------------------------------------------------------------------ */
  /*  Save                                                                     */
  /* ------------------------------------------------------------------------ */

  function persist() {
    const snapshot = JSON.parse(JSON.stringify(state.data));
    setSavePill('saving', '正在保存…');

    saveChain = saveChain
      .then(async () => {
        const result = await api.saveData(snapshot);
        if (!result || result.ok === false) {
          throw new Error(result?.error || '未知错误');
        }
        const saved = new Date(result.savedAt || Date.now());
        setSavePill('saved', `已保存 ${pad2(saved.getHours())}:${pad2(saved.getMinutes())}`);
        return true;
      })
      .catch((error) => {
        console.error(error);
        setSavePill('error', '保存失败');
        showToast(`保存失败：${error.message}`, {
          type: 'error',
          duration: 8000,
          actionLabel: '重试',
          onAction: () => persist(),
        });
        return false;
      });

    return saveChain;
  }

  /* ------------------------------------------------------------------------ */
  /*  Records modal                                                            */
  /* ------------------------------------------------------------------------ */

  function requestAddRecord(date = todayKey()) {
    if (!state.data.sites.length) {
      state.pendingRecordDate = date;
      openSiteModal();
      showToast('先添加一个题站，就可以记录题目了。', { type: 'info' });
      return;
    }
    openRecordModal(null, { date });
  }

  function openRecordModal(recordId = null, presets = {}) {
    if (!state.data.sites.length) {
      state.pendingRecordDate = presets.date || todayKey();
      openSiteModal();
      return;
    }

    const record = recordId
      ? state.data.records.find((item) => item.id === recordId) || null
      : null;
    const date = record?.date || presets.date || todayKey();
    const requestedSiteId = record?.siteId || presets.siteId;
    const siteId = state.data.sites.some((site) => site.id === requestedSiteId)
      ? requestedSiteId
      : state.data.sites[0].id;
    const number = record?.problemNumber || '';
    const title = record?.problemTitle || '';
    const difficulty = record?.difficulty ?? presets.difficulty ?? '';
    const tags = (record?.tags || []).join(', ');

    const selectedSite = siteById(siteId);
    const siteOptions = state.data.sites
      .map(
        (site) =>
          `<option value="${escapeHtml(site.id)}" ${site.id === siteId ? 'selected' : ''}>${escapeHtml(site.name)}</option>`,
      )
      .join('');

    const quickTags = QUICK_TAGS.map(
      (tag) => `<button type="button" data-action="toggle-tag" data-tag="${tag}">${tag}</button>`,
    ).join('');

    const datalist = DIFFICULTY_OPTIONS.map((value) => `<option value="${value}"></option>`).join('');

    const html = `
      <div class="modal-backdrop" data-modal-backdrop>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="record-modal-title">
          <div class="modal-head">
            <div>
              <h2 class="modal-title" id="record-modal-title">${record ? '编辑刷题记录' : '记录一道题'}</h2>
              <p class="modal-sub">${record ? '修改后会自动保存到本地。' : '写下题号、题目和题站，今天的努力就有迹可循。'}</p>
            </div>
            <button class="modal-close" type="button" data-action="close-modal" aria-label="关闭">${icon('x')}</button>
          </div>
          <form class="modal-form" id="record-form" novalidate>
            <div class="modal-body">
              <input type="hidden" name="recordId" value="${escapeHtml(record?.id || '')}" />
              <div class="form-grid">
                <div class="field">
                  <label for="record-date">日期 <span class="required">*</span></label>
                  <input class="input" id="record-date" name="date" type="date" value="${date}" max="${todayKey()}" min="2000-01-01" />
                </div>
                <div class="field">
                  <label for="record-site">题站 <span class="required">*</span></label>
                  <select class="select" id="record-site" name="siteId">${siteOptions}</select>
                  <p class="field-hint" id="record-site-hint">${escapeHtml(selectedSite ? displayHost(selectedSite.url) : '')}</p>
                </div>
                <div class="field">
                  <label for="record-number">题号 <span class="required">*</span></label>
                  <input class="input" id="record-number" name="problemNumber" value="${escapeHtml(number)}" placeholder="如 CF1845D / P1001" maxlength="80" autocomplete="off" data-autofocus />
                </div>
                <div class="field">
                  <label for="record-title">题目名称 <span class="required">*</span></label>
                  <input class="input" id="record-title" name="problemTitle" value="${escapeHtml(title)}" placeholder="如 最大子段和" maxlength="200" autocomplete="off" />
                </div>
                <div class="field">
                  <label for="record-difficulty">难度</label>
                  <input class="input" id="record-difficulty" name="difficulty" value="${escapeHtml(difficulty)}" list="difficulty-list" placeholder="如 提高+/省选- 或 1800" maxlength="40" autocomplete="off" />
                  <datalist id="difficulty-list">${datalist}</datalist>
                  <p class="field-hint">可填中文难度或 Codeforces 分数。</p>
                </div>
                <div class="field">
                  <label for="record-tags">标签</label>
                  <input class="input" id="record-tags" name="tags" value="${escapeHtml(tags)}" placeholder="用逗号分隔，如：动态规划, 二分" maxlength="240" autocomplete="off" />
                  <p class="field-hint">最多 8 个，用逗号或空格分隔。</p>
                </div>
                <div class="field full">
                  <div class="field-label">快捷标签</div>
                  <div class="tag-quick">${quickTags}</div>
                  <div class="tag-preview" id="tag-preview"></div>
                </div>
              </div>
              <div class="form-error" id="record-form-error" role="alert">${icon('alert')}<span></span></div>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" type="button" data-action="close-modal">取消</button>
              <div class="spacer"></div>
              ${
                record
                  ? ''
                  : `<button class="btn btn-soft" type="submit" name="intent" value="continue">保存并再记一题</button>`
              }
              <button class="btn btn-primary" type="submit" name="intent" value="save">${record ? '保存修改' : '保存记录'}</button>
            </div>
          </form>
        </div>
      </div>
    `;

    openModal(html, () => {
      updateTagPreview();
    });
  }

  function updateTagPreview() {
    const input = $('#record-tags');
    const preview = $('#tag-preview');
    if (!input || !preview) return;
    preview.innerHTML = parseTags(input.value)
      .map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`)
      .join('');
  }

  function toggleTag(tag) {
    const input = $('#record-tags');
    if (!input) return;
    const tags = parseTags(input.value);
    const index = tags.indexOf(tag);
    if (index >= 0) tags.splice(index, 1);
    else if (tags.length < 8) tags.push(tag);
    input.value = tags.join(', ');
    updateTagPreview();
    input.focus();
  }

  async function handleRecordSubmit(event) {
    event.preventDefault();
    const form = event.target;
    if (form.dataset.submitting === '1') return;

    const formData = new FormData(form);
    const recordId = String(formData.get('recordId') || '');
    const date = String(formData.get('date') || '');
    const siteId = String(formData.get('siteId') || '');
    const problemNumber = String(formData.get('problemNumber') || '').trim();
    const problemTitle = String(formData.get('problemTitle') || '').trim();
    const difficulty = String(formData.get('difficulty') || '').trim();
    const tags = parseTags(formData.get('tags'));
    const intent = event.submitter?.value || 'save';

    const fail = (message, focusId) => {
      showFormError(form, message);
      if (focusId) form.querySelector(`#${focusId}`)?.focus();
    };

    clearFormError(form);
    if (!isValidDateKey(date)) return fail('请选择有效的日期。', 'record-date');
    if (date > todayKey()) return fail('不能记录未来日期的题目。', 'record-date');
    if (!siteById(siteId)) return fail('请选择一个已经添加过的题站。', 'record-site');
    if (!problemNumber) return fail('请填写题号。', 'record-number');
    if (!problemTitle) return fail('请填写题目名称。', 'record-title');

    const existing = recordId
      ? state.data.records.find((record) => record.id === recordId)
      : null;

    form.dataset.submitting = '1';
    $$('button[type="submit"]', form).forEach((button) => {
      button.disabled = true;
    });

    try {
      const now = new Date().toISOString();
      if (existing) {
        existing.date = date;
        existing.siteId = siteId;
        existing.problemNumber = problemNumber;
        existing.problemTitle = problemTitle;
        existing.difficulty = difficulty;
        existing.tags = tags;
        existing.updatedAt = now;
      } else {
        state.data.records.unshift({
          id: uid('record'),
          date,
          siteId,
          problemNumber,
          problemTitle,
          difficulty,
          tags,
          createdAt: now,
          updatedAt: now,
        });
      }

      if (!recordId && state.filters.date && state.filters.date !== date) {
        state.filters.date = null;
      }
      state.selectedDate = date;
      state.monthCursor = date.slice(0, 7);
      state.heatYear = Number(date.slice(0, 4));

      await persist();
      closeModal();
      render();
      showToast(existing ? '记录已更新。' : '记录已保存。');

      if (intent === 'continue' && !existing) {
        setTimeout(() => {
          openRecordModal(null, { date, siteId, difficulty });
        }, 120);
      }
    } finally {
      if (form.isConnected) {
        form.dataset.submitting = '';
        $$('button[type="submit"]', form).forEach((button) => {
          button.disabled = false;
        });
      }
    }
  }

  /* ------------------------------------------------------------------------ */
  /*  Site modal                                                               */
  /* ------------------------------------------------------------------------ */

  function openSiteModal(siteId = null) {
    const site = siteId ? siteById(siteId) : null;
    const pendingDate = site ? null : state.pendingRecordDate;
    state.pendingRecordDate = null;
    const selectedColor = site?.color || SITE_COLORS[state.data.sites.length % SITE_COLORS.length];

    const swatches = SITE_COLORS.map(
      (color) => `
        <label class="color-swatch" style="--swatch: ${color}" title="${color}">
          <input type="radio" name="color" value="${color}" ${color === selectedColor ? 'checked' : ''} />
          <span></span>
        </label>
      `,
    ).join('');

    const html = `
      <div class="modal-backdrop" data-modal-backdrop>
        <div class="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="site-modal-title">
          <div class="modal-head">
            <div>
              <h2 class="modal-title" id="site-modal-title">${site ? '编辑题站' : '添加题站'}</h2>
              <p class="modal-sub">${site ? '修改名称、网址或标记颜色。' : '先把常用 OJ 收进来，之后记录题目时直接选择。'}</p>
            </div>
            <button class="modal-close" type="button" data-action="close-modal" aria-label="关闭">${icon('x')}</button>
          </div>
          <form class="modal-form" id="site-form" novalidate>
            <div class="modal-body">
              <input type="hidden" name="siteId" value="${escapeHtml(site?.id || '')}" />
              <div class="form-grid">
                <div class="field full">
                  <label for="site-name">网站名称 <span class="required">*</span></label>
                  <input class="input" id="site-name" name="name" value="${escapeHtml(site?.name || '')}" placeholder="如 Codeforces / 洛谷" maxlength="60" autocomplete="off" data-autofocus />
                </div>
                <div class="field full">
                  <label for="site-url">网址 <span class="required">*</span></label>
                  <input class="input" id="site-url" name="url" value="${escapeHtml(site?.url || '')}" placeholder="如 codeforces.com" maxlength="500" autocomplete="off" spellcheck="false" />
                  <p class="field-hint">不写 https:// 也可以，保存时会自动补全。</p>
                </div>
                <div class="field full">
                  <div class="field-label">标记颜色</div>
                  <div class="color-row">${swatches}</div>
                </div>
              </div>
              <div class="form-error" id="site-form-error" role="alert">${icon('alert')}<span></span></div>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" type="button" data-action="close-modal">取消</button>
              <div class="spacer"></div>
              <button class="btn btn-primary" type="submit">${site ? '保存修改' : '添加题站'}</button>
            </div>
          </form>
        </div>
      </div>
    `;

    openModal(html);
    state.siteModalPending = pendingDate;
  }

  async function handleSiteSubmit(event) {
    event.preventDefault();
    const form = event.target;
    if (form.dataset.submitting === '1') return;

    const formData = new FormData(form);
    const siteId = String(formData.get('siteId') || '');
    const name = String(formData.get('name') || '').trim();
    const rawUrl = String(formData.get('url') || '').trim();
    const color = safeColor(String(formData.get('color') || ''));
    const existing = siteId ? siteById(siteId) : null;

    const fail = (message, focusId) => {
      showFormError(form, message);
      if (focusId) form.querySelector(`#${focusId}`)?.focus();
    };

    clearFormError(form);
    if (!name) return fail('请填写网站名称。', 'site-name');
    const duplicate = state.data.sites.find(
      (site) =>
        site.id !== siteId && site.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) return fail('已经有同名题站了，请换一个名称。', 'site-name');

    let url;
    try {
      url = normalizeUrlInput(rawUrl);
    } catch (error) {
      return fail(error.message, 'site-url');
    }

    form.dataset.submitting = '1';
    $$('button[type="submit"]', form).forEach((button) => {
      button.disabled = true;
    });

    try {
      const now = new Date().toISOString();
      if (existing) {
        existing.name = name;
        existing.url = url;
        existing.color = color;
      } else {
        state.data.sites.push({
          id: uid('site'),
          name,
          url,
          color,
          createdAt: now,
        });
      }

      await persist();
      const pendingDate = state.siteModalPending;
      state.siteModalPending = null;
      closeModal();
      render();
      showToast(existing ? '题站已更新。' : '题站已添加。');

      if (!existing && pendingDate) {
        setTimeout(() => openRecordModal(null, { date: pendingDate }), 140);
      }
    } finally {
      if (form.isConnected) {
        form.dataset.submitting = '';
        $$('button[type="submit"]', form).forEach((button) => {
          button.disabled = false;
        });
      }
    }
  }

  /* ------------------------------------------------------------------------ */
  /*  Confirm / info dialog                                                    */
  /* ------------------------------------------------------------------------ */

  function openConfirm({
    title,
    body,
    confirmText = '确认',
    cancelText = '取消',
    tone = 'danger',
    iconName = 'alert',
    onConfirm = null,
  }) {
    const info = tone === 'info';
    const html = `
      <div class="modal-backdrop" data-modal-backdrop>
        <div class="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div class="modal-head">
            <div></div>
            <button class="modal-close" type="button" data-action="close-modal" aria-label="关闭">${icon('x')}</button>
          </div>
          <div class="modal-body">
            <div class="confirm-icon ${info ? 'info' : ''}">${icon(iconName)}</div>
            <h2 class="modal-title" id="confirm-title">${title}</h2>
            <p class="confirm-body">${body}</p>
          </div>
          <div class="modal-foot">
            ${
              cancelText
                ? `<button class="btn btn-ghost" type="button" data-action="close-modal">${cancelText}</button>`
                : ''
            }
            <div class="spacer"></div>
            <button class="btn ${info ? 'btn-primary' : 'btn-danger'}" type="button" data-action="confirm" data-autofocus>${confirmText}</button>
          </div>
        </div>
      </div>
    `;
    openModal(html);
    state.confirmCallback = onConfirm;
  }

  /* ------------------------------------------------------------------------ */
  /*  Actions                                                                  */
  /* ------------------------------------------------------------------------ */

  function handleAction(action, element) {
    switch (action) {
      case 'add-record':
        requestAddRecord(element.dataset.date || state.filters.date || todayKey());
        break;

      case 'add-site':
        state.pendingRecordDate = null;
        openSiteModal();
        break;

      case 'edit-record':
        openRecordModal(element.dataset.id);
        break;

      case 'delete-record':
        confirmDeleteRecord(element.dataset.id);
        break;

      case 'edit-site':
        openSiteModal(element.dataset.id);
        break;

      case 'delete-site':
        confirmDeleteSite(element.dataset.id);
        break;

      case 'open-url':
        openUrl(element.dataset.url);
        break;

      case 'month-prev':
        shiftMonth(-1);
        break;

      case 'month-next':
        shiftMonth(1);
        break;

      case 'month-today':
        jumpToCurrentMonth();
        break;

      case 'heat-prev':
        if (state.heatYear > 2000) {
          state.heatYear -= 1;
          render();
        }
        break;

      case 'heat-next':
        if (state.heatYear < new Date().getFullYear()) {
          state.heatYear += 1;
          render();
        }
        break;

      case 'heat-current':
        state.heatYear = new Date().getFullYear();
        render();
        break;

      case 'calendar-day': {
        const date = element.dataset.date;
        if (!isValidDateKey(date)) break;
        state.selectedDate = date;
        state.monthCursor = date.slice(0, 7);
        render();
        break;
      }

      case 'open-date':
        if (isValidDateKey(element.dataset.date)) {
          goToDateRecords(element.dataset.date);
        }
        break;

      case 'view-day-records':
        if (isValidDateKey(element.dataset.date)) {
          goToDateRecords(element.dataset.date);
        }
        break;

      case 'clear-date':
        state.filters.date = null;
        render();
        break;

      case 'clear-filters':
        state.filters = { search: '', siteId: 'all', month: 'all', date: null };
        render();
        break;

      case 'toggle-tag':
        toggleTag(element.dataset.tag || '');
        break;

      case 'export-data':
        exportData();
        break;

      case 'import-data':
        importData();
        break;

      case 'reveal-data':
        revealData();
        break;

      case 'retry-save':
        persist();
        break;

      case 'close-modal':
        closeModal();
        break;

      case 'confirm': {
        const callback = state.confirmCallback;
        state.confirmCallback = null;
        closeModal();
        if (typeof callback === 'function') {
          Promise.resolve(callback()).catch((error) => {
            console.error(error);
            showToast(error.message || '操作失败。', { type: 'error' });
          });
        }
        break;
      }

      default:
        break;
    }
  }

  function confirmDeleteRecord(recordId) {
    const record = state.data.records.find((item) => item.id === recordId);
    if (!record) return;
    const index = state.data.records.indexOf(record);
    const snapshot = { ...record };

    openConfirm({
      title: '删除这条记录？',
      body: `<strong>${escapeHtml(record.problemTitle)}</strong> 会从 ${formatDateFull(record.date)} 的记录中移除。<br>删除后仍然可以撤销。`,
      confirmText: '删除',
      tone: 'danger',
      iconName: 'trash',
      onConfirm: async () => {
        const liveIndex = state.data.records.findIndex((item) => item.id === recordId);
        if (liveIndex < 0) return;
        state.data.records.splice(liveIndex, 1);
        await persist();
        render();
        showToast('记录已删除。', {
          actionLabel: '撤销',
          duration: 6000,
          onAction: async () => {
            state.data.records.splice(Math.min(index, state.data.records.length), 0, snapshot);
            await persist();
            render();
            showToast('已恢复记录。');
          },
        });
      },
    });
  }

  function confirmDeleteSite(siteId) {
    const site = siteById(siteId);
    if (!site) return;
    const records = state.data.records.filter((record) => record.siteId === siteId);

    if (records.length) {
      openConfirm({
        title: '这个题站还在使用',
        body: `<strong>${escapeHtml(site.name)}</strong> 下还有 ${records.length} 条刷题记录，暂时不能删除。<br>可以先查看这些记录，把它们改到其他题站或删除。`,
        confirmText: '查看相关记录',
        cancelText: '取消',
        tone: 'info',
        iconName: 'info',
        onConfirm: () => {
          state.filters = { search: '', siteId, month: 'all', date: null };
          if (state.view !== 'records') navigate('records');
          else render();
        },
      });
      return;
    }

    openConfirm({
      title: '删除这个题站？',
      body: `将从题站列表中移除 <strong>${escapeHtml(site.name)}</strong>。它还没有任何刷题记录，删除后不影响已有数据。`,
      confirmText: '删除题站',
      tone: 'danger',
      iconName: 'trash',
      onConfirm: async () => {
        state.data.sites = state.data.sites.filter((item) => item.id !== siteId);
        if (state.filters.siteId === siteId) state.filters.siteId = 'all';
        await persist();
        render();
        showToast('题站已删除。');
      },
    });
  }

  async function openUrl(url) {
    if (!url) return;
    try {
      const result = await api.openExternal(url);
      if (result && result.ok === false) {
        showToast(result.error || '无法打开网址。', { type: 'error' });
      }
    } catch (error) {
      showToast(`无法打开网址：${error.message}`, { type: 'error' });
    }
  }

  async function exportData() {
    try {
      const result = await api.exportData(JSON.parse(JSON.stringify(state.data)));
      if (!result) return;
      if (result.canceled) return;
      if (result.error) {
        showToast(result.error, { type: 'error', duration: 6000 });
        return;
      }
      showToast(`备份已导出：${result.path}`, { duration: 7000 });
    } catch (error) {
      showToast(`导出失败：${error.message}`, { type: 'error', duration: 7000 });
    }
  }

  async function importData() {
    if (
      !state.data.records.length &&
      !state.data.sites.length
    ) {
      await runImport();
      return;
    }

    openConfirm({
      title: '导入备份文件？',
      body: '导入会覆盖当前的题站和刷题记录。应用会在覆盖前自动保留一份当前数据的备份。',
      confirmText: '选择备份文件',
      cancelText: '取消',
      tone: 'danger',
      iconName: 'upload',
      onConfirm: runImport,
    });
  }

  async function runImport() {
    let result;
    try {
      result = await api.importData();
    } catch (error) {
      showToast(`导入失败：${error.message}`, { type: 'error', duration: 7000 });
      return;
    }
    if (!result) return;
    if (result.canceled) return;
    if (result.error) {
      showToast(result.error, { type: 'error', duration: 7000 });
      return;
    }

    state.data = normalizeClientData(result.data);
    state.filters = { search: '', siteId: 'all', month: 'all', date: null };
    state.selectedDate = todayKey();
    state.monthCursor = todayKey().slice(0, 7);
    state.heatYear = new Date().getFullYear();
    state.view = 'dashboard';
    render();

    const summary = result.summary || {};
    const dropped = (summary.droppedSites || 0) + (summary.droppedRecords || 0);
    showToast(
      `导入完成：${summary.records ?? state.data.records.length} 条记录，${summary.sites ?? state.data.sites.length} 个题站${dropped ? `，跳过 ${dropped} 条无效数据` : ''}。`,
      { type: 'success', duration: 6500 },
    );
  }

  async function revealData() {
    try {
      const result = await api.revealData();
      if (result && result.ok === false) {
        showToast(result.error || '无法打开数据目录。', { type: 'error' });
      }
    } catch (error) {
      showToast(`无法打开数据目录：${error.message}`, { type: 'error' });
    }
  }

  /* ------------------------------------------------------------------------ */
  /*  Modal plumbing                                                           */
  /* ------------------------------------------------------------------------ */

  function openModal(html, onMount) {
    closeModal();
    modalPreviousFocus = document.activeElement;
    const root = $('#modal-root');
    root.innerHTML = html;
    document.body.classList.add('modal-open');

    requestAnimationFrame(() => {
      const modal = $('.modal', root);
      if (!modal) return;
      const autofocus =
        modal.querySelector('[data-autofocus]') ||
        modal.querySelector('input:not([type="hidden"]), select, button');
      autofocus?.focus();
      onMount?.(modal);
    });
  }

  function closeModal() {
    const root = $('#modal-root');
    const wasOpen = root.childElementCount > 0;
    root.innerHTML = '';
    document.body.classList.remove('modal-open');
    state.confirmCallback = null;
    state.siteModalPending = null;
    if (wasOpen && modalPreviousFocus && modalPreviousFocus.isConnected) {
      modalPreviousFocus.focus();
    }
    modalPreviousFocus = null;
  }

  function trapFocus(event) {
    if (event.key !== 'Tab') return;
    const modal = $('#modal-root .modal');
    if (!modal) return;
    const focusable = $$(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      modal,
    ).filter((element) => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function showFormError(form, message) {
    const error = $('.form-error', form);
    if (!error) return;
    const text = $('span', error);
    if (text) text.textContent = message;
    error.classList.add('show');
  }

  function clearFormError(form) {
    const error = $('.form-error', form);
    if (!error) return;
    error.classList.remove('show');
    const text = $('span', error);
    if (text) text.textContent = '';
  }

  /* ------------------------------------------------------------------------ */
  /*  Toasts                                                                   */
  /* ------------------------------------------------------------------------ */

  function showToast(message, options = {}) {
    const container = $('#toast-container');
    if (!container) return;
    const type = options.type || 'success';
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let timer = null;

    const toastIcon = document.createElement('span');
    toastIcon.className = 'toast-icon';
    toastIcon.innerHTML = icon(type === 'error' ? 'alert' : type === 'info' ? 'info' : 'check');

    const text = document.createElement('span');
    text.className = 'toast-message';
    text.textContent = message;

    toast.append(toastIcon, text);

    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      clearTimeout(timer);
      toast.classList.add('is-leaving');
      setTimeout(() => toast.remove(), 180);
    };

    if (options.actionLabel && typeof options.onAction === 'function') {
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'toast-action';
      action.textContent = options.actionLabel;
      action.addEventListener('click', async () => {
        dismiss();
        await options.onAction();
      });
      toast.appendChild(action);
    }

    container.appendChild(toast);
    while (container.children.length > 3) {
      container.firstElementChild.remove();
    }

    timer = setTimeout(dismiss, options.duration || 4200);
    return { dismiss };
  }

  /* ------------------------------------------------------------------------ */
  /*  Events                                                                   */
  /* ------------------------------------------------------------------------ */

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const actionElement = event.target.closest('[data-action]');
      if (actionElement) {
        event.preventDefault();
        handleAction(actionElement.dataset.action, actionElement);
        return;
      }

      const navElement = event.target.closest('[data-view]');
      if (navElement) {
        event.preventDefault();
        navigate(navElement.dataset.view);
        return;
      }

      const backdrop = event.target.closest('[data-modal-backdrop]');
      if (backdrop && event.target === backdrop) closeModal();
    });

    document.addEventListener('input', (event) => {
      if (event.target.id === 'record-search') {
        state.filters.search = event.target.value;
        refreshRecordList();
      }

      if (event.target.id === 'record-tags') {
        updateTagPreview();
      }

      const form = event.target.closest('form');
      if (form) clearFormError(form);
    });

    document.addEventListener('change', (event) => {
      if (event.target.id === 'filter-site') {
        state.filters.siteId = event.target.value;
        refreshRecordList();
      }

      if (event.target.id === 'filter-month') {
        state.filters.date = null;
        state.filters.month = event.target.value;
        render();
      }

      if (event.target.id === 'record-site') {
        const site = siteById(event.target.value);
        const hint = $('#record-site-hint');
        if (hint) hint.textContent = site ? displayHost(site.url) : '';
      }
    });

    document.addEventListener('submit', (event) => {
      if (event.target.id === 'record-form') handleRecordSubmit(event);
      else if (event.target.id === 'site-form') handleSiteSubmit(event);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const modal = $('#modal-root .modal');
        if (modal) {
          event.preventDefault();
          closeModal();
        }
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        const modal = $('#modal-root .modal');
        if (!modal) {
          event.preventDefault();
          requestAddRecord(state.filters.date || todayKey());
        }
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        if ($('#modal-root .modal')) return;
        event.preventDefault();
        if (state.view !== 'records') navigate('records');
        setTimeout(() => $('#record-search')?.focus(), 60);
        return;
      }

      trapFocus(event);
    });
  }

  /* ------------------------------------------------------------------------ */
  /*  Boot                                                                     */
  /* ------------------------------------------------------------------------ */

  async function init() {
    hydrateIcons();
    bindEvents();
    setSavePill('saved', '正在读取本地数据…');
    renderChrome();

    try {
      const [loaded, info] = await Promise.all([
        api.loadData(),
        api.getInfo().catch(() => ({ version: '1.0.0', dataPath: '' })),
      ]);

      state.info = info || { version: '1.0.0' };
      if (info?.version) {
        $('#app-version').textContent = info.version;
      }
      state.data = normalizeClientData(loaded?.data);
      setSavePill('saved', '本地数据已加载');
      render();

      if (loaded?.warning) {
        showToast(loaded.warning, { type: 'error', duration: 9000 });
      }
    } catch (error) {
      console.error(error);
      setSavePill('error', '读取失败');
      render();
      showToast(`读取本地数据失败：${error.message}`, {
        type: 'error',
        duration: 9000,
        actionLabel: '重试',
        onAction: () => window.location.reload(),
      });
    }

    window.__algolog = {
      navigate,
      openRecordModal: () => requestAddRecord(todayKey()),
      getState: () => JSON.parse(JSON.stringify(state.data)),
    };
  }

  init();
})();
