let currentFocusTaskIndex = null;


function startTaskFocus(taskIndex) {
  currentFocusTaskIndex = taskIndex;
  const task = tasks[taskIndex];
  document.getElementById("focus-task-name").textContent = task.title;
}

let sessionStartTime = null;
let totalFocusedSeconds = 0;
let timerInterval = null;

const stats = {
  continuity: 30,
  creativity: 30,
  art: 30,
  experience: 30,
  vitality: 30,
  intellect: 30
};

const statLabels = {
  continuity: "継続力",
  creativity: "発想力",
  art: "創造性",
  experience: "経験",
  vitality: "体力",
  intellect: "知力"
};

const tasks = [
  { title: "大学の勉強", statKeys:["intellect"], totalSeconds: 0 },
  {title: "筋トレ", statKeys: ["vitality"], totalSeconds: 0 },
  {title: "オンライン英会話", statKeys: ["intellect", "experience"], totalSeconds: 0 }
   ];

function renderTasks() {
  const ul = document.getElementById("task-list");
  ul.innerHTML = "";

  for (let i = 0; i < tasks.length; i++) {
    const taskText = tasks[i];
    const hours = (taskText.totalSeconds / 3600).toFixed(2);
    const tags = taskText.statKeys.map(k => `<span class="task-tag">${statLabels[k]}</span>`).join(" ");
    ul.innerHTML += `
      <li class="task-row">
        <span class="task-title">${taskText.title}</span>
        ${tags}
        <span class="task-meta">累計 ${hours}時間 /  経過 <span id="task-elapsed-${i}">０秒</span></span>
        
       
        <button onclick="startTaskFocus(${i})">開始</button>
        <button class="danger" onclick="deleteTask(${i})">削除</button>
      </li>
    `;
  }
}

function deleteTask(taskIndex) {
  tasks.splice(taskIndex, 1);
  renderTasks();
  saveData();
}

function renderTaskStatOptions() {
  const container = document.getElementById("new-task-stat-checks");
  container.innerHTML = "";

  for(const key in statLabels) {
    container.innerHTML += `
      <label>
        <input type="checkbox" class="stat-check" value="${key}">
        ${statLabels[key]}
      </label>
    `; 
  }
}

function addTask() {
  const titleInput = document.getElementById("new-task-title");
  const checkedBoxes = document.querySelectorAll(".stat-check:checked")

  const selectedKeys = [];
  for (let i = 0; i< checkedBoxes.length; i++) {
    selectedKeys.push(checkedBoxes[i].value);
  }

  if(selectedKeys.length === 0) {
    alert("能力を1つ以上選んでください");
    return;
  }

const newTask = {
  title: titleInput.value,
  statKeys:selectedKeys
  
};

tasks.push(newTask);

titleInput.value = "";
for (let i = 0; i< checkedBoxes.length; i++) {
  checkedBoxes[i].checked = false;
}

renderTasks();
saveData();
}

function renderStatSliders() {
  const container = document.getElementById("stat-sliders");
  container.innerHTML = "";

  for (const key in stats) {
    container.innerHTML += `
      <div class="stat-row">
        <div class="stat-name">${statLabels[key]}</div>
        <input type="range" class="stat-slider" min="1" max="100"
          value="${stats[key]}" tabindex="-1" style="pointer-events:none;">
        <div class="stat-num" id="value-${key}">${stats[key].toFixed(1)}</div>
      </div>
    `;
  }
}

function renderOnboardSliders() {
  const container = document.getElementById("onboard-sliders");
  container.innerHTML = "";

  for (const key in stats) {
    container.innerHTML += `
    <p>
    ${statLabels[key]}: <span id="onboard-value-${key}">30</span>
    <br>
    <input
      type="range"
      min="1"
      max="80"
      value="30"
      oninput="updateOnboardValue('${key}', this.value)"
    >
    </p>
  `;
  }
}

function updateOnboardValue(key, newValue) {
  document.getElementById("onboard-value-" + key).textContent = newValue;
}

function startFromOnboarding() {
  for (const key in stats) {
    const el = document.getElementById("onboard-value-" + key);
    stats[key] = Number(el.textContent);
    
  }
  localStorage.setItem("onboardDone" ,"true");

  document.getElementById("onboard-screen").style.display = "none";
  document.getElementById("main-screen").style.display = "block"; 
  drawRadar();
  updateRankDisplay();
  renderStatSliders();
  renderTaskStatOptions();
  renderTasks();
  saveData();
}

function updateStat(key, newValue) {
  stats[key] = Number(newValue);
  document.getElementById("value-" + key).textContent = newValue;
  drawRadar();
  saveData();
  
}

function polarPoint(cx, cy, r, angleDeg) {
  const rad = (Math.PI / 180) * angleDeg;
  const x = cx + r * Math.sin(rad);
  const y = cy - r * Math.cos(rad);
  return [x, y];
}

function drawRadar() {
  const cx = 160, cy = 165;
  const maxR = 95;

  const keys = Object.keys(stats);

  let pointsStr = "";
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const angle = i * 60;
    const ratio = stats[key] / 100;
    const [x, y] = polarPoint(cx, cy, maxR * ratio, angle);
    pointsStr += x.toFixed(1) + "," + y.toFixed(1) + " ";
  }

  document.getElementById("radar-polygon").setAttribute("points", pointsStr);
  drawGridAndLabels(cx, cy, maxR, keys);
}

