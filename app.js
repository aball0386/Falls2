function buildForm() {
  buildFastTest();
  buildIstumble();
  buildObsSection();
  buildGCS();
  buildAVPU();   
  buildFRAT();  
  setupTooltips();
}

function createOption(value, text, selected = false) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  if (selected) option.selected = true;
  return option;
}

function createSelect(id, options) {
  const select = document.createElement("select");
  select.id = id;
  options.forEach(opt => select.appendChild(createOption(opt.value, opt.text)));
  return select;
}

function createLabel(text, element, description) {
  const label = document.createElement("label");
  label.textContent = text;
  label.appendChild(document.createElement("br"));
  label.appendChild(element);
  if (description) {
    const small = document.createElement("small");
    small.textContent = description;
    label.appendChild(document.createElement("br"));
    label.appendChild(small);
  }
  return label;
}

function getVal(id) {
  return document.getElementById(id)?.value || "";
}

function setInputColorByValue(input, value, thresholds) {
  input.classList.remove("red", "orange", "green");
  if (value === "") return;
  let v = parseFloat(value);
  if (isNaN(v)) return;
  if (thresholds.red(v)) input.classList.add("red");
  else if (thresholds.orange(v)) input.classList.add("orange");
  else input.classList.add("green");
}

function buildFastTest() {
  const container = document.getElementById("fast-test");
  const questions = [
    { id: "face", text: "Facial weakness", desc: "Ask the patient to smile or show teeth. Look for NEW lack of symmetry." },
    { id: "arm", text: "Arm weakness", desc: "Ask the patient to lift their arms together and hold for 5 seconds. Does one arm drift or fall down?" },
    { id: "speech", text: "Speech", desc: "Ask the patient to repeat a phrase. Assess for slurring or difficulty." },
    { id: "time", text: "Time", desc: "Note the time of onset and pass to hospital." }
  ];

  questions.forEach(q => {
    const select = createSelect(`fast-${q.id}`, [
      { value: "", text: "Select" },
      { value: "Yes", text: "Yes" },
      { value: "No", text: "No" },
      { value: "Unknown", text: "Unknown" }
    ]);
    container.appendChild(createLabel(q.text, select, q.desc));

    select.addEventListener("change", evaluateFast);
  });

  const bloodThinnerSelect = createSelect("fast-bloodthinner", [
    { value: "", text: "Select" },
    { value: "Yes", text: "Yes" },
    { value: "No", text: "No" }
  ]);
  container.appendChild(createLabel("On blood thinners?", bloodThinnerSelect));

  bloodThinnerSelect.addEventListener("change", () => {
    const showAlert = bloodThinnerSelect.value === "Yes";
    const alertDiv = document.getElementById("bloodthinner-alert");
    const drugSelect = document.getElementById("bloodthinner-type");
    if (showAlert) {
      alertDiv.classList.remove("hidden");
      alertDiv.textContent = "⚠️ Patient is on blood thinners!";
      drugSelect.classList.remove("hidden");
      document.getElementById("bleed").value = "Yes";
      handleIstumbleInput("bleed", "Yes");
    } else {
      alertDiv.classList.add("hidden");
      drugSelect.classList.add("hidden");
    }
  });

  const alertDiv = document.createElement("div");
  alertDiv.id = "bloodthinner-alert";
  alertDiv.classList.add("hidden", "risk-result", "high-risk");
  container.appendChild(alertDiv);

  const bloodDrugs = [
    "Warfarin", "Aspirin", "Clopidogrel", "Ticagrelor", "Prasugrel",
    "Apixaban", "Rivaroxaban", "Dabigatran", "Edoxaban", "Heparin",
    "LMWH", "Fondaparinux"
  ];
  const drugSelect = createSelect("bloodthinner-type", [{ value: "", text: "Select Blood Thinner" }].concat(
    bloodDrugs.map(d => ({ value: d, text: d }))
  ));
  drugSelect.classList.add("hidden");
  container.appendChild(drugSelect);

  const result = document.createElement("div");
  result.id = "fast-result";
  result.className = "risk-result";
  container.appendChild(result);
}

function evaluateFast() {
  const face = getVal("fast-face");
  const arm = getVal("fast-arm");
  const speech = getVal("fast-speech");

  const result = document.getElementById("fast-result");
  if (face === "Yes" || arm === "Yes" || speech === "Yes") {
    result.textContent = "⚠️ FAST positive – potential stroke. Call emergency services.";
    result.classList.add("high-risk", "flashing");
    result.classList.remove("low-risk");
  } else {
    result.textContent = "✅ FAST negative.";
    result.classList.remove("high-risk", "flashing");
    result.classList.add("low-risk");
  }
}

