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

window.onload = () => {
  applyAppSettings();
  buildForm();
  document.getElementById("main-form").classList.remove("hidden");
};

function buildFastTest() {
  const container = document.getElementById("fast-test");
  const fastItems = [
    { id: "fast-face", text: "Facial Weakness", desc: "Ask the patient to smile or show teeth. Look for NEW lack of symmetry." },
    { id: "fast-arm", text: "Arm Weakness", desc: "Ask the patient to lift their arms together and hold for 5 seconds. Does one arm drift or fall down?" },
    { id: "fast-speech", text: "Speech Issues", desc: "Ask the patient to repeat a phrase. Look for slurring, hesitation, or inability to speak." },
    { id: "fast-time", text: "Time of Onset", desc: "Note the time of onset, if known, and pass to hospital to expedite CT scan." }
  ];

  fastItems.forEach(item => {
    const select = createSelect(item.id, [
      { value: "Yes", text: "Yes" },
      { value: "No", text: "No" },
      { value: "Unknown", text: "Unknown" }
    ]);
    container.appendChild(createLabel(item.text, select, item.desc));
  });

  const alertBox = document.createElement("div");
  alertBox.id = "fast-result";
  container.appendChild(alertBox);

  const commentBox = document.createElement("textarea");
  commentBox.id = "fast-comments";
  commentBox.classList.add("hidden");
  commentBox.placeholder = "Add comments for positive FAST indicators...";
  container.appendChild(commentBox);

  const thinnerLabel = document.createElement("label");
  thinnerLabel.textContent = "Is the patient on blood thinners?";
  const thinnerSelect = createSelect("fast-thinner", [
    { value: "No", text: "No" },
    { value: "Yes", text: "Yes" }
  ]);
  thinnerSelect.addEventListener("change", () => {
    const val = thinnerSelect.value;
    const alertBox = document.getElementById("fast-thinner-alert");
    const dropdown = document.getElementById("fast-thinner-type");
    const bleedSelect = document.getElementById("bleed");

    if (val === "Yes") {
      alertBox.classList.remove("hidden");
      alertBox.classList.add("risk-result medium-risk flashing");
      alertBox.textContent = "⚠️ Patient is on Blood Thinners. Escalate as required.";
      dropdown.classList.remove("hidden");
      bleedSelect.value = "Yes";
      handleIstumbleInput("bleed", "Yes");
      const beep = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQgAAIA=");
      beep.play();
    } else {
      alertBox.classList.add("hidden");
      dropdown.classList.add("hidden");
      dropdown.value = "";
    }
  });

  thinnerLabel.appendChild(thinnerSelect);
  container.appendChild(thinnerLabel);

  const thinnerAlert = document.createElement("div");
  thinnerAlert.id = "fast-thinner-alert";
  thinnerAlert.classList.add("hidden");
  container.appendChild(thinnerAlert);

  const thinnerDropdown = createSelect("fast-thinner-type", [
    { value: "", text: "Select Blood Thinner" },
    { value: "Warfarin", text: "Warfarin" },
    { value: "Aspirin", text: "Aspirin" },
    { value: "Clopidogrel", text: "Clopidogrel" },
    { value: "Ticagrelor", text: "Ticagrelor" },
    { value: "Prasugrel", text: "Prasugrel" },
    { value: "Apixaban", text: "Apixaban (Eliquis)" },
    { value: "Rivaroxaban", text: "Rivaroxaban (Xarelto)" },
    { value: "Dabigatran", text: "Dabigatran (Pradaxa)" },
    { value: "Edoxaban", text: "Edoxaban" },
    { value: "Heparin", text: "Heparin" },
    { value: "LMWH", text: "Low Molecular Weight Heparin (LMWH)" },
    { value: "Fondaparinux", text: "Fondaparinux" }
  ]);
  thinnerDropdown.id = "fast-thinner-type";
  thinnerDropdown.classList.add("hidden");
  container.appendChild(thinnerDropdown);
}