function drawGridAndLabels(cx, cy, maxR, keys) {
  const gridGroup = document.getElementById("radar-grid");
  const labelGroup = document.getElementById("radar-labels");
  gridGroup.innerHTML = "";
  labelGroup.innerHTML = "";

  [0.2, 0.4, 0.6, 0.8, 1.0].forEach(ratio => {
    const pts = keys.map((_, i) => {
      const [x, y] = polarPoint(cx, cy, maxR * ratio, i * 60);
      return x.toFixed(1) + "," + y.toFixed(1);
    }).join(" ");
    gridGroup.innerHTML += `<polygon points="${pts}" fill="none" stroke="gray" opacity="0.3" />`;
  });

  keys.forEach((key, i) => {
    const angle = i * 60;
    const [ex, ey] = polarPoint(cx, cy, maxR, angle);
    gridGroup.innerHTML += `<line x1="${cx}" y1="${cy}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="gray" opacity="0.4" />`;

    const [lx, ly] = polarPoint(cx, cy, maxR + 30, angle);
    let anchor = "middle";
    if (lx > cx + 5) anchor = "start";
    if (lx < cx - 5) anchor = "end";
    labelGroup.innerHTML += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="12" fill="#f3efe4" text-anchor="${anchor}">${statLabels[key]} ${Math.round(stats[key])}</text>`;
  });
}
function updateRankDisplay() {
  const keys = Object.keys(stats);
  let total = 0;

  for (let i = 0; i < keys.length; i++) {
    total += stats[keys[i]];
  }

  const average = total / keys.length;

  let rank = "足軽";
   if (average >= 90) {
    rank = "天下人";
  } else if (average >= 70) {
    rank = "大名";
  } else if (average >= 50) {
    rank = "武将";
  } else if (average >= 40) {
    rank = "侍";
  }
  document.getElementById("rank-display").textContent  = rank;
  document.getElementById("score-display").textContent = average.toFixed(1);

 
}

function startFocus() {
  sessionStartTime = Date.now();
  timerInterval = setInterval(updateTimerDisplay, 1000);
  const videoEl = document.getElementById("bg-video");
  if(videoEl.src) {
    videoEl.style.display = "block"
    videoEl.play();
  }
}

function stopFocus() {
  if (sessionStartTime === null) return;

  const elapsedMs = Date.now() - sessionStartTime;
  totalFocusedSeconds += elapsedMs / 1000;
  sessionStartTime = null;

  clearInterval(timerInterval);

  updateStatFromTime();
  updateTimerDisplay();

  const videoEl = document.getElementById("bg-video");
  videoEl.pause();
  videoEl.style.display = "none";
}

function updateTimerDisplay() {
  let currentTotal = totalFocusedSeconds;

  if (sessionStartTime !== null) {
    currentTotal += (Date.now() - sessionStartTime) / 1000;
  }

  const displaySeconds = Math.floor(currentTotal);
  document.getElementById("timer-display").textContent = displaySeconds + "秒";

  if (currentFocusTaskIndex !== null) {
    const taskElapsedEl = document.getElementById("task-elapsed-" + currentFocusTaskIndex);
    if(taskElapsedEl) {
      taskElapsedEl.textContent = displaySeconds + "秒";
    }
  }
}

function updateStatFromTime() {
  if (currentFocusTaskIndex === null) return;

  const task = tasks[currentFocusTaskIndex];
  task.totalSeconds += totalFocusedSeconds;
  
  const bonus = (totalFocusedSeconds / 3600 / 10) * 0.1;
  for (let i = 0; i < task.statKeys.length; i++) {
    const key = task.statKeys[i];
    stats[key] = Math.min(100, stats[key] + bonus);
  }

  drawRadar();
  updateRankDisplay();
  renderStatSliders();
  renderTasks();
  saveData();

  totalFocusedSeconds = 0;
}

function saveData() {
  localStorage.setItem("myStats", JSON.stringify(stats));
  localStorage.setItem("myTasks", JSON.stringify(tasks));

}

function loadData() {
  const savedStats = localStorage.getItem("myStats");
  const savedTasks = localStorage.getItem("myTasks");

  if(savedStats) {
    const parsed = JSON.parse(savedStats);
    for (const key in parsed) {
      stats[key] = parsed[key];
    }
  }

  if (savedTasks) {
    const parsedTasks = JSON.parse(savedTasks);
    tasks.length = 0;
    for (let i = 0; i < parsedTasks.length; i++) {
      const t = parsedTasks[i];
      if(!t.statKeys) {
        t.statKeys = [t.statKey];
      }
      if (typeof t.totalSeconds !== "number") {
        t.totalSeconds = 0;
      }
      tasks.push(t);
    }
  }
}

function resetAll() {
  if (!confirm("能力値とタスクをすべてリセットします。よろしいですか？")) return;

  localStorage.removeItem("myStats");
  localStorage.removeItem("myTasks");
  localStorage.removeItem("onboardDone");

  location.reload();
}

const onboardDone = localStorage.getItem("onboardDone")

document.getElementById("video-file").addEventListener("change", function(e){
  const file = e.target.files[0];
  if(!file) return;
  const videoEl = document.getElementById("bg-video");
  videoEl.src = URL.createObjectURL(file);
});

if (onboardDone === "true") {
  document.getElementById("onboard-screen").style.display = "none";
  document.getElementById("main-screen").style.display = "block";


loadData();
renderTasks();
renderTaskStatOptions();
renderStatSliders();
drawRadar();
updateRankDisplay();
} else {
  document.getElementById("onboard-screen").style.display = "block";
  document.getElementById("main-screen").style.display = "none";
  renderOnboardSliders();
}