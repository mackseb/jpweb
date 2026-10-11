/*
 * Staff: canvas renderer for the five staff lines and the voice visualisations.
 *
 *   new Staff(canvas, { mode, ... })
 *   modes: "lines"       five lines that bend and resonate with the sung pitch
 *          "score"       lines plus fixed notes (repertoire), hover + pluck
 *          "spectrogram" Klangschrift: scrolling spectrogram in engraved hatching
 *          "overtones"   Obertöne: harmonic comb of the sung pitch
 *   options on "lines"/"score": trace (Melodiespur), drift (flowing idle notes), clef, mouse
 *
 * The five lines are real pitches of the treble staff: E4 G4 B4 D5 F5. A line
 * resonates most when the voice sings near its pitch. All instances share one
 * animation loop and read the same analyser from DemoAudio.
 */
(function () {
  var A = window.DemoAudio;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var LINE_MIDI = [64, 67, 71, 74, 77];
  // Natural notes from A3 upward; E4 (the bottom line) is step 0, each step is half a line gap.
  var STEP0 = -4;
  var NATURALS = [57, 59, 60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84, 86, 88];
  function stepOf(m) {
    if (m <= NATURALS[0]) return STEP0;
    for (var i = 0; i < NATURALS.length - 1; i++) {
      if (m < NATURALS[i + 1]) return STEP0 + i + (m - NATURALS[i]) / (NATURALS[i + 1] - NATURALS[i]);
    }
    return STEP0 + NATURALS.length - 1;
  }
  function isNatural(m) { return [0, 2, 4, 5, 7, 9, 11].indexOf(((m % 12) + 12) % 12) > -1; }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  // German Helmholtz names (c′ = C4, h = B) or scientific names (A4)
  var DE = ["c", "cis", "d", "dis", "e", "f", "fis", "g", "gis", "a", "ais", "h"];
  var EN = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  var PRIMES = ["", "′", "″", "‴", "⁗"];
  function noteName(m) {
    m = Math.round(m);
    var pc = ((m % 12) + 12) % 12, oct = Math.floor(m / 12) - 1;
    var lang = window.I18N ? window.I18N.lang : "de";
    if (lang === "en") return EN[pc] + oct;
    var p = oct - 3;
    if (p >= 1) return DE[pc] + PRIMES[Math.min(p, 4)];
    if (p === 0) return DE[pc];
    return DE[pc].charAt(0).toUpperCase() + DE[pc].slice(1);
  }

  /* ---------- shared audio state, read once per frame ---------- */
  var G = { specS: new Float32Array(96), spec: null, fdb: null, fdbOk: false, wave: null, loud: 0, energy: 0, pitch: null };
  function readAudio() {
    var an = A && A.analyser, playing = A && A.playing > -1;
    G.pitch = playing && !reduce ? A.pitch() : null;
    if (!an || !playing || reduce) {
      for (var k = 0; k < G.specS.length; k++) G.specS[k] *= .92;
      G.loud *= .9;
      G.energy *= .9;
      G.fdbOk = false;
      return;
    }
    var n = an.frequencyBinCount, nyq = an.context.sampleRate / 2;
    if (!G.spec || G.spec.length !== n) { G.spec = new Uint8Array(n); G.fdb = new Float32Array(n); G.wave = new Float32Array(an.fftSize); }
    an.getByteFrequencyData(G.spec);
    an.getFloatFrequencyData(G.fdb);
    an.getFloatTimeDomainData(G.wave);
    G.fdbOk = true;
    var e = 0;
    for (var b = 0; b < G.specS.length; b++) {
      var f = 120 * Math.pow(5000 / 120, b / (G.specS.length - 1));
      var v = Math.pow(G.spec[Math.min(n - 1, Math.round(f / nyq * n))] / 255, 1.6);
      G.specS[b] += (v - G.specS[b]) * .35;
      e += G.specS[b];
    }
    G.energy = clamp(e / G.specS.length * 3, 0, 1);
    var s = 0;
    for (var i = 0; i < G.wave.length; i++) s += G.wave[i] * G.wave[i];
    var rms = clamp(Math.sqrt(s / G.wave.length) * 3.2, 0, 1);
    G.loud += (rms - G.loud) * .25;
  }
  function specAt(u) {
    var p = u * (G.specS.length - 1), i = Math.floor(p), t = p - i;
    return G.specS[i] * (1 - t) + (G.specS[Math.min(G.specS.length - 1, i + 1)] || 0) * t;
  }
  // Magnitude 0..1 at a frequency (max of three bins, from dB)
  function magAt(f) {
    if (!G.fdbOk) return 0;
    var an = A.analyser, n = G.fdb.length, i = Math.round(f / (an.context.sampleRate / 2) * n);
    if (i < 1 || i >= n - 1) return 0;
    var v = Math.max(G.fdb[i - 1], G.fdb[i], G.fdb[i + 1]);
    return clamp((v + 92) / 70, 0, 1);
  }

  /* ---------- Staff ---------- */
  function Staff(canvas, opt) {
    this.c = canvas;
    this.g = canvas.getContext("2d");
    this.o = Object.assign({
      mode: "lines", color: "12,12,12", alpha: .5, lineWidth: 1, gap: 10, mid: .5, padL: 0, padR: 0,
      resonate: 1, ripple: 0, idle: .6, mouse: 0, sigma: 80, clef: false, clefX: 0, drift: 0,
      trace: false, traceWidth: 2, penX: .78, speed: .09, penLabel: false, headScale: 1, vibrato: 1,
      notes: null, onHover: null, layout: null
    }, opt);
    this.res = [0, 0, 0, 0, 0];
    this.plucks = [];
    this.trail = [];
    this.heads = [];
    this.lastIdx = -1;
    this.harm = new Float32Array(17);
    this.f0 = 0;
    this.active = -1;
    this.mx = this.my = this.tx = this.ty = -9999;
    this.push = 0;
    this.inside = false;
    this.visible = true;
    this.dirty = true;
    var self = this, host = this.o.host || canvas;
    host.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      self.tx = e.clientX - r.left;
      self.ty = e.clientY - r.top;
      self.inside = true;
      if (self.mx < -9000) { self.mx = self.tx; self.my = self.ty; }
      if (self.o.mode === "score") self.hover(self.tx, self.ty);
      self.dirty = true;
    });
    host.addEventListener("pointerleave", function () {
      self.inside = false;
      if (self.o.mode === "score") self.hover(-9999, -9999);
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { self.visible = en[0].isIntersecting; }).observe(canvas);
    }
    Staff.all.push(this);
    this.resize();
  }

  Staff.prototype.resize = function () {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr;
    this.w = this.c.clientWidth;
    this.h = this.c.clientHeight;
    this.c.width = Math.max(1, Math.round(this.w * dpr));
    this.c.height = Math.max(1, Math.round(this.h * dpr));
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var L = this.o.layout ? this.o.layout(this.w, this.h) : { gap: this.o.gap, mid: this.o.mid * this.h };
    this.gap = L.gap;
    this.mid = L.mid;
    this.bottom = this.mid + 2 * this.gap;
    if (this.o.mode === "spectrogram") {
      this.off = document.createElement("canvas");
      this.off.width = this.c.width;
      this.off.height = this.c.height;
    }
    this.dirty = true;
  };

  Staff.prototype.setMode = function (mode) {
    this.o.mode = mode;
    this.trail = [];
    this.heads = [];
    this.resize();
  };

  Staff.prototype.yOf = function (step) { return this.bottom - step * this.gap / 2; };

  Staff.prototype.pluck = function (x, amp) {
    if (reduce) return;
    this.plucks.push({ x: x, a: amp == null ? this.gap * .7 : amp, t: performance.now() });
    this.dirty = true;
  };

  // Vertical displacement of line k (0 = bottom) at x
  Staff.prototype.offset = function (k, x, u, t) {
    var o = this.o, off = 0;
    if (!reduce) off += Math.sin(x * .004 + t * .0005 + k * .8) * o.idle;
    var amp = this.res[k] * o.resonate * this.gap * .9;
    if (amp > .05) off += amp * Math.sin(Math.PI * (2 + k) * u) * Math.cos(t * (.010 + .0025 * k));
    if (o.ripple && G.energy > .001) off += specAt(u) * o.ripple * Math.sin(Math.PI * u) * Math.sin(x * .02 - t * .011 + k * .9);
    if (o.mouse && this.push > .01) {
      var y0 = this.yOf(2 * k), dx = x - this.mx, dy = y0 - this.my;
      var f = Math.exp(-(dx * dx + dy * dy) / (2 * o.sigma * o.sigma));
      off += dy / (Math.abs(dy) + 16) * f * this.push * o.mouse;
    }
    for (var i = 0; i < this.plucks.length; i++) {
      var p = this.plucks[i], age = t - p.t, d = x - p.x, wdt = this.gap * 3;
      off += p.a * Math.exp(-d * d / (2 * wdt * wdt)) * Math.exp(-age / 380) * Math.sin(age * .035 - Math.abs(d) * .06);
    }
    return off;
  };
  // Displacement at any staff step (spaces interpolate the neighbouring lines)
  Staff.prototype.offsetAtStep = function (step, x, t) {
    var u = (x - this.o.padL) / Math.max(1, this.w - this.o.padL - this.o.padR);
    var k = clamp(step / 2, 0, 4), k0 = Math.floor(k), k1 = Math.min(4, k0 + 1), f = k - k0;
    return this.offset(k0, x, u, t) * (1 - f) + this.offset(k1, x, u, t) * f;
  };

  Staff.prototype.draw = function (t) {
    var g = this.g, o = this.o;
    g.clearRect(0, 0, this.w, this.h);
    this.mx += (this.tx - this.mx) * .12;
    this.my += (this.ty - this.my) * .12;
    this.push += ((this.inside ? 1 : 0) - this.push) * .06;
    this.plucks = this.plucks.filter(function (p) { return t - p.t < 1400; });
    if (o.mode === "spectrogram") return this.drawSpectrogram(t);
    if (o.mode === "overtones") return this.drawOvertones(t);
    this.updateResonance();
    this.drawLines(t);
    if (o.clef) this.drawClef();
    if (o.mode === "score") this.drawScore(t);
    if (o.drift) this.drawDrift(t);
    if (o.trace) this.drawTrace(t);
  };

  Staff.prototype.updateResonance = function () {
    var p = G.pitch;
    for (var k = 0; k < 5; k++) {
      var target = G.energy * .12;
      if (p) {
        var ds = p.midi - LINE_MIDI[k];
        target = Math.max(target, G.loud * Math.exp(-ds * ds / (2 * 1.5 * 1.5)));
      }
      this.res[k] += (target - this.res[k]) * (target > this.res[k] ? .25 : .06);
    }
  };

  Staff.prototype.drawLines = function (t) {
    var g = this.g, o = this.o, x0 = o.padL, span = this.w - o.padL - o.padR;
    var P = Math.max(60, Math.round(span / 7));
    for (var k = 0; k < 5; k++) {
      var y0 = this.yOf(2 * k);
      g.strokeStyle = "rgba(" + o.color + "," + clamp(o.alpha + this.res[k] * .45, 0, 1).toFixed(3) + ")";
      g.lineWidth = o.lineWidth * (1 + this.res[k] * .6);
      g.beginPath();
      for (var j = 0; j <= P; j++) {
        var u = j / P, x = x0 + u * span, y = y0 + this.offset(k, x, u, t);
        if (j) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.stroke();
    }
  };

  Staff.prototype.drawClef = function () {
    var g = this.g;
    g.fillStyle = "rgba(" + this.o.color + ",.9)";
    // Music fonts set one staff space to a quarter em, with the clef's origin on the G line
    g.font = (this.gap * 4).toFixed(1) + 'px "Noto Music"';
    g.textBaseline = "alphabetic";
    g.fillText("𝄞", this.o.clefX, this.yOf(2));
  };

  Staff.prototype.head = function (x, y, scale, alpha) {
    var g = this.g, gp = this.gap * (scale || 1);
    g.fillStyle = "rgba(" + this.o.color + "," + (alpha == null ? 1 : alpha).toFixed(3) + ")";
    g.beginPath();
    g.ellipse(x, y, gp * .62, gp * .44, -.35, 0, Math.PI * 2);
    g.fill();
  };

  Staff.prototype.ledgers = function (x, step, alpha) {
    var g = this.g, s;
    g.strokeStyle = "rgba(" + this.o.color + "," + (alpha == null ? .8 : alpha).toFixed(3) + ")";
    g.lineWidth = this.o.lineWidth;
    g.beginPath();
    if (step >= 9.5) for (s = 10; s <= step + .01; s += 2) { g.moveTo(x - this.gap * 1.05, this.yOf(s)); g.lineTo(x + this.gap * 1.05, this.yOf(s)); }
    if (step <= -1.5) for (s = -2; s >= step - .01; s -= 2) { g.moveTo(x - this.gap * 1.05, this.yOf(s)); g.lineTo(x + this.gap * 1.05, this.yOf(s)); }
    g.stroke();
  };

  Staff.prototype.sharp = function (x, y, alpha, scale) {
    var g = this.g;
    g.fillStyle = "rgba(" + this.o.color + "," + alpha.toFixed(3) + ")";
    g.font = (this.gap * 2.6 * (scale || 1)).toFixed(1) + 'px "Noto Music", serif';
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("♯", x, y);
    g.textAlign = "start";
    g.textBaseline = "alphabetic";
  };

  // Clavier's flowing notes: a few heads drift along the staff, riding the lines
  Staff.prototype.drawDrift = function (t) {
    var o = this.o, span = this.w - o.padL - o.padR, steps = [1, 4, 6, 3, 7, 2, 5, 8];
    var fade = G.pitch ? .35 : 1;
    for (var i = 0; i < o.drift; i++) {
      var dur = 26000 + (i % 3) * 6000;
      var u = ((reduce ? 0 : t) / dur + i / o.drift + (i * .13)) % 1;
      var x = o.padL + span * (.1 + .88 * u), st = steps[(i * 3) % steps.length];
      var a = clamp(Math.min(u / .08, (1 - u) / .12), 0, 1) * .9 * fade;
      this.head(x, this.yOf(st) + this.offsetAtStep(st, x, t), 1, a);
    }
  };

  // Melodiespur: the sung pitch is written onto the staff; held notes leave heads
  Staff.prototype.drawTrace = function (t) {
    var g = this.g, o = this.o, span = this.w - o.padL - o.padR;
    var pen = o.padL + o.penX * span, p = G.pitch, playing = A && A.playing > -1;
    if (playing) this.trail.push({ t: t, s: p ? stepOf(p.note + (p.midi - p.note) * o.vibrato) : null });
    else this.lastIdx = -1;
    if (p && p.index !== this.lastIdx) {
      this.lastIdx = p.index;
      if (p.dur >= .45) this.heads.push({ t: t, m: p.note });
    }
    var self = this, xOf = function (pt) { return pen - (t - pt.t) * o.speed; };
    while (this.trail.length && xOf(this.trail[0]) < o.padL - 20) this.trail.shift();
    while (this.heads.length && xOf(this.heads[0]) < o.padL - 20) this.heads.shift();

    // keep the trace clear of the clef
    var clipX = o.clef ? o.clefX + this.gap * 3 : o.padL;
    g.save();
    g.beginPath();
    g.rect(clipX, 0, this.w - clipX, this.h);
    g.clip();
    g.lineCap = "round";
    g.lineJoin = "round";
    g.lineWidth = o.traceWidth;
    var started = false;
    g.beginPath();
    for (var i = 0; i < this.trail.length; i++) {
      var pt = this.trail[i];
      if (pt.s == null) { started = false; continue; }
      var x = xOf(pt), y = this.yOf(pt.s);
      if (!started) { g.moveTo(x, y); started = true; } else g.lineTo(x, y);
    }
    g.strokeStyle = "rgba(" + o.color + ",.9)";
    g.stroke();

    this.heads.forEach(function (hd) {
      var x = xOf(hd), a = clamp((x - clipX) / (span * .22), 0, 1);
      var nat = isNatural(hd.m), st = stepOf(nat ? hd.m : hd.m - 1);
      var y = self.yOf(st) + self.offsetAtStep(st, x, t);
      self.ledgers(x, st, .8 * a);
      self.head(x, y, o.headScale, a);
      if (!nat) self.sharp(x - self.gap * 1.6 * o.headScale, y, a, o.headScale);
    });
    g.restore();

    if (p) {
      var ps = stepOf(p.midi), py = this.yOf(ps);
      this.ledgers(pen, ps, .5);
      g.fillStyle = "rgba(" + o.color + ",1)";
      g.beginPath();
      g.arc(pen, py, Math.max(2.5, o.traceWidth * 1.6), 0, Math.PI * 2);
      g.fill();
      if (o.penLabel) {
        g.font = "500 12px " + (o.labelFont || "sans-serif");
        g.fillText(noteName(p.note), pen + 10, py - 10);
      }
    }
  };

  // Repertoire: fixed notes on the staff, one per role or work
  Staff.prototype.notePos = function (i) {
    var o = this.o, n = o.notes.length, x0 = o.padL + this.gap * 3.4, x1 = this.w - this.gap * 1.6;
    return x0 + (i + .5) * (x1 - x0) / n;
  };
  Staff.prototype.drawScore = function (t) {
    var g = this.g, o = this.o, n = o.notes.length, self = this;
    o.notes.forEach(function (st, i) {
      var x = self.notePos(i), y = self.yOf(st) + self.offsetAtStep(st, x, t), on = i === self.active;
      self.head(x, y, on ? 1.35 : 1, 1);
      var r = self.gap * .62 * (on ? 1.35 : 1) * .95;
      g.strokeStyle = "rgba(" + o.color + ",1)";
      g.lineWidth = 1.2;
      g.beginPath();
      if (st < 4) { g.moveTo(x + r, y); g.lineTo(x + r, y - self.gap * 3.3); }
      else { g.moveTo(x - r, y); g.lineTo(x - r, y + self.gap * 3.3); }
      g.stroke();
      if (i % 4 === 3 && i < n - 1) {
        var bx = (x + self.notePos(i + 1)) / 2;
        g.lineWidth = 1;
        g.strokeStyle = "rgba(" + o.color + ",.45)";
        g.beginPath(); g.moveTo(bx, self.yOf(0)); g.lineTo(bx, self.yOf(8)); g.stroke();
      }
    });
    var ex = this.w - 2;
    g.strokeStyle = "rgba(" + o.color + ",.8)";
    g.lineWidth = 1; g.beginPath(); g.moveTo(ex - 5, this.yOf(0)); g.lineTo(ex - 5, this.yOf(8)); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(ex, this.yOf(0)); g.lineTo(ex, this.yOf(8)); g.stroke();
  };
  Staff.prototype.hover = function (x, y) {
    var o = this.o, best = -1;
    if (o.notes) {
      for (var i = 0; i < o.notes.length; i++) {
        if (Math.abs(x - this.notePos(i)) < this.gap * 2.4 && Math.abs(y - this.yOf(o.notes[i])) < this.gap * 4) best = i;
      }
    }
    if (best !== this.active) {
      this.setActive(best);
      if (o.onHover) o.onHover(best);
    }
  };
  Staff.prototype.setActive = function (i) {
    this.active = i;
    if (i > -1) this.pluck(this.notePos(i), this.gap * .9);
    this.dirty = true;
  };

  /* Klangschrift: scrolling spectrogram drawn as engraved hatching */
  var F_LOW = 150, F_HIGH = 6000;
  Staff.prototype.yOfFreq = function (f) { return this.h * (1 - Math.log(f / F_LOW) / Math.log(F_HIGH / F_LOW)); };
  Staff.prototype.drawSpectrogram = function () {
    var g = this.g, o = this.o, w = this.w, h = this.h, dpr = this.dpr;
    if (G.fdbOk) {
      var og = this.off.getContext("2d"), step = 2;
      og.setTransform(1, 0, 0, 1, 0, 0);
      og.globalCompositeOperation = "copy";
      og.drawImage(this.off, -step * dpr, 0);
      og.globalCompositeOperation = "source-over";
      og.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (var y = 2; y < h; y += 3) {
        var f = F_LOW * Math.pow(F_HIGH / F_LOW, 1 - y / h), m = magAt(f);
        if (m < .05) continue;
        og.strokeStyle = "rgba(" + o.color + "," + clamp(.2 + m, 0, 1).toFixed(3) + ")";
        og.lineWidth = .35 + m * m * 2.2;
        og.beginPath();
        og.moveTo(w - step - .5, y);
        og.lineTo(w, y);
        og.stroke();
      }
    }
    g.drawImage(this.off, 0, 0, w, h);
    g.font = "500 11px " + (o.labelFont || "sans-serif");
    for (var k = 0; k < 5; k++) {
      var ly = this.yOfFreq(mtof(LINE_MIDI[k]));
      g.strokeStyle = "rgba(" + o.color + ",.32)";
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, ly); g.lineTo(w, ly); g.stroke();
      g.fillStyle = "rgba(" + o.color + ",.6)";
      g.fillText(noteName(LINE_MIDI[k]), 8, ly - 4);
    }
  };

  /* Obertöne: the harmonic comb of the sung pitch, on five amplitude lines */
  Staff.prototype.drawOvertones = function () {
    var g = this.g, o = this.o, w = this.w, h = this.h, N = 16, p = G.pitch;
    if (p) this.f0 = mtof(p.midi);
    var left = 18, right = w - 18, base = h * .78, top = h * .16;
    var xOfN = function (n) { return left + (n - .5) / N * (right - left); };
    var font = o.labelFont || "sans-serif";
    for (var k = 0; k < 5; k++) {
      var y = base - k / 4 * (base - top);
      g.strokeStyle = "rgba(" + o.color + "," + (k ? .22 : .55) + ")";
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(left, y); g.lineTo(right, y); g.stroke();
    }
    if (this.f0) {
      var x1 = clamp(xOfN(2500 / this.f0), left, right), x2 = clamp(xOfN(3500 / this.f0), left, right);
      if (x2 > x1) {
        g.fillStyle = "rgba(" + o.color + ",.07)";
        g.fillRect(x1, top - 18, x2 - x1, base - top + 18);
        g.fillStyle = "rgba(" + o.color + ",.7)";
        g.font = "500 11px " + font;
        g.fillText(o.formantLabel || "", x1 + 6, top - 4);
      }
    }
    for (var n = 1; n <= N; n++) {
      var target = p ? magAt(n * this.f0) : 0;
      this.harm[n] += (target - this.harm[n]) * .3;
      var x = xOfN(n), ty = base - this.harm[n] * (base - top);
      g.strokeStyle = "rgba(" + o.color + ",.95)";
      g.lineWidth = n === 1 ? 2 : 1.2;
      g.beginPath(); g.moveTo(x, base); g.lineTo(x, ty); g.stroke();
      g.fillStyle = "rgba(" + o.color + ",1)";
      g.beginPath(); g.arc(x, ty, n === 1 ? 3 : 2.2, 0, Math.PI * 2); g.fill();
      g.fillStyle = "rgba(" + o.color + ",.6)";
      g.font = "500 10px " + font;
      g.textAlign = "center";
      g.fillText(n === 1 ? "f" : n + "f", x, base + 16);
      g.textAlign = "start";
    }
    if (p) {
      g.fillStyle = "rgba(" + o.color + ",.9)";
      g.font = "italic 400 22px " + (o.displayFont || "serif");
      g.fillText(noteName(p.note) + "  ·  " + Math.round(mtof(p.note)) + " Hz", left, 30);
    }
  };

  /* ---------- one loop for every staff on the page ---------- */
  Staff.all = [];
  Staff.hooks = [];
  Staff.reduce = reduce;
  Staff.noteName = noteName;
  Staff.audio = G;
  function frame(t) {
    readAudio();
    for (var i = 0; i < Staff.all.length; i++) {
      var s = Staff.all[i];
      if (!s.visible || s.w < 2) continue;
      if (reduce && !s.dirty) continue;
      s.draw(reduce ? 0 : t);
      s.dirty = false;
    }
    for (var j = 0; j < Staff.hooks.length; j++) Staff.hooks[j](t);
    requestAnimationFrame(frame);
  }
  Staff.start = function () {
    window.addEventListener("resize", function () { Staff.all.forEach(function (s) { s.resize(); }); });
    if (document.fonts && document.fonts.load) {
      document.fonts.load('20px "Noto Music"', "𝄞♯").then(function () { Staff.all.forEach(function (s) { s.dirty = true; }); }, function () {});
    }
    requestAnimationFrame(frame);
  };

  window.Staff = Staff;
})();
