(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Typewriter ---------- */
  var EN = document.documentElement.lang === 'en';
  var PH = EN
    ? ['who fits your project', 'close to your field', 'your audience follows', 'who shows up on time']
    : ['يناسب مشروعك', 'قريب من مجالك', 'يصل لجمهورك', 'يلتزم بموعده'];
  var COL = ['#93C5FD', '#FFFFFF', '#2563EB', '#FFFFFF'];
  var typed = document.getElementById('s-typed');
  var caret = document.getElementById('s-caret');
  if (!reduce && typed) {
    var i = 0, n = PH[0].length, del = false;
    var tick = function () {
      var d = 90;
      if (!del) {
        if (n < PH[i].length) { n += 1; d = n === PH[i].length ? 1700 : 95; }
        else { del = true; n -= 1; d = 45; }
      } else if (n > 0) { n -= 1; d = 45; }
      else { del = false; i = (i + 1) % PH.length; d = 320; }
      typed.textContent = PH[i].slice(0, n);
      typed.style.color = COL[i];
      caret.style.background = COL[i];
      setTimeout(tick, d);
    };
    setTimeout(tick, 1800);
  }

  /* ---------- Count-up numbers ---------- */
  var stats = document.getElementById('s-stats');
  if (!reduce && stats && 'IntersectionObserver' in window) {
    var els = [[document.getElementById('s-stat-1'), 1050], [document.getElementById('s-stat-2'), 35]];
    var sio = new IntersectionObserver(function (es) {
      if (!es.some(function (e) { return e.isIntersecting; })) return;
      sio.disconnect();
      var t0 = performance.now();
      els.forEach(function (x) { x[0].textContent = '0'; });
      var step = function (t) {
        var p = Math.min(1, (t - t0) / 1600), e = 1 - Math.pow(1 - p, 3);
        els.forEach(function (x) { x[0].textContent = Math.round(x[1] * e); });
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.4 });
    sio.observe(stats);
  }

  /* ---------- Falling chips ---------- */
  var pit = document.getElementById('s-pit');
  if (reduce || !pit || !window.Matter || !('IntersectionObserver' in window)) return;
  var visible = true, started = false;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      visible = e.isIntersecting;
      if (e.isIntersecting && !started) { started = true; start(); }
    });
  }, { threshold: 0.35 });
  io.observe(pit);

  function start() {
    var M = window.Matter;
    var chips = Array.prototype.slice.call(pit.querySelectorAll('.s-chip'));
    var sizes = chips.map(function (el) { return { w: el.offsetWidth, h: el.offsetHeight }; });
    pit.classList.add('s-pit-live');
    var W = pit.clientWidth, H = pit.clientHeight;
    var engine = M.Engine.create();
    engine.gravity.y = 1.1;
    var opts = { isStatic: true, friction: 0.6 };
    var floor = M.Bodies.rectangle(W / 2, H + 40, 10000, 80, opts);
    var left = M.Bodies.rectangle(-40, H - 3000, 80, 6000, opts);
    var right = M.Bodies.rectangle(W + 40, H - 3000, 80, 6000, opts);
    var ceiling = M.Bodies.rectangle(W / 2, -2400, 10000, 80, opts);
    var bodies = chips.map(function (el, k) {
      var w = sizes[k].w, h = sizes[k].h;
      var x = Math.min(Math.max(w / 2 + 4, w / 2 + Math.random() * Math.max(1, W - w)), W - w / 2 - 4);
      var y = -h - k * 52 - Math.random() * 40;
      return M.Bodies.rectangle(x, y, w, h, {
        chamfer: { radius: Math.max(1, h / 2 - 1) }, restitution: 0.35, friction: 0.45,
        frictionAir: 0.012, density: 0.002, angle: (Math.random() - 0.5) * 0.9
      });
    });
    M.Composite.add(engine.world, [floor, left, right, ceiling].concat(bodies));

    var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (!coarse) {
      var mouse = M.Mouse.create(pit);
      mouse.element.removeEventListener('wheel', mouse.mousewheel);
      mouse.element.removeEventListener('touchmove', mouse.mousemove);
      mouse.element.removeEventListener('touchstart', mouse.mousedown);
      mouse.element.removeEventListener('touchend', mouse.mouseup);
      window.addEventListener('mouseup', mouse.mouseup);
      M.Composite.add(engine.world, M.MouseConstraint.create(engine, {
        mouse: mouse, constraint: { stiffness: 0.18, render: { visible: false } }
      }));
    }

    window.addEventListener('resize', function () {
      W = pit.clientWidth;
      M.Body.setPosition(right, { x: W + 40, y: right.position.y });
      bodies.forEach(function (b) {
        if (b.position.x > W - 10) M.Body.setPosition(b, { x: W - 40, y: b.position.y - 40 });
      });
    });

    var MAXA = 1.45; /* never past ~83°, so text is never upside down */
    function clampAngles() {
      for (var k = 0; k < bodies.length; k++) {
        var b = bodies[k];
        if (b.angle > MAXA || b.angle < -MAXA) {
          M.Body.setAngle(b, b.angle > 0 ? MAXA : -MAXA);
          M.Body.setAngularVelocity(b, 0);
        }
      }
    }
    function paint() {
      for (var k = 0; k < bodies.length; k++) {
        var b = bodies[k], s = sizes[k];
        chips[k].style.transform = 'translate(' + (b.position.x - s.w / 2) + 'px,' + (b.position.y - s.h / 2) + 'px) rotate(' + b.angle + 'rad)';
      }
    }
    paint();
    (function loop() {
      if (visible) { M.Engine.update(engine, 1000 / 60); clampAngles(); paint(); }
      requestAnimationFrame(loop);
    })();
  }
})();
