import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
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
