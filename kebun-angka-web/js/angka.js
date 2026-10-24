(function () {
  const kata = ['satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh'];
  const emoji = ['🍎','🐥','🎈','🦋','⭐','🐟','🍓','🐢','🚗','🌻'];
  const warna = ['#FF6B6B','#FF9F43','#FFC93C','#3DDC97','#2EC4D6','#4D96FF','#8E6CFF','#E56BC2','#F0715A','#27AE80'];
  const A = kata.map((k, i) => ({ n: i + 1, kata: k, emoji: emoji[i], warna: warna[i] }));

  const $ = (id) => document.getElementById(id);
  const rand = (n) => Math.floor(Math.random() * n);
  const mix = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);

  function say(text) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'id-ID'; u.rate = 0.85; u.pitch = 1.2;
    speechSynthesis.speak(u);
  }

  function konfeti() {
    ['🎉','⭐','🎈','🌟','🎊'].forEach((e) => {
      for (let i = 0; i < 4; i++) {
        const s = document.createElement('span');
        s.className = 'konfeti'; s.textContent = e;
        s.style.left = rand(95) + 'vw'; s.style.animationDelay = Math.random() * 0.5 + 's';
        document.body.appendChild(s); setTimeout(() => s.remove(), 2400);
      }
    });
  }

  function opsi(wadah, benar, jumlah, aksi) {
    const pil = [benar];
    while (pil.length < jumlah) { const x = A[rand(10)]; if (!pil.includes(x)) pil.push(x); }
    wadah.innerHTML = '';
    mix(pil).forEach((a) => {
      const b = document.createElement('button');
      b.className = 'opt'; b.textContent = a.n; b.style.setProperty('--c', a.warna);
      b.setAttribute('aria-label', a.kata);
      b.onclick = () => aksi(a, b);
      wadah.appendChild(b);
    });
  }

  /* ---------- Navigasi antar halaman ---------- */
  const halaman = ['belajar', 'hitung', 'kuis'];
  function buka() {
    const h = halaman.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'belajar';
    halaman.forEach((id) => { $(id).hidden = id !== h; });
    [...$('nav').children].forEach((a) => a.classList.toggle('on', a.hash === '#' + h));
    if (speechSynthesis) speechSynthesis.cancel();
    if (h === 'hitung') soalHitung();
    if (h === 'kuis') mulaiKuis();
  }
  window.addEventListener('hashchange', buka);

  /* ---------- Belajar ---------- */
  let cur = 0;
  const grid = $('grid');
  A.forEach((a, i) => {
    const t = document.createElement('button');
    t.className = 'tile'; t.textContent = a.n; t.style.setProperty('--c', a.warna);
    t.setAttribute('aria-label', 'Angka ' + a.kata);
    t.onclick = () => tampil(i, true);
    grid.appendChild(t);
  });

  function tampil(i, bicara) {
    cur = (i + 10) % 10; const a = A[cur];
    $('big').querySelector('.big-body').style.setProperty('--c', a.warna);
    $('numeral').textContent = a.n; $('word').textContent = a.kata;
    $('numeral').classList.remove('pop'); void $('numeral').offsetWidth; $('numeral').classList.add('pop');
    [...grid.children].forEach((t, k) => t.setAttribute('aria-current', k === cur));
    const o = $('objects'); o.innerHTML = '';
    for (let k = 1; k <= a.n; k++) {
      const b = document.createElement('button');
      b.className = 'obj tampil'; b.textContent = a.emoji; b.style.animationDelay = k * 0.08 + 's';
      b.setAttribute('aria-label', 'hitung ' + k);
      b.onclick = () => { b.classList.add('hitung'); say(A[k - 1].kata); };
      o.appendChild(b);
    }
    if (bicara) say(a.kata);
  }
  $('prev').onclick = () => tampil(cur - 1, true);
  $('next').onclick = () => tampil(cur + 1, true);
  $('dengar').onclick = () => {
    const a = A[cur], objs = [...$('objects').children];
    objs.forEach((b) => b.classList.remove('hitung'));
    objs.forEach((b, k) => setTimeout(() => b.classList.add('hitung'), k * 700));
    say(A.slice(0, a.n).map((x) => x.kata).join(', ') + '. Jadi ada ' + a.kata + '.');
  };

  /* ---------- Hitung ---------- */
  let ha, hSudah, hSelesai;
  function soalHitung() {
    ha = A[rand(10)]; hSudah = 0; hSelesai = false;
    $('h-msg').textContent = ''; $('h-lanjut').hidden = true;
    const f = $('h-field'); f.innerHTML = '';
    for (let k = 0; k < ha.n; k++) {
      const b = document.createElement('button');
      b.className = 'obj tampil'; b.textContent = ha.emoji; b.style.animationDelay = k * 0.06 + 's';
      b.setAttribute('aria-label', 'gambar ke-' + (k + 1));
      b.onclick = () => { if (b.classList.contains('hitung')) return; b.classList.add('hitung'); hSudah++; say(A[hSudah - 1].kata); };
      f.appendChild(b);
    }
    opsi($('h-options'), ha, 3, (p, btn) => {
      if (hSelesai) return;
      if (p.n === ha.n) {
        hSelesai = true; btn.classList.add('benar'); konfeti();
        $('h-msg').textContent = 'Hebat! Ada ' + ha.kata + '.'; say('Hebat! Ada ' + ha.kata);
        $('h-lanjut').hidden = false;
      } else {
        btn.classList.remove('salah'); void btn.offsetWidth; btn.classList.add('salah');
        $('h-msg').textContent = 'Belum tepat. Hitung lagi, ya.'; say('Hitung lagi, ya');
      }
    });
  }
  $('h-lanjut').onclick = soalHitung;

  /* ---------- Kuis ---------- */
  const TOTAL = 5; let ronde, skor, ka, kSelesai, kSalah;
  function mulaiKuis() {
    ronde = 0; skor = 0; $('k-stars').textContent = '';
    $('k-dengar').hidden = false; $('k-lanjut').textContent = 'Lanjut';
    soalKuis();
  }
  function soalKuis() {
    if (ronde === TOTAL) return akhirKuis();
    ka = A[rand(10)]; kSelesai = false; kSalah = false;
    $('k-msg').textContent = ''; $('k-lanjut').hidden = true;
    $('k-judul').textContent = 'Soal ' + (ronde + 1) + ' dari ' + TOTAL + ': mana angka ' + ka.kata + '?';
    opsi($('k-options'), ka, 4, (p, btn) => {
      if (kSelesai) return;
      if (p.n === ka.n) {
        kSelesai = true; btn.classList.add('benar'); konfeti();
        if (!kSalah) skor++;
        $('k-stars').textContent = '⭐'.repeat(skor);
        $('k-msg').textContent = 'Benar! Itu angka ' + ka.kata + '.'; say('Benar! Itu angka ' + ka.kata);
        ronde++; $('k-lanjut').hidden = false;
      } else {
        kSalah = true; btn.classList.remove('salah'); void btn.offsetWidth; btn.classList.add('salah');
        $('k-msg').textContent = 'Coba pilih lagi.'; say('Coba pilih lagi');
      }
    });
    say('Mana angka ' + ka.kata);
  }
  function akhirKuis() {
    $('k-judul').textContent = 'Selesai! Kamu dapat ' + skor + ' dari ' + TOTAL + ' bintang.';
    $('k-options').innerHTML = ''; $('k-dengar').hidden = true; $('k-msg').textContent = '';
    $('k-lanjut').textContent = 'Main lagi'; $('k-lanjut').hidden = false;
    if (skor >= 3) konfeti();
  }
  $('k-dengar').onclick = () => say('Mana angka ' + ka.kata);
  $('k-lanjut').onclick = () => (ronde === TOTAL ? mulaiKuis() : soalKuis());

  tampil(0, false);
  buka();
})();