function buildGcsSection() {
  const container = document.getElementById("gcs-section");
  const eyeOptions = [4, 3, 2, 1];
  const verbalOptions = [5, 4, 3, 2, 1];
  const motorOptions = [6, 5, 4, 3, 2, 1];

  container.appendChild(createLabel("Eye Opening (E)", createSelect("gcs-eye", eyeOptions.map(n => ({ value: n, text: `E${n}` })))));
  container.appendChild(createLabel("Verbal Response (V)", createSelect("gcs-verbal", verbalOptions.map(n => ({ value: n, text: `V${n}` })))));
  container.appendChild(createLabel("Motor Response (M)", createSelect("gcs-motor", motorOptions.map(n => ({ value: n, text: `M${n}` })))));

  ["gcs-eye", "gcs-verbal", "gcs-motor"].forEach(id => {
    document.getElementById(id).addEventListener("change", evaluateGcs);
  });

  const gcsResult = document.createElement("div");
  gcsResult.id = "gcs-result";
  gcsResult.className = "risk-result";
  container.appendChild(gcsResult);
}

function evaluateGcs() {
  const e = parseInt(getVal("gcs-eye")) || 0;
  const v = parseInt(getVal("gcs-verbal")) || 0;
  const m = parseInt(getVal("gcs-motor")) || 0;

  const result = document.getElementById("gcs-result");
  if (e && v && m) {
    const total = e + v + m;
    result.textContent = `🧠 GCS Score: ${total}`;
    if (total <= 8) {
      result.classList.add("high-risk");
      document.getElementById("unconscious").value = "Yes";
      handleIstumbleInput("unconscious", "Yes");
    } else {
      result.classList.remove("high-risk");
    }
  } else {
    result.textContent = "Fill all GCS fields.";
    result.classList.remove("high-risk");
  }
}

function buildAvpuSection() {
  const container = document.getElementById("avpu-section");
  const avpuSelect = createSelect("avpu-scale", [
    { value: "", text: "Select" },
    { value: "Alert", text: "Alert" },
    { value: "Voice", text: "Responds to Voice" },
    { value: "Pain", text: "Responds to Pain" },
    { value: "Unresponsive", text: "Unresponsive" }
  ]);

  avpuSelect.addEventListener("change", evaluateAvpu);
  container.appendChild(createLabel("AVPU", avpuSelect));

  const result = document.createElement("div");
  result.id = "avpu-result";
  result.className = "risk-result";
  container.appendChild(result);
}

function evaluateAvpu() {
  const val = getVal("avpu-scale");
  const result = document.getElementById("avpu-result");
  if (val === "Unresponsive") {
    result.textContent = "⚠️ Patient unresponsive – emergency!";
    result.classList.add("high-risk", "flashing");
    document.getElementById("unconscious").value = "Yes";
    handleIstumbleInput("unconscious", "Yes");
  } else if (val) {
    result.textContent = `AVPU: ${val}`;
    result.classList.remove("high-risk", "flashing");
  } else {
    result.textContent = "Select AVPU level.";
    result.classList.remove("high-risk", "flashing");
  }
}

function buildObsSection() {
  const container = document.getElementById("obs-section");
  const obsButtonContainer = document.createElement("div");
  obsButtonContainer.id = "obs-buttons";

  ["OBS1", "OBS2", "OBS3"].forEach((label, index) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.addEventListener("click", () => renderObsSet(label));
    obsButtonContainer.appendChild(button);
  });

  container.appendChild(obsButtonContainer);
  renderObsSet("OBS1");

  const timerButton = document.createElement("button");
  timerButton.textContent = "⏱️ Start 15 Minute Observation Timer";
  timerButton.addEventListener("click", startObsTimer);
  container.appendChild(timerButton);

  const timerDisplay = document.createElement("div");
  timerDisplay.id = "obs-timer-display";
  timerDisplay.className = "risk-result";
  container.appendChild(timerDisplay);
}