function evaluateFast() {
  const f = getVal("fast-face");
  const a = getVal("fast-arm");
  const s = getVal("fast-speech");
  const result = document.getElementById("fast-result");
  const comments = document.getElementById("fast-comments");

  const fastAlert = [f, a, s].includes("Yes");

  if (fastAlert) {
    result.textContent = "⚠️ Suspected Stroke. Initiate Stroke Pathway and Update on NMA Message.";
    result.className = "risk-result high-risk flashing";
    comments.classList.remove("hidden");

    const beep = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQgAAIA=");
    beep.play();
  } else {
    result.textContent = "✅ No FAST indicators present.";
    result.className = "risk-result low-risk";
    comments.classList.add("hidden");
    comments.value = "";
  }
}

function buildGcsSection() {
  const container = document.createElement("div");
  container.id = "gcs-section";
  const form = document.getElementById("main-form");
  form.insertBefore(container, document.getElementById("obs-section"));

  const gcsCategories = [
    {
      id: "gcs-eye",
      label: "Eye Opening",
      options: [
        { value: 4, text: "Spontaneous" },
        { value: 3, text: "To speech" },
        { value: 2, text: "To pain" },
        { value: 1, text: "No response" }
      ],
      help: "Observe patient's spontaneous eye movement or reaction to stimuli."
    },
    {
      id: "gcs-verbal",
      label: "Verbal Response",
      options: [
        { value: 5, text: "Oriented" },
        { value: 4, text: "Confused" },
        { value: 3, text: "Inappropriate words" },
        { value: 2, text: "Incomprehensible sounds" },
        { value: 1, text: "No response" }
      ],
      help: "Talk to the patient and listen for clarity and relevance of responses."
    },
    {
      id: "gcs-motor",
      label: "Motor Response",
      options: [
        { value: 6, text: "Obeys commands" },
        { value: 5, text: "Localizes pain" },
        { value: 4, text: "Withdraws from pain" },
        { value: 3, text: "Flexion to pain (decorticate)" },
        { value: 2, text: "Extension to pain (decerebrate)" },
        { value: 1, text: "No response" }
      ],
      help: "Use pain stimulus if needed. Assess movement response."
    }
  ];

  gcsCategories.forEach(q => {
    const select = createSelect(q.id, q.options.map(o => ({ value: o.value, text: o.text })));
    select.addEventListener("change", evaluateGcs);
    container.appendChild(createLabel(q.label, select, q.help));
  });

  const gcsResult = document.createElement("div");
  gcsResult.id = "gcs-result";
  gcsResult.className = "risk-result";
  container.appendChild(gcsResult);
}

function evaluateGcs() {
  const eye = parseInt(getVal("gcs-eye") || 0);
  const verbal = parseInt(getVal("gcs-verbal") || 0);
  const motor = parseInt(getVal("gcs-motor") || 0);

  const total = eye + verbal + motor;
  const result = document.getElementById("gcs-result");

  if (eye && verbal && motor) {
    result.textContent = `🧠 GCS Score: ${total} (E${eye} V${verbal} M${motor})`;
    result.className = "risk-result";
  } else {
    result.textContent = "Please complete all GCS fields.";
    result.className = "risk-result medium-risk";
  }

  if (total < 15) {
    const unconscious = document.getElementById("unconscious");
    unconscious.value = "Yes";
    handleIstumbleInput("unconscious", "Yes");
  }

  if ([eye, verbal, motor].includes(1)) {
    const avpu = document.getElementById("avpu-scale");
    avpu.value = "Unresponsive";
    evaluateAvpu();
  }
}

function buildAvpuSection() {
  const container = document.createElement("div");
  container.id = "avpu-section";
  const form = document.getElementById("main-form");
  form.insertBefore(container, document.getElementById("obs-section"));

  const label = document.createElement("label");
  label.textContent = "AVPU Assessment";

  const select = createSelect("avpu-scale", [
    { value: "", text: "Select AVPU Level" },
    { value: "Alert", text: "Alert – Fully responsive" },
    { value: "Voice", text: "Voice – Responds to verbal stimuli" },
    { value: "Pain", text: "Pain – Responds to pain only" },
    { value: "Unresponsive", text: "Unresponsive – No response to any stimulus" }
  ]);

  select.addEventListener("change", evaluateAvpu);
  label.appendChild(select);
  container.appendChild(label);

  const resultBox = document.createElement("div");
  resultBox.id = "avpu-result";
  resultBox.className = "risk-result";
  container.appendChild(resultBox);
}

