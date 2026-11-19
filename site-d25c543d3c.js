(() => {
  const root = document.documentElement;
  const slides = [...document.querySelectorAll('.x')];
  const viewer = document.currentScript.dataset.viewer;
  const loadViewer = () => {
    if (!document.querySelector(`script[src="${viewer}"]`)) {
      document.head.appendChild(document.createElement('script')).src = viewer;
    }
  };
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let path = null;
  let home = null;
  let entry = null;
  let left = -Infinity;

  const shown = () => {
    const target = document.querySelector('.x:target');
    if (target) return target;
    const named = location.hash.length > 1 ? document.getElementById(location.hash.slice(1)) : null;
    return named?.classList.contains('x') ? named : null;
  };

  const tagged = (slide, tag) => ` ${slide.dataset.t ?? ''} `.includes(` ${tag} `);

  const enter = (slide) => {
    const tag = slide.dataset.c;
    home = slide;
    path = slides.filter((s) => (tag ? tagged(s, tag) : s.dataset.e === slide.dataset.e));
  };

  const here = () => {
    const slide = shown();
    if (!slide) return null;
    if (!path?.includes(slide)) enter(slide);
    if (entry && !history.state?.board) history.replaceState({ board: true }, '');
    return slide;
  };

  const close = () => {
    if (!here()) return;
    left = performance.now();
    if (history.state?.board) {
      history.back();
      return;
    }
    const link =
      document.querySelector(`.board a[href="#${home.id}"]`) ??
      document.querySelector(`.p[id="${home.dataset.e}"]`);
    location.replace('#');
    history.replaceState(null, '', location.pathname + location.search);
    link?.scrollIntoView({ block: 'center' });
    sync();
  };

  const go = (step) => {
    const slide = here();
    if (!slide) return;
    const next = path[path.indexOf(slide) + step];
    if (!next) {
      close();
      return;
    }
    const state = history.state;
    location.replace(`#${next.id}`);
    history.replaceState(state, '');
    sync();
  };

  const warm = (slide) => {
    for (const img of slide?.querySelectorAll('img[loading]') ?? []) img.loading = 'eager';
  };

  const board = document.querySelector('.board');

  const sync = () => {
    const slide = here();
    if (board) board.inert = Boolean(slide);
    if (!slide) {
      if (path) left = performance.now();
      path = null;
      home = null;
      entry?.focus({ preventScroll: true });
      entry = null;
    } else {
      const at = path.indexOf(slide);
      warm(path[at + 1]);
      warm(path[at - 1]);
      if (slide.querySelector('[data-model]')) loadViewer();
    }
    for (const video of document.querySelectorAll('.x video')) {
      if (video.closest('.x') === slide && !calm) video.play().catch(() => {});
      else video.pause();
    }
  };

  addEventListener('hashchange', sync);

  addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (shown() && performance.now() - left < 350) {
      e.preventDefault();
      return;
    }
    if (!shown()) {
      const plain = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
      if (!link?.closest('.board')) return;
      if (performance.now() - left < 350) e.preventDefault();
      else if (plain) entry = link;
      return;
    }
    if (link?.classList.contains('name')) {
      e.preventDefault();
      close();
    } else if (!link && !e.target.closest('video, [data-model]')) {
      go(e.clientX < innerWidth / 2 ? -1 : 1);
    }
  });

  addEventListener('keydown', (e) => {
    if (!shown() || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Escape') close();
    else return;
    e.preventDefault();
  });

  addEventListener('pointerover', (e) => {
    const link = e.target.closest('.board a');
    if (link) warm(document.getElementById(link.hash.slice(1)));
  });

  for (const type of ['contextmenu', 'dragstart']) {
    addEventListener(type, (e) => {
      if (e.target.closest('img, picture, video, canvas, .x')) e.preventDefault();
    });
  }

  if (!calm) {
    const seen = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting } of entries) {
          if (isIntersecting) target.play().catch(() => {});
          else target.pause();
        }
      },
      { threshold: 0.25 },
    );
    for (const video of document.querySelectorAll('.board video')) seen.observe(video);
  }

  sync();
  if (document.querySelector('.board [data-model]')) loadViewer();

  fetch('version.txt', { cache: 'no-store' })
    .then((answer) => (answer.ok ? answer.text() : ''))
    .then((latest) => {
      const version = latest.trim();
      if (version && version !== root.dataset.v && !location.search.includes(version)) {
        location.replace(`${location.pathname}?${version}${location.hash}`);
      }
    })
    .catch(() => {});
})();