function renderObsSet(label) {
  const container = document.getElementById("obs-section");
  container.querySelectorAll(".obs-set").forEach(el => el.remove());

  const obsDiv = document.createElement("div");
  obsDiv.className = "obs-set";

  const fields = [
    { id: "temp", text: "Temperature", thresholds: { red: v => v > 39 || v < 35, orange: v => v >= 38 && v <= 39 } },
    { id: "pulse", text: "Pulse", thresholds: { red: v => v < 50 || v > 120, orange: v => v >= 100 && v <= 120 } },
    { id: "bp", text: "Blood Pressure", thresholds: { red: v => v < 90 || v > 180, orange: v => v >= 140 && v <= 180 } },
    { id: "spo2", text: "SpO2", thresholds: { red: v => v < 90, orange: v => v >= 90 && v < 94 } },
    { id: "rr", text: "Respiratory Rate", thresholds: { red: v => v < 10 || v > 30, orange: v => v >= 21 && v <= 30 } }
  ];

  fields.forEach(f => {
    const input = document.createElement("input");
    input.type = "number";
    input.id = `${label.toLowerCase()}-${f.id}`;
    input.placeholder = f.text;
    input.addEventListener("input", () => {
      setInputColorByValue(input, input.value, f.thresholds);
    });
    obsDiv.appendChild(createLabel(f.text, input));
  });

  container.appendChild(obsDiv);
}

function startObsTimer() {
  let timeLeft = 15 * 60;
  const display = document.getElementById("obs-timer-display");
  const interval = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    display.textContent = `⏳ ${minutes}:${seconds < 10 ? "0" : ""}${seconds} until recheck`;
    timeLeft--;

    if (timeLeft < 0) {
      clearInterval(interval);
      display.textContent = "🔔 Time to recheck observations!";
      display.classList.add("high-risk", "flashing");
      new Audio("data:audio/wav;base64,UklGRiQAA...").play();
    }
  }, 1000);
}

function buildIstumble() {
  const container = document.getElementById("istumble-content");
  const questions = [
    { id: "pain", text: "Intense Pain?" },
    { id: "spine", text: "Spinal Pain?" },
    { id: "tingling", text: "Tingling/Numbness?" },
    { id: "unconscious", text: "Unconscious or Altered Mental State?" },
    { id: "mobility", text: "Mobility Impaired?" },
    { id: "bleed", text: "Bleeding or Anticoagulant use?" },
    { id: "unwell", text: "Generally Unwell?" },
    { id: "trauma", text: "Signs of Trauma?" }
  ];

  questions.forEach(q => {
    const select = createSelect(q.id, [
      { value: "", text: "Select" },
      { value: "Yes", text: "Yes" },
      { value: "No", text: "No" },
      { value: "Unknown", text: "Unknown" }
    ]);
    select.addEventListener("change", () => handleIstumbleInput(q.id, select.value));

    const comment = document.createElement("textarea");
    comment.id = `${q.id}-comment`;
    comment.placeholder = `Comment on ${q.text}`;
    comment.classList.add("hidden");

    container.appendChild(createLabel(q.text, select));
    container.appendChild(comment);
  });

  const resultDiv = document.createElement("div");
  resultDiv.id = "istumble-result";
  resultDiv.className = "risk-result";
  container.appendChild(resultDiv);
}

function handleIstumbleInput(id, val) {
  const commentBox = document.getElementById(`${id}-comment`);
  const result = document.getElementById("istumble-result");

  if (val === "Yes") {
    commentBox.classList.remove("hidden");
    result.textContent = `⚠️ Red Flag: ${id.replace("-", " ")} answered YES`;
    result.classList.add("high-risk", "flashing");
    new Audio("data:audio/wav;base64,UklGRiQAA...").play();
  } else {
    commentBox.classList.add("hidden");
    commentBox.value = "";
    evaluateIstumble();
  }
}

function evaluateIstumble() {
  const fields = ["pain", "spine", "tingling", "unconscious", "mobility", "bleed", "unwell", "trauma"];
  const result = document.getElementById("istumble-result");
  const hasYes = fields.some(id => getVal(id) === "Yes");

  if (hasYes) {
    result.textContent = "⚠️ ISTUMBLE Red Flags Present. Do Not Lift.";
    result.className = "risk-result high-risk flashing";
  } else {
    result.textContent = "✅ ISTUMBLE Clear. Proceed to lift.";
    result.className = "risk-result low-risk";
  }
}