function evaluateAvpu() {
  const val = getVal("avpu-scale");
  const result = document.getElementById("avpu-result");
  const istumbleSelect = document.getElementById("unconscious");

  if (!val) {
    result.textContent = "Please select an AVPU level.";
    result.className = "risk-result medium-risk";
    return;
  }

  if (val === "Alert") {
    result.textContent = "✅ Patient is Alert.";
    result.className = "risk-result low-risk";
  } else {
    result.textContent = `⚠️ AVPU Level: ${val} – Patient may have impaired consciousness.`;
    result.className = "risk-result high-risk flashing";
    const beep = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQgAAIA=");
    beep.play();
    istumbleSelect.value = "Yes";
    handleIstumbleInput("unconscious", "Yes");
  }
}

function buildObsSection() {
  const container = document.getElementById("obs-section");

  const obsNav = document.createElement("div");
  obsNav.id = "obs-buttons";
  obsNav.style.marginBottom = "10px";

  ["OBS1", "OBS2", "OBS3"].forEach(label => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.type = "button";
    btn.onclick = () => renderObsSet(label);
    obsNav.appendChild(btn);
  });

  container.appendChild(obsNav);
  renderObsSet("OBS1");

  const timerBtn = document.createElement("button");
  timerBtn.textContent = "⏳ Set 15-Minute Obs Timer";
  timerBtn.onclick = startObsTimer;
  timerBtn.style.marginTop = "10px";
  container.appendChild(timerBtn);

  const timerDisplay = document.createElement("div");
  timerDisplay.id = "obs-timer-display";
  timerDisplay.className = "risk-result";
  container.appendChild(timerDisplay);
}

function renderObsSet(label) {
  const container = document.getElementById("obs-section");
  container.innerHTML = document.getElementById("obs-buttons").outerHTML;

  const header = document.createElement("h3");
  header.textContent = `Recording: ${label}`;
  container.appendChild(header);

  const obsItems = [
    { id: "resp-rate", label: "Respiratory Rate", thresholds: { red: v => v < 8 || v > 25, orange: v => v >= 21 && v <= 24 } },
    { id: "spo2", label: "SpO2", thresholds: { red: v => v < 90, orange: v => v < 94 } },
    { id: "heart-rate", label: "Heart Rate", thresholds: { red: v => v < 40 || v > 130, orange: v => v >= 111 && v <= 129 } },
    { id: "temp", label: "Temperature", thresholds: { red: v => v < 35.0 || v >= 39.1, orange: v => v >= 38 } },
    { id: "bp", label: "Blood Pressure", thresholds: { red: v => v < 90 || v > 219, orange: v => v >= 200 } },
    { id: "bm", label: "BM (Glucose)", thresholds: { red: v => v < 3.0 || v > 20.0, orange: v => v < 4.0 || v > 15.0 } },
    { id: "avpu", label: "Consciousness (AVPU)", thresholds: { red: v => v !== "Alert", orange: () => false } }
  ];

  obsItems.forEach(item => {
    const id = `${label.toLowerCase()}-${item.id}`;

    const input = item.id === "avpu"
      ? createSelect(id, [
          { value: "Alert", text: "Alert" },
          { value: "Voice", text: "Voice" },
          { value: "Pain", text: "Pain" },
          { value: "Unresponsive", text: "Unresponsive" }
        ])
      : document.createElement("input");

    input.id = id;
    input.type = item.id === "temp" ? "number" : "text";
    input.addEventListener("input", () => {
      const value = input.value;
      setInputColorByValue(input, value, item.thresholds);
    });

    container.appendChild(createLabel(item.label, input));
  });

  const overrideToggle = createSelect(`${label.toLowerCase()}-bm-range-toggle`, [
    { value: "Yes", text: "Yes" },
    { value: "No", text: "No" }
  ]);
  container.appendChild(createLabel("Use Patient’s Normal Ranges for BM?", overrideToggle));
}

