// script.js

// Image names = correct answers (and image filenames)
const NAMES = ["Cesar", "Diego", "Charly", "Elinore", "Gustave", "June", "Victoire","Isaure","Matteo","Alexandra", "Albane","Elliot"];
const EXT = "jpeg"; // your images are .jpeg

const grid = document.getElementById("cardGrid");

// ---- Sounds (no external files needed) ----
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// "catchiiing" style: quick rising notes
function playSuccess() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  const freqs = [660, 880, 1175]; // pleasant upward
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = f;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01 + i * 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18 + i * 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.03);
    osc.stop(now + 0.22 + i * 0.03);
  });
}

// "aaah" style: lower droop
function playFail() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.34);
}

// ---- Matching rule: 3+ consecutive letters anywhere in the answer ----
function isMatch(answer, guessRaw) {
  const guess = (guessRaw || "").trim().toLowerCase();
  const target = answer.toLowerCase();

  // Must be at least 3 consecutive letters, as requested
  if (guess.length < 3) return false;

  // Guess must appear consecutively in the target name
  return target.includes(guess);
}

function createCard(name) {
  const card = document.createElement("div");
  card.className = "card";

  // Flip block
  const flipWrap = document.createElement("div");
  flipWrap.className = "card-flip";

  const inner = document.createElement("div");
  inner.className = "card-inner";

  // FRONT
  const front = document.createElement("div");
  front.className = "card-face card-front";

  const img = document.createElement("img");
  const path = `pictures/${name}.${EXT}`;
  img.src = path;
  img.alt = name;

  // Mobile perf
  img.loading = "lazy";
  img.decoding = "async";

  img.onerror = () => {
    front.innerHTML = `
      <div style="
        width:100%; height:100%;
        display:flex; flex-direction:column;
        align-items:center; justify-content:center;
        background:#1a2635; color:#e8eef6;
        font-weight:700; padding:14px; text-align:center;">
        <div style="font-size:14px;">Image not found</div>
        <div style="font-size:12px; opacity:.85; margin-top:6px;">${path}</div>
      </div>
    `;
  };

  front.appendChild(img);

  // BACK
  const back = document.createElement("div");
  back.className = "card-face card-back";
  back.innerHTML = `
    <div>
      <div class="name">${name}</div>
      <div class="hint">Correct ✅</div>
    </div>
  `;

  inner.appendChild(front);
  inner.appendChild(back);
  flipWrap.appendChild(inner);

  // Answer UI
  const row = document.createElement("div");
  row.className = "answer-row";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Type at least 3 letters…";

  // Mobile-friendly typing (avoid weird auto-correct)
  input.autocomplete = "off";
  input.autocapitalize = "none";
  input.spellcheck = false;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "OK";

  row.appendChild(input);
  row.appendChild(btn);

  const msg = document.createElement("div");
  msg.className = "msg";

  // Check logic
  function check() {
    // ensure audio works (some browsers require interaction)
    getAudioCtx().resume?.();

    // already solved?
    if (card.classList.contains("is-flipped")) return;

    const guess = input.value;

    if (isMatch(name, guess)) {
      msg.textContent = "Correct!";
      msg.className = "msg ok";

      playSuccess();
      card.classList.add("is-flipped");

      // lock input after success
      input.disabled = true;
      btn.disabled = true;
    } else {
      msg.textContent = "Nope — try again.";
      msg.className = "msg no";

      playFail();

      // little shake feedback
      card.classList.add("shake");
      setTimeout(() => card.classList.remove("shake"), 300);
    }
  }

  btn.addEventListener("click", check);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") check();
  });

  // Assemble
  card.appendChild(flipWrap);
  card.appendChild(row);
  card.appendChild(msg);

  return card;
}

// Render all cards
NAMES.forEach((name) => {
  grid.appendChild(createCard(name));
});