function buildFratSection() {
  const container = document.getElementById("frat-section");
  const questions = [
    { id: "frat-falls", text: "Previous falls in last 12 months", options: [[0, "None"], [5, "1 fall"], [10, "2+ falls"]] },
    { id: "frat-medication", text: "On 4+ medications", options: [[0, "No"], [5, "Yes"]] },
    { id: "frat-gait", text: "Impaired gait or balance", options: [[0, "No"], [5, "Yes"]] },
    { id: "frat-cognition", text: "Cognitive impairment", options: [[0, "No"], [5, "Yes"]] }
  ];

  questions.forEach(q => {
    const select = createSelect(q.id, q.options.map(([val, label]) => ({ value: val, text: label })));
    container.appendChild(createLabel(q.text, select));
  });

  const btn = document.createElement("button");
  btn.textContent = "Calculate FRAT Score";
  btn.addEventListener("click", evaluateFrat);
  container.appendChild(btn);

  const result = document.createElement("div");
  result.id = "frat-comments";
  result.className = "risk-result";
  container.appendChild(result);
}

function evaluateFrat() {
  const ids = ["frat-falls", "frat-medication", "frat-gait", "frat-cognition"];
  const total = ids.reduce((sum, id) => sum + parseInt(getVal(id) || "0", 10), 0);
  const result = document.getElementById("frat-comments");

  if (total >= 15) {
    result.textContent = `FRAT Score: ${total} – High Risk`;
    result.className = "risk-result high-risk";
  } else if (total >= 5) {
    result.textContent = `FRAT Score: ${total} – Medium Risk`;
    result.className = "risk-result medium-risk";
  } else {
    result.textContent = `FRAT Score: ${total} – Low Risk`;
    result.className = "risk-result low-risk";
  }
}

function buildSummaryCard() {
  const card = document.getElementById("card-view");
  card.innerHTML = "";

  const summary = document.createElement("div");
  summary.innerHTML = `
    <h3>FAST Test</h3>
    Face: ${getVal("fast-face")}<br>
    Arm: ${getVal("fast-arm")}<br>
    Speech: ${getVal("fast-speech")}<br>
    Time: ${getVal("fast-time")}<br>
    On Blood Thinners: ${getVal("fast-bloodthinner")} (${getVal("bloodthinner-type")})
    
    <h3>GCS</h3>
    Eye: ${getVal("gcs-eye")}<br>
    Verbal: ${getVal("gcs-verbal")}<br>
    Motor: ${getVal("gcs-motor")}

    <h3>AVPU</h3>
    ${getVal("avpu-scale")}

    <h3>ISTUMBLE</h3>
    ${["pain", "spine", "tingling", "unconscious", "mobility", "bleed", "unwell", "trauma"]
      .map(id => `${id.toUpperCase()}: ${getVal(id)} ${getVal(id + "-comment") ? " - " + getVal(id + "-comment") : ""}`)
      .join("<br>")}

    <h3>FRAT</h3>
    ${document.getElementById("frat-comments").textContent}
  `;

  card.appendChild(summary);

  const backBtn = document.createElement("button");
  backBtn.textContent = "⬅ Back";
  backBtn.addEventListener("click", () => {
    card.classList.add("hidden");
    document.getElementById("main-form").classList.remove("hidden");
  });

  card.appendChild(backBtn);
  card.classList.remove("hidden");
  document.getElementById("main-form").classList.add("hidden");
}

// Summary, Settings, and Medicines button handlers
document.getElementById("summaryBtn").addEventListener("click", buildSummaryCard);

document.getElementById("settingsBtn").addEventListener("click", () => {
  const container = document.getElementById("settings");
  container.innerHTML = `
    <label><input type="checkbox" id="dark-mode"> Dark Mode</label><br>
    <label><input type="checkbox" id="compact-mode"> Compact Mode</label><br>
    <button onclick="saveAppSettings()">Save</button>
  `;
});

function saveAppSettings() {
  const dark = document.getElementById("dark-mode").checked;
  const compact = document.getElementById("compact-mode").checked;
  localStorage.setItem("dark", dark);
  localStorage.setItem("compact", compact);
  applyAppSettings();
}

function applyAppSettings() {
  const dark = localStorage.getItem("dark") === "true";
  const compact = localStorage.getItem("compact") === "true";
  document.body.classList.toggle("dark", dark);
  document.body.classList.toggle("compact", compact);
}

window.onload = () => {
  buildForm();
  document.getElementById("main-form").classList.remove("hidden");
};