function startObsTimer() {
  let timeLeft = 15 * 60;
  const display = document.getElementById("obs-timer-display");

  const timerInterval = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    display.textContent = `⏳ Time remaining: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    display.className = "risk-result";

    if (timeLeft-- <= 0) {
      clearInterval(timerInterval);
      display.textContent = "🔔 15 Minutes Passed – Re-take Observations Now!";
      display.className = "risk-result high-risk flashing";

      const beep = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQgAAIA=");
      beep.play();
      setTimeout(() => beep.play(), 1000);
      setTimeout(() => beep.play(), 2000);
    }
  }, 1000);
}

const istumbleQuestions = [
  { id: "pain", text: "Intense Pain?", desc: "e.g. verbal or visible pain on movement" },
  { id: "spine", text: "Spine Pain or Tenderness?", desc: "e.g. tenderness to neck/back or visible injury" },
  { id: "tingling", text: "Tingling or Numbness?", desc: "e.g. altered sensation in arms or legs" },
  { id: "unconscious", text: "Unconscious or Altered Mental State?", desc: "e.g. GCS < 15 or confused" },
  { id: "mobility", text: "Mobility Issues?", desc: "e.g. cannot walk or stand unaided" },
  { id: "bleed", text: "Bleeding or Clot Risk?", desc: "e.g. head injury + anticoagulants" },
  { id: "unwell", text: "Looked Unwell or Deteriorating?", desc: "e.g. pale, clammy, worsening symptoms" },
  { id: "trauma", text: "Evidence of Trauma?", desc: "e.g. bruising, wounds, deformity" }
];

function buildIstumble() {
  const container = document.getElementById("istumble-content");
  istumbleQuestions.forEach(q => {
    const select = createSelect(q.id, [
      { value: "Yes", text: "Yes" },
      { value: "No", text: "No" },
      { value: "Unknown", text: "Unknown" }
    ]);
    select.addEventListener("change", () => handleIstumbleInput(q.id, select.value));
    container.appendChild(createLabel(q.text, select, q.desc));

    const detailBox = document.createElement("input");
    detailBox.id = `${q.id}-details`;
    detailBox.placeholder = "Add detail...";
    detailBox.classList.add("hidden");
    container.appendChild(detailBox);

    const commentBox = document.createElement("textarea");
    commentBox.id = `${q.id}-comment`;
    commentBox.placeholder = "Add comment...";
    commentBox.classList.add("hidden");
    container.appendChild(commentBox);
  });
}

function handleIstumbleInput(id, value) {
  const detailInput = document.getElementById(`${id}-details`);
  const commentBox = document.getElementById(`${id}-comment`);
  const question = istumbleQuestions.find(q => q.id === id);
  const resultDiv = document.getElementById("istumble-result");

  if (value === "Yes" || value === "Unknown") {
    detailInput.classList.remove("hidden");
  } else {
    detailInput.classList.add("hidden");
    detailInput.value = "";
  }

  if (value === "Yes") {
    commentBox.classList.remove("hidden");
    resultDiv.textContent = `⚠️ Red Flag: "${question.text}" answered Yes.`;
    resultDiv.className = "risk-result high-risk flashing";
    const beep = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQgAAIA=");
    beep.play();
  } else {
    commentBox.classList.add("hidden");
    commentBox.value = "";
    evaluateIstumble();
  }
}

function evaluateIstumble() {
  const resultDiv = document.getElementById("istumble-result");
  const trauma = getVal("trauma");
  const bleed = getVal("bleed");
  const thinners = getVal("fast-thinner") === "Yes";

  const traumaAlert = (trauma === "Yes" || trauma === "Unknown");
  const bleedAlert = (bleed === "Yes" || bleed === "Unknown");

  if (thinners && traumaAlert) {
    resultDiv.textContent = "⚠️ Anticoagulant Use with Suspected or Unknown Trauma – Lift Not Authorised.";
    resultDiv.className = "risk-result high-risk";
    return;
  }

  if (thinners || bleedAlert) {
    resultDiv.textContent = "⚠️ Anticoagulant Use Detected – Seek Advice from PP Hub.";
    resultDiv.className = "risk-result medium-risk";
    return;
  }

  const redFlag = istumbleQuestions.some(q => getVal(q.id) === "Yes");
  if (redFlag) {
    resultDiv.textContent = "⚠️ Lift Not Authorised – Red Flag Detected.";
    resultDiv.className = "risk-result high-risk";
  } else {
    resultDiv.textContent = "✅ Lift Authorised – No Red Flags Detected.";
    resultDiv.className = "risk-result low-risk";
  }
}

function buildFratSection() {
  const container = document.getElementById("frat-section");
  const comments = document.getElementById("frat-comments");

  const questions = [
    { id: "falls-past", text: "Previous falls in the last year?", options: [{ value: 0, text: "None" }, { value: 5, text: "One" }, { value: 10, text: "More than one" }] },
    { id: "medications", text: "Four or more medications per day?", options: [{ value: 0, text: "No" }, { value: 5, text: "Yes" }] },
    { id: "gait-balance", text: "Gait or balance issues?", options: [{ value: 0, text: "No" }, { value: 5, text: "Yes" }] },
    { id: "mental-status", text: "Cognitive impairment or confusion?", options: [{ value: 0, text: "No" }, { value: 5, text: "Yes" }] }
  ];

  questions.forEach(q => {
    const select = createSelect(q.id, q.options.map(opt => ({ value: opt.value, text: opt.text })));
    container.appendChild(createLabel(q.text, select));
  });

  const scoreBtn = document.createElement("button");
  scoreBtn.textContent = "📈 Calculate FRAT Score";
  scoreBtn.onclick = evaluateFrat;
  container.appendChild(scoreBtn);
}

function evaluateFrat() {
  const ids = ["falls-past", "medications", "gait-balance", "mental-status"];
  const total = ids.reduce((sum, id) => sum + parseInt(getVal(id) || 0), 0);
  const comments = document.getElementById("frat-comments");

  let riskLevel = "Low Risk";
  if (total >= 15) riskLevel = "High Risk";
  else if (total >= 5) riskLevel = "Moderate Risk";

  comments.textContent = `FRAT Score: ${total} – ${riskLevel}`;
}

function buildSummaryCard() {
  const card = document.getElementById("card-view");
  card.innerHTML = "";

  const title = document.createElement("h2");
  title.textContent = "Verbal Report Summary for Paramedic Practitioner";
  card.appendChild(title);

  const addSection = (heading, content) => {
    const h3 = document.createElement("h3");
    h3.textContent = heading;
    card.appendChild(h3);

    const pre = document.createElement("pre");
    pre.textContent = content;
    card.appendChild(pre);
  };

  const patientInfo = [
    `CFR Call Sign: ${getVal("cfr-id")}`,
    `ESR Number: ${getVal("esr-number")}`,
    `Incident Date: ${getVal("incident-date")}`,
    `Incident Time: ${getVal("incident-time")}`,
    `INC Number: ${getVal("inc-number")}`,
    `Sex: ${getVal("patient-sex")}`,
    `Age: ${getVal("patient-age")}`
  ].join("\n");
  addSection("Patient & Incident Details", patientInfo);

  const fastStatus = [
    `Face Droop: ${getVal("fast-face")}`,
    `Arm Weakness: ${getVal("fast-arm")}`,
    `Speech Issues: ${getVal("fast-speech")}`,
    `Time of Onset: ${getVal("fast-time")}`,
    `Blood Thinners: ${getVal("fast-thinner") === "Yes" ? getVal("fast-thinner-type") : "None"}`
  ].join("\n");
  addSection("FAST Assessment", fastStatus);

  const istumbleSummary = istumbleQuestions.map(q => {
    const val = getVal(q.id);
    const details = getVal(`${q.id}-details`);
    const comment = getVal(`${q.id}-comment`);
    return `${q.text}: ${val}${details ? ` | Detail: ${details}` : ""}${comment ? ` | Comment: ${comment}` : ""}`;
  }).join("\n");
  addSection("ISTUMBLE", istumbleSummary);

  const gcs = [
    `GCS: E${getVal("gcs-eye") || "?"} V${getVal("gcs-verbal") || "?"} M${getVal("gcs-motor") || "?"}`,
    `AVPU: ${getVal("avpu-scale")}`
  ].join("\n");
  addSection("Consciousness", gcs);

  ["OBS1", "OBS2", "OBS3"].forEach(label => {
    const prefix = label.toLowerCase();
    const obs = [
      `Resp Rate: ${getVal(`${prefix}-resp-rate`)}`,
      `SpO2: ${getVal(`${prefix}-spo2`)}`,
      `Heart Rate: ${getVal(`${prefix}-heart-rate`)}`,
      `BP: ${getVal(`${prefix}-bp`)}`,
      `Temp: ${getVal(`${prefix}-temp`)}`,
      `BM: ${getVal(`${prefix}-bm`)}`,
      `AVPU: ${getVal(`${prefix}-avpu`)}`,
      `BM Range Toggle: ${getVal(`${prefix}-bm-range-toggle`)}`
    ].join("\n");
    addSection(label, obs);
  });

  const backBtn = document.createElement("button");
  backBtn.textContent = "⬅️ Return to Form";
  backBtn.onclick = () => {
    card.classList.add("hidden");
    document.getElementById("main-form").classList.remove("hidden");
  };
  card.appendChild(backBtn);

  card.classList.remove("hidden");
  document.getElementById("main-form").classList.add("hidden");
}

document.getElementById("medsBtn").addEventListener("click", showMedSearch);

function showMedSearch() {
  const existing = document.getElementById("med-section");
  if (existing) return existing.scrollIntoView();

  const container = document.createElement("div");
  container.id = "med-section";
  container.innerHTML = `
    <h3>Drug Lookup (BNF)</h3>
    <input type="text" id="med-search" placeholder="Enter drug name…"/>
    <button onclick="lookupDrug()">Search</button>
    <div id="med-results" style="margin-top: 10px;"></div>
  `;
  document.body.appendChild(container);
}

async function lookupDrug() {
  const name = document.getElementById("med-search").value.trim().toLowerCase();
  if (!name) return alert("Please enter a drug name");

  const url = `https://bnf.nice.org.uk/drugs/${name}/`;
  try {
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const sections = [".drug__indications", ".drug__adult-dose", ".drug__side-effects"];
    const out = sections.map(sel => {
      const el = doc.querySelector(sel);
      return el ? el.textContent.trim() : "Not available";
    });

    document.getElementById("med-results").innerHTML = `
      <h4>Uses:</h4><p>${out[0]}</p>
      <h4>Adult Dose:</h4><p>${out[1]}</p>
      <h4>Side Effects:</h4><p>${out[2]}</p>
    `;
  } catch (err) {
    alert("Could not retrieve drug info.");
  }
}

