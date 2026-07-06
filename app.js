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
// 2. DYNAMIC UI GENERATION
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

// Generate 10 Saklar Kontrol (SW1 - SW10)
for (let i = 1; i <= 10; i++) {
  const item = document.createElement('div');
  item.className = 'io-item';
  item.innerHTML = `
    <span class="io-label">Saklar ${i}</span>
    <label class="switch">
      <input type="checkbox" id="switch-SW${i}">
      <span class="slider"></span>
    </label>
  `;
  controlContainer.appendChild(item);
}

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
      const val = data[`L${i}`];
      if (val === 1) {
        led.classList.add('on');
      } else {
        led.classList.remove('on');
      }
    }
  }
});

// B. READ INITIAL STATE: Listen to Control States to sync UI switches
onValue(ref(db, 'SCADA/Controls'), (snapshot) => {
  const data = snapshot.val();
  if (data) {
    for (let i = 1; i <= 10; i++) {
      const sw = document.getElementById(`switch-SW${i}`);
      if (data[`SW${i}`] !== undefined && sw) {
        sw.checked = (data[`SW${i}`] === 1);
      }
    }
  }
});

// C. WRITE: Send Toggle Actions to Firebase
for (let i = 1; i <= 10; i++) {
  const sw = document.getElementById(`switch-SW${i}`);
  sw.addEventListener('change', (e) => {
    set(ref(db, `SCADA/Controls/SW${i}`), e.target.checked ? 1 : 0);
  });
}
