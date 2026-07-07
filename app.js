import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyB0EDOtTMEF41_lB2CMQSmuuxpwvefvd2Q",
  authDomain: "scada-7904a.firebaseapp.com",
  databaseURL: "https://scada-7904a-default-rtdb.firebaseio.com",
  projectId: "scada-7904a",
  storageBucket: "scada-7904a.firebasestorage.app",
  messagingSenderId: "91214446795",
  appId: "1:91214446795:web:3eb12dd023f3f5dd55db4e"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================================
// 2. DYNAMIC UI GENERATION & CHART
// ==========================================
const indicatorContainer = document.getElementById('indicator-container');
const controlContainer = document.getElementById('control-container');

// Generate 10 Lampu Indikator (L1 - L10)
for (let i = 1; i <= 10; i++) {
  const item = document.createElement('div');
  item.className = 'io-item';
  item.innerHTML = `
    <span class="io-label">Lampu ${i}</span>
    <div class="led" id="led-L${i}"></div>
  `;
  indicatorContainer.appendChild(item);
}

// Generate 5 Pushbuttons (BTN1 - BTN5)
for (let i = 1; i <= 5; i++) {
  const item = document.createElement('div');
  item.className = 'io-item';
  item.innerHTML = `
    <span class="io-label">Tombol ${i}</span>
    <button class="pushbutton" id="btn-BTN${i}">TEKAN</button>
  `;
  controlContainer.appendChild(item);
}

// Chart Initialization
const ctx = document.getElementById('trendChart').getContext('2d');
const trendChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Analog 1 (Suhu/Potensio)',
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        data: []
      },
      {
        label: 'Analog 2',
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        data: []
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    scales: {
      x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' }, beginAtZero: true }
    },
    plugins: { legend: { labels: { color: '#f8fafc' } } }
  }
});
const MAX_DATA_POINTS = 30;

// ==========================================
// 3. FIREBASE SYNC LOGIC
// ==========================================
const connDot = document.getElementById('connection-dot');
const connStatus = document.getElementById('connection-status');

// Connection Status Monitor
onValue(ref(db, ".info/connected"), (snap) => {
  if (snap.val() === true) {
    connDot.className = 'dot connected';
    connStatus.innerText = 'Connected to Firebase';
  } else {
    connDot.className = 'dot disconnected';
    connStatus.innerText = 'Disconnected';
  }
});

// A. READ: Listen to Modbus Indicators (L1 - L10)
onValue(ref(db, 'SCADA/Indicators'), (snapshot) => {
  const data = snapshot.val();
  if (data) {
    for (let i = 1; i <= 10; i++) {
      const led = document.getElementById(`led-L${i}`);
      if (led && data[`L${i}`] !== undefined) {
        if (data[`L${i}`] === 1) led.classList.add('on');
        else led.classList.remove('on');
      }
    }
  }
});

// B. READ: Listen to Modbus Analog for Chart (A1 & A2)
onValue(ref(db, 'SCADA/Analog'), (snapshot) => {
  const data = snapshot.val();
  if (data) {
    const now = new Date();
    const timeLabel = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    
    // Update large numbers
    const a1 = data.A1 || 0;
    const a2 = data.A2 || 0;
    const a1El = document.getElementById('a1Val');
    const a2El = document.getElementById('a2Val');
    const tsEl = document.getElementById('ts');
    
    if(a1El) a1El.textContent = a1;
    if(a2El) a2El.textContent = a2;
    if(tsEl) tsEl.textContent = now.toLocaleString();

    trendChart.data.labels.push(timeLabel);
    trendChart.data.datasets[0].data.push(a1);
    trendChart.data.datasets[1].data.push(a2);

    if (trendChart.data.labels.length > MAX_DATA_POINTS) {
      trendChart.data.labels.shift();
      trendChart.data.datasets[0].data.shift();
      trendChart.data.datasets[1].data.shift();
    }
    trendChart.update();
  }
});

// C. WRITE: Pushbutton Events (1 when pressed, 0 when released)
for (let i = 1; i <= 5; i++) {
  const btn = document.getElementById(`btn-BTN${i}`);
  if (btn) {
    // Mouse Events (PC)
    btn.addEventListener('mousedown', () => {
      btn.classList.add('active');
      set(ref(db, `SCADA/Controls/BTN${i}`), 1);
    });
    btn.addEventListener('mouseup', () => {
      btn.classList.remove('active');
      set(ref(db, `SCADA/Controls/BTN${i}`), 0);
    });
    btn.addEventListener('mouseleave', () => {
      btn.classList.remove('active');
      set(ref(db, `SCADA/Controls/BTN${i}`), 0);
    });
    
    // Touch Events (Mobile)
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      btn.classList.add('active');
      set(ref(db, `SCADA/Controls/BTN${i}`), 1);
    });
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      btn.classList.remove('active');
      set(ref(db, `SCADA/Controls/BTN${i}`), 0);
    });
  }
}
