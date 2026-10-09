/*
 * DemoAudio: placeholder sound for the prototypes.
 * Synthesizes a voice-like melody ("ah" vowel via formant filters, with
 * vibrato) over a soft piano accompaniment, so the players and visualizers
 * work before her real recordings exist. Everything runs through one
 * AnalyserNode, which the pages read for their animations. For the final
 * site an <audio> element is connected to the same analyser via
 * createMediaElementSource(), so the visuals react to her actual voice.
 */
(function () {
  var ctx = null, bus, analyser;
  var current = null;
  var listeners = [];

  // Chord voicings: [bass, [upper voices]] as MIDI note numbers
  var CH = {
    F: [41, [57, 60, 65]], C: [48, [55, 60, 64]], Bb: [46, [58, 62, 65]],
    Dm: [50, [57, 62, 65]], Gm: [43, [55, 58, 62]], A7: [45, [55, 61, 64]],
    G: [43, [55, 59, 62]], D: [50, [54, 57, 62]], D7: [50, [54, 57, 60]], Em: [40, [55, 59, 64]]
  };

  // Three short original phrases, eight bars each. [midi | null (rest), beats]
  var DEMOS = [
    { bpm: 66, chords: ["F", "C", "Bb", "C", "F", "Bb", "C", "F"], notes: [
      [69, 1], [72, 1], [77, 2], [76, 1], [74, 1], [72, 2], [70, 1], [69, 1], [67, 1], [65, 1], [67, 3], [null, 1],
      [69, 1], [72, 1], [81, 2], [79, 1], [77, 1], [74, 2], [72, 1], [74, 1], [76, 1], [79, 1], [77, 4]] },
    { bpm: 54, chords: ["Dm", "Gm", "A7", "Dm", "Dm", "Bb", "A7", "Dm"], notes: [
      [62, 1.5], [65, 0.5], [69, 2], [70, 1], [69, 1], [67, 2], [64, 1], [61, 1], [64, 1], [67, 1], [65, 3], [null, 1],
      [69, 1.5], [72, 0.5], [74, 2], [74, 1], [72, 1], [70, 2], [69, 1], [67, 1], [64, 1], [61, 1], [62, 4]] },
    { bpm: 80, chords: ["G", "D", "C", "D", "G", "Em", "D7", "G"], notes: [
      [67, 1], [71, 1], [74, 1], [79, 1], [78, 2], [76, 1], [74, 1], [76, 1], [74, 1], [72, 1], [71, 1], [69, 3], [null, 1],
      [71, 1], [74, 1], [79, 1], [81, 1], [83, 2], [79, 1], [76, 1], [78, 1], [76, 1], [74, 1], [72, 1], [71, 1], [74, 1], [79, 2]] }
  ];

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      var master = ctx.createGain();
      master.gain.value = 0.9;
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.ratio.value = 3;
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      master.connect(comp);
      comp.connect(analyser);
      analyser.connect(ctx.destination);

      bus = ctx.createGain();
      bus.connect(master);
      var verb = ctx.createConvolver();
      verb.buffer = impulse(3.2, 3);
      var wet = ctx.createGain();
      wet.gain.value = 0.3;
      bus.connect(verb);
      verb.connect(wet);
      wet.connect(master);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // A concert-hall-ish tail: decaying stereo noise.
  function impulse(sec, decay) {
    var rate = ctx.sampleRate, len = Math.floor(rate * sec);
    var buf = ctx.createBuffer(2, len, rate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  // Soft piano-like tone built from a few decaying partials.
  function pianoAt(midi, when, vel, out) {
    var f = mtof(midi);
    var g = ctx.createGain();
    var lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900 + vel * 4200;
    var len = 1.6 + Math.max(0, 76 - midi) * 0.035;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.32 * vel, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.12 * vel, when + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, when + len);
    [[1, 1], [2, 0.42], [3, 0.18], [4, 0.09], [6, 0.035]].forEach(function (p) {
      var o = ctx.createOscillator();
      var pg = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f * p[0] * (1 + 0.0007 * (p[0] - 1));
      pg.gain.value = p[1];
      o.connect(pg);
      pg.connect(g);
      o.start(when);
      o.stop(when + len + 0.05);
    });
    g.connect(lp);
    lp.connect(out || bus);
  }

  // Voice-like line: two detuned saws through "ah" formants, legato with delayed vibrato.
  function voiceAt(notes, bpm, t0, out) {
    var spb = 60 / bpm;
    var osc = ctx.createOscillator(), osc2 = ctx.createOscillator();
    osc.type = osc2.type = "sawtooth";
    osc2.detune.value = 5;
    var src = ctx.createGain();
    src.gain.value = 0.5;
    osc.connect(src);
    osc2.connect(src);

    var vib = ctx.createOscillator(), vibAmt = ctx.createGain();
    vib.frequency.value = 5.4;
    vibAmt.gain.value = 0;
    vib.connect(vibAmt);
    vibAmt.connect(osc.detune);
    vibAmt.connect(osc2.detune);

    var amp = ctx.createGain();
    amp.gain.value = 0;
    [[750, 1, 6], [1150, 0.55, 8], [2850, 0.4, 10], [3700, 0.2, 12]].forEach(function (F) {
      var bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = F[0];
      bp.Q.value = F[2];
      var fg = ctx.createGain();
      fg.gain.value = F[1] * 2.6;
      src.connect(bp);
      bp.connect(fg);
      fg.connect(amp);
    });
    amp.connect(out);

    var t = t0, fresh = true;
    notes.forEach(function (n) {
      var d = n[1] * spb;
      if (n[0] == null) {
        amp.gain.setTargetAtTime(0, t, 0.07);
        t += d;
        fresh = true;
        return;
      }
      var f = mtof(n[0]);
      if (fresh) {
        osc.frequency.setValueAtTime(f, t);
        osc2.frequency.setValueAtTime(f, t);
      } else {
        osc.frequency.setTargetAtTime(f, t, 0.03);
        osc2.frequency.setTargetAtTime(f, t, 0.03);
      }
      amp.gain.setTargetAtTime(0.5, t, fresh ? 0.06 : 0.03);
      if (d > 0.9) amp.gain.setTargetAtTime(0.75, t + 0.15, d * 0.35);
      amp.gain.setTargetAtTime(0.36, t + d - 0.08, 0.025);
      vibAmt.gain.setTargetAtTime(0, t, 0.03);
      vibAmt.gain.setTargetAtTime(d > 0.5 ? 32 : 10, t + 0.16, 0.18);
      fresh = false;
      t += d;
    });
    amp.gain.setTargetAtTime(0, t - 0.15, 0.25);
    [osc, osc2, vib].forEach(function (o) { o.start(t0); o.stop(t + 1.5); });
    return t;
  }

  function accompAt(chords, bpm, t0, out) {
    var bar = 4 * 60 / bpm;
    chords.forEach(function (name, i) {
      var c = CH[name], t = t0 + i * bar;
      pianoAt(c[0], t, 0.55, out);
      c[1].forEach(function (m, j) { pianoAt(m, t + 0.05 + j * 0.07, 0.32, out); });
      if (i < chords.length - 1) {
        c[1].forEach(function (m, j) { pianoAt(m, t + bar / 2 + j * 0.05, 0.22, out); });
      }
    });
  }

  function beats(i) {
    return DEMOS[i].notes.reduce(function (s, n) { return s + n[1]; }, 0);
  }

  function emit() {
    var idx = current ? current.index : -1;
    listeners.forEach(function (fn) { fn(idx); });
  }

  function play(i) {
    if (!ensure()) return null;
    stop(true);
    var D = DEMOS[i];
    var t0 = ctx.currentTime + 0.12;
    var g = ctx.createGain();
    g.connect(bus);
    var end = voiceAt(D.notes, D.bpm, t0, g);
    accompAt(D.chords, D.bpm, t0, g);
    var dur = end - t0 + 1.2;
    current = { index: i, t0: t0, duration: dur, gain: g };
    current.timer = setTimeout(function () {
      if (current && current.index === i) { current = null; emit(); }
    }, (dur + 0.3) * 1000);
    emit();
    return current;
  }

  function stop(silent) {
    if (!current) return;
    var c = current;
    current = null;
    clearTimeout(c.timer);
    c.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.06);
    setTimeout(function () { c.gain.disconnect(); }, 500);
    if (!silent) emit();
  }

  window.DemoAudio = {
    count: DEMOS.length,
    play: play,
    stop: function () { stop(false); },
    toggle: function (i) { if (current && current.index === i) stop(false); else play(i); },
    get playing() { return current ? current.index : -1; },
    get analyser() { return analyser || null; },
    // Plays one soft piano note now (used by interactive keys and notes).
    piano: function (midi, vel) {
      if (!ensure()) return;
      pianoAt(midi, ctx.currentTime + 0.005, vel || 0.6);
    },
    progress: function () {
      if (!current) return 0;
      return Math.min(1, Math.max(0, (ctx.currentTime - current.t0) / current.duration));
    },
    elapsed: function () {
      return current ? Math.max(0, ctx.currentTime - current.t0) : 0;
    },
    durationOf: function (i) { return beats(i) * 60 / DEMOS[i].bpm + 1.4; },
    // Loudness 0..1 from the analyser, for simple visuals.
    level: function () {
      if (!analyser || !current) return 0;
      var buf = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(buf);
      var s = 0;
      for (var i = 0; i < buf.length; i++) s += buf[i] * buf[i];
      return Math.min(1, Math.sqrt(s / buf.length) * 4);
    },
    onChange: function (fn) { listeners.push(fn); },
    formatTime: function (sec) {
      sec = Math.round(sec);
      return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
    }
  };
})();
