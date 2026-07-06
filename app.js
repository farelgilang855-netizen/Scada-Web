import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
// TODO: Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================================
// 2. UI ELEMENTS & CHART.JS SETUP
// ==========================================
const connDot = document.getElementById('connection-dot');
const connStatus = document.getElementById('connection-status');
const valSensor1 = document.getElementById('val-sensor1');
const valSensor2 = document.getElementById('val-sensor2');
const toggle1 = document.getElementById('toggle-ctrl1');
const toggle2 = document.getElementById('toggle-ctrl2');

// Chart Initialization
const ctx = document.getElementById('trendChart').getContext('2d');
const gradientBlue = ctx.createLinearGradient(0, 0, 0, 400);
gradientBlue.addColorStop(0, 'rgba(245, 158, 11, 0.5)'); // Yellow-Orange
gradientBlue.addColorStop(1, 'rgba(245, 158, 11, 0)');

const gradientPurple = ctx.createLinearGradient(0, 0, 0, 400);
gradientPurple.addColorStop(0, 'rgba(139, 92, 246, 0.5)'); // Purple
gradientPurple.addColorStop(1, 'rgba(139, 92, 246, 0)');

const trendChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Sensor 1 (Temp)',
        borderColor: '#f59e0b',
        backgroundColor: gradientBlue,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        data: []
      },
      {
        label: 'Sensor 2 (Pressure)',
        borderColor: '#8b5cf6',
        backgroundColor: gradientPurple,
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

const MAX_DATA_POINTS = 20;

// ==========================================
// 3. FIREBASE REALTIME DATA SYNC
// ==========================================

// Connection Status Monitor
const connectedRef = ref(db, ".info/connected");
onValue(connectedRef, (snap) => {
  if (snap.val() === true) {
    connDot.classList.remove('disconnected');
    connDot.classList.add('connected');
    connStatus.innerText = 'Connected to Firebase';
  } else {
    connDot.classList.remove('connected');
    connDot.classList.add('disconnected');
    connStatus.innerText = 'Disconnected';
  }
});

// Read Sensors from Firebase
const sensorsRef = ref(db, 'SCADA/Sensors');
onValue(sensorsRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    // Update Text UI
    if (data.sensor1 !== undefined) valSensor1.innerHTML = `${data.sensor1} <small>°C</small>`;
    if (data.sensor2 !== undefined) valSensor2.innerHTML = `${data.sensor2} <small>bar</small>`;

    // Update Chart
    const now = new Date();
    const timeLabel = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    
    trendChart.data.labels.push(timeLabel);
    trendChart.data.datasets[0].data.push(data.sensor1 || 0);
    trendChart.data.datasets[1].data.push(data.sensor2 || 0);

    if (trendChart.data.labels.length > MAX_DATA_POINTS) {
      trendChart.data.labels.shift();
      trendChart.data.datasets[0].data.shift();
      trendChart.data.datasets[1].data.shift();
    }
    trendChart.update();
  }
});

// Sync Initial Toggle States from Firebase
onValue(ref(db, 'SCADA/Control/relay1'), (snapshot) => {
  toggle1.checked = (snapshot.val() === 1);
});
onValue(ref(db, 'SCADA/Control/relay2'), (snapshot) => {
  toggle2.checked = (snapshot.val() === 1);
});

// ==========================================
// 4. CONTROL HANDLERS (Write to Firebase)
// ==========================================
toggle1.addEventListener('change', (e) => {
  set(ref(db, 'SCADA/Control/relay1'), e.target.checked ? 1 : 0);
});

toggle2.addEventListener('change', (e) => {
  set(ref(db, 'SCADA/Control/relay2'), e.target.checked ? 1 : 0);
});
