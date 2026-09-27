(() => {
  const root = document.documentElement;
  root.classList.add("js");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Theme toggle ----
  const themeBtn = document.getElementById("theme-toggle");
  const applyTheme = (next) => {
    root.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]').content = next === "dark" ? "#0b0c0e" : "#fafaf8";
    try { localStorage.setItem("theme", next); } catch (e) {}
  };
  // Circular reveal from the toggle button where View Transitions are supported
  const toggleTheme = (origin) => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    if (!document.startViewTransition || reduceMotion) return applyTheme(next);
    const r = (origin || themeBtn).getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = document.startViewTransition(() => applyTheme(next));
    t.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 650, easing: "cubic-bezier(.2,.7,.2,1)", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(() => {});
  };
  themeBtn.addEventListener("click", () => toggleTheme(themeBtn));

  // ---- Scroll progress ----
  const progress = document.querySelector(".progress");
  const onProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };
  addEventListener("scroll", onProgress, { passive: true });
  addEventListener("resize", onProgress);
  onProgress();

  // ---- "Decrypt" headline ----
  const scramble = document.querySelector(".scramble");
  if (scramble && !reduceMotion) {
    const final = scramble.textContent;
    const glyphs = "!<>-_\\/[]{}=+*^?#0123456789ABCDEF";
    scramble.style.width = `${scramble.getBoundingClientRect().width}px`;
    scramble.classList.add("running");
    const start = performance.now() + 450, dur = 1300;
    const frame = (now) => {
      const p = Math.max(0, Math.min((now - start) / dur, 1));
      const revealed = Math.floor(p * final.length);
      scramble.textContent = [...final].map((ch, i) =>
        i < revealed || ch === " " ? ch : glyphs[(Math.random() * glyphs.length) | 0]
      ).join("");
      if (p < 1) requestAnimationFrame(frame);
      else { scramble.textContent = final; scramble.classList.remove("running"); scramble.style.width = ""; }
    };
    requestAnimationFrame(frame);
  }

  // ---- Local time in Noida ----
  const timeEl = document.getElementById("local-time");
  if (timeEl) {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
    const tickTime = () => { timeEl.textContent = fmt.format(new Date()); };
    tickTime();
    setInterval(tickTime, 30000);
  }

  // ---- Sticky nav background ----
  const nav = document.querySelector(".nav");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---- Mobile menu ----
  const menuBtn = document.getElementById("menu-btn");
  const links = document.getElementById("nav-links");
  const setMenu = (open) => {
    links.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  menuBtn.addEventListener("click", () => setMenu(!links.classList.contains("open")));
  links.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  // ---- Reveal on scroll ----
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach((el, i) => {
      // Small stagger for siblings revealed together
      el.style.transitionDelay = `${(i % 4) * 60}ms`;
      io.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  // ---- Active section in nav ----
  const navLinks = [...links.querySelectorAll("a")];
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href")));
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => s && spy.observe(s));
  }

  // ---- Count-up stats ----
  const counters = document.querySelectorAll("[data-count]");
  const runCount = (el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = target; return; }
    const start = performance.now(), dur = 1400;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCount(entry.target);
        co.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => co.observe(el));
  } else {
    counters.forEach((el) => (el.textContent = el.dataset.count));
  }

  // ---- Cursor spotlight on cards ----
  document.querySelectorAll(".spot").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  // ---- Hero window tilt (desktop pointer only) ----
  const tilt = document.querySelector(".tilt");
  if (tilt && !reduceMotion && matchMedia("(hover: hover) and (min-width: 981px)").matches) {
    const hero = document.querySelector(".hero");
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `rotateY(${-8 + x * 10}deg) rotateX(${4 - y * 8}deg)`;
    });
    hero.addEventListener("pointerleave", () => { tilt.style.transform = ""; });
  }

  // ---- Copy email ----
  const toast = document.getElementById("toast");
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2000);
  };
  const copyBtn = document.getElementById("copy-email");
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.email);
      showToast("Email copied to clipboard");
    } catch (e) {
      showToast(copyBtn.dataset.email);
    }
  });

  // ---- Command palette (⌘K / Ctrl+K) ----
  const cmdk = document.getElementById("cmdk");
  const input = document.getElementById("cmdk-input");
  const list = document.getElementById("cmdk-list");
  const go = (hash) => () => document.querySelector(hash).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  const openUrl = (url) => () => window.open(url, "_blank", "noopener");
  const commands = [
    { group: "Navigate", icon: "◇", label: "About", run: go("#about") },
    { group: "Navigate", icon: "★", label: "Case studies", run: go("#projects"), keys: "work projects" },
    { group: "Navigate", icon: "↗", label: "Experience", run: go("#experience"), keys: "jobs idemia" },
    { group: "Navigate", icon: "⌘", label: "Skills & toolkit", run: go("#skills") },
    { group: "Navigate", icon: "✉", label: "Contact", run: go("#contact") },
    { group: "Actions", icon: "⧉", label: "Copy email address", run: () => copyBtn.click(), hint: "copy" },
    { group: "Actions", icon: "@", label: "Send an email", run: () => { location.href = "mailto:ritikgupta1220@outlook.com"; } },
    { group: "Actions", icon: "↓", label: "Download résumé (PDF)", run: openUrl("assets/Ritik_Gupta_Resume.pdf"), keys: "resume cv" },
    { group: "Actions", icon: "◐", label: "Toggle light / dark theme", run: () => toggleTheme(themeBtn), keys: "mode" },
    { group: "Links", icon: "in", label: "LinkedIn profile", run: openUrl("https://www.linkedin.com/in/ritikgupta1220") },
  ];
  let filtered = commands, active = 0, lastFocus = null;

  const render = () => {
    const q = input.value.trim().toLowerCase();
    filtered = commands.filter((c) => `${c.label} ${c.group} ${c.keys || ""}`.toLowerCase().includes(q));
    active = Math.min(active, Math.max(filtered.length - 1, 0));
    list.innerHTML = "";
    if (!filtered.length) {
      list.innerHTML = `<li class="cmdk-empty">No results</li>`;
      input.removeAttribute("aria-activedescendant");
      return;
    }
    let group = "";
    filtered.forEach((c, i) => {
      if (c.group !== group) {
        group = c.group;
        const g = document.createElement("li");
        g.className = "cmdk-group"; g.setAttribute("role", "presentation"); g.textContent = group;
        list.appendChild(g);
      }
      const li = document.createElement("li");
      li.className = "cmdk-item"; li.id = `cmdk-${i}`; li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(i === active));
      li.innerHTML = `<span class="ci">${c.icon}</span><span></span>${c.hint ? `<span class="hint">${c.hint}</span>` : ""}`;
      li.children[1].textContent = c.label;
      li.addEventListener("pointermove", () => { if (active !== i) { active = i; highlight(); } });
      li.addEventListener("click", () => run(i));
      list.appendChild(li);
    });
    highlight();
  };
  const highlight = () => {
    list.querySelectorAll(".cmdk-item").forEach((el, i) => el.setAttribute("aria-selected", String(i === active)));
    const el = document.getElementById(`cmdk-${active}`);
    if (el) { input.setAttribute("aria-activedescendant", el.id); el.scrollIntoView({ block: "nearest" }); }
  };
  const openCmdk = () => {
    lastFocus = document.activeElement;
    cmdk.hidden = false; input.value = ""; active = 0; render();
    document.body.style.overflow = "hidden";
    input.focus();
  };
  const closeCmdk = () => {
    cmdk.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  };
  const run = (i) => { const c = filtered[i]; if (!c) return; closeCmdk(); c.run(); };

  document.getElementById("cmdk-open").addEventListener("click", openCmdk);
  cmdk.addEventListener("click", (e) => { if (e.target.hasAttribute("data-close")) closeCmdk(); });
  input.addEventListener("input", () => { active = 0; render(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % Math.max(filtered.length, 1); highlight(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + filtered.length) % Math.max(filtered.length, 1); highlight(); }
    else if (e.key === "Enter") { e.preventDefault(); run(active); }
    else if (e.key === "Tab") { e.preventDefault(); } // keep focus trapped in the dialog
  });
  addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      cmdk.hidden ? openCmdk() : closeCmdk();
    } else if (e.key === "Escape" && !cmdk.hidden) {
      closeCmdk();
    }
  });
  // Show the right shortcut for non-Mac users
  if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
    document.querySelector(".cmdk-trigger kbd").textContent = "Ctrl K";
  }

  document.getElementById("year").textContent = new Date().getFullYear();
})();