document.getElementById("settingsBtn").addEventListener("click", () => {
  const existing = document.getElementById("settings-panel");
  if (existing) return existing.scrollIntoView();

  const container = document.createElement("div");
  container.id = "settings-panel";
  container.innerHTML = `
    <h3>App Settings</h3>
    <label><input type="checkbox" id="setting-dark-mode"> Enable Dark Mode</label><br>
    <label><input type="checkbox" id="setting-alert-sounds" checked> Enable Alert Sounds</label><br>
    <label><input type="checkbox" id="setting-compact-view"> Use Compact Layout</label><br>
    <button onclick="saveAppSettings()">Save Settings</button>
    <div id="settings-message" style="margin-top:10px;"></div>
  `;
  document.body.appendChild(container);
});

function saveAppSettings() {
  const settings = {
    darkMode: document.getElementById("setting-dark-mode").checked,
    sounds: document.getElementById("setting-alert-sounds").checked,
    compact: document.getElementById("setting-compact-view").checked
  };

  localStorage.setItem("app-settings", JSON.stringify(settings));
  document.getElementById("settings-message").textContent = "✅ Settings saved.";
  applyAppSettings();
}

function applyAppSettings() {
  const settings = JSON.parse(localStorage.getItem("app-settings") || "{}");
  document.body.classList.toggle("dark", settings.darkMode);
  document.body.classList.toggle("compact", settings.compact);
}

