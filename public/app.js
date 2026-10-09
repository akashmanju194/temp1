// Modern Calculator Client-side Logic
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const mainDisplay = document.getElementById('mainDisplay');
  const formulaDisplay = document.getElementById('formulaDisplay');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const historyDrawer = document.getElementById('historyDrawer');
  const historyList = document.getElementById('historyList');
  const historyBadge = document.getElementById('historyBadge');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const operatorButtons = document.querySelectorAll('.btn-operator');

  // Calculator State
  let currentInput = '0';
  let previousInput = null;
  let activeOperator = null; // '+', '−', '×', '÷'
  let awaitingNextInput = false;
  let hasEvaluated = false;
  let isSoundEnabled = true;

  // Web Audio Context for tactile click sound
  let audioCtx = null;
  function playClickSound(freq = 600, duration = 0.03) {
    if (!isSoundEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio might be blocked until user gesture
    }
  }

  // Update display and adjust font size dynamically
  function updateDisplay() {
    mainDisplay.textContent = currentInput;
    const len = currentInput.length;
    if (len > 14) {
      mainDisplay.style.fontSize = '1.6rem';
    } else if (len > 10) {
      mainDisplay.style.fontSize = '2.1rem';
    } else if (len > 8) {
      mainDisplay.style.fontSize = '2.5rem';
    } else {
      mainDisplay.style.fontSize = '2.85rem';
    }
  }

  // Set active operator UI highlight
  function updateOperatorHighlight() {
    operatorButtons.forEach(btn => {
      if (activeOperator && btn.getAttribute('data-operator') === activeOperator) {
        btn.classList.add('active-operator');
      } else {
        btn.classList.remove('active-operator');
      }
    });
  }

  // Input a number digit
  function handleNumber(digit) {
    playClickSound(700, 0.02);

    if (hasEvaluated) {
      currentInput = digit;
      formulaDisplay.textContent = '';
      hasEvaluated = false;
      awaitingNextInput = false;
    } else if (awaitingNextInput) {
      currentInput = digit;
      awaitingNextInput = false;
    } else {
      if (currentInput === '0') {
        currentInput = digit;
      } else if (currentInput.length < 16) {
        currentInput += digit;
      }
    }
    updateDisplay();
  }

  // Input decimal point
  function handleDecimal() {
    playClickSound(750, 0.02);

    if (hasEvaluated || awaitingNextInput) {
      currentInput = '0.';
      awaitingNextInput = false;
      hasEvaluated = false;
      if (hasEvaluated) formulaDisplay.textContent = '';
    } else if (!currentInput.includes('.')) {
      currentInput += '.';
    }
    updateDisplay();
  }

  // Handle operator choice (+, −, ×, ÷)
  async function handleOperator(op) {
    playClickSound(520, 0.04);

    // If an operator is already active and user entered a second number, calculate first
    if (activeOperator && !awaitingNextInput && previousInput !== null) {
      await performCalculation();
    }

    previousInput = currentInput;
    activeOperator = op;
    awaitingNextInput = true;
    hasEvaluated = false;

    formulaDisplay.textContent = `${previousInput} ${op}`;
    updateOperatorHighlight();
  }

  // Perform calculation with backend API
  async function performCalculation() {
    if (previousInput === null || activeOperator === null) {
      return;
    }

    const num1 = previousInput;
    const operator = activeOperator;
    const num2 = currentInput;

    playClickSound(900, 0.05);

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num1, operator, num2 })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        currentInput = String(data.result);
        formulaDisplay.textContent = `${num1} ${operator} ${num2} =`;
        previousInput = null;
        activeOperator = null;
        awaitingNextInput = false;
        hasEvaluated = true;
        updateDisplay();
        updateOperatorHighlight();
        fetchHistory();
      } else {
        formulaDisplay.textContent = data.error || 'Error';
        currentInput = 'Error';
        updateDisplay();
        previousInput = null;
        activeOperator = null;
        hasEvaluated = true;
        updateOperatorHighlight();
      }
    } catch (err) {
      console.warn('Backend call failed, performing fallback client-side evaluation', err);
      // Fallback client-side calculation
      const n1 = parseFloat(num1);
      const n2 = parseFloat(num2);
      let res;
      if (operator === '+') res = n1 + n2;
      else if (operator === '−' || operator === '-') res = n1 - n2;
      else if (operator === '×' || operator === '*') res = n1 * n2;
      else if (operator === '÷' || operator === '/') {
        res = n2 === 0 ? 'Error: Div by 0' : n1 / n2;
      }
      currentInput = String(res);
      formulaDisplay.textContent = `${num1} ${operator} ${num2} =`;
      previousInput = null;
      activeOperator = null;
      hasEvaluated = true;
      updateDisplay();
      updateOperatorHighlight();
    }
  }

  // Handle Clear All (AC)
  function handleClear() {
    playClickSound(400, 0.04);
    currentInput = '0';
    previousInput = null;
    activeOperator = null;
    awaitingNextInput = false;
    hasEvaluated = false;
    formulaDisplay.textContent = '';
    updateDisplay();
    updateOperatorHighlight();
  }

  // Handle sign toggle (+/-)
  function handleNegate() {
    playClickSound(600, 0.02);
    if (currentInput === '0' || currentInput === 'Error') return;
    if (currentInput.startsWith('-')) {
      currentInput = currentInput.slice(1);
    } else {
      currentInput = '-' + currentInput;
    }
    updateDisplay();
  }

  // Handle percentage (%)
  function handlePercent() {
    playClickSound(600, 0.02);
    const num = parseFloat(currentInput);
    if (!isNaN(num)) {
      currentInput = String(num / 100);
      updateDisplay();
    }
  }

  // Handle backspace (⌫)
  function handleBackspace() {
    playClickSound(480, 0.02);
    if (hasEvaluated || currentInput === 'Error') {
      handleClear();
      return;
    }
    if (currentInput.length > 1) {
      currentInput = currentInput.slice(0, -1);
      if (currentInput === '-' || currentInput === '') currentInput = '0';
    } else {
      currentInput = '0';
    }
    updateDisplay();
  }

  // Button clicks via event delegation
  document.querySelector('.keypad-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.calc-btn');
    if (!btn) return;

    if (btn.hasAttribute('data-number')) {
      handleNumber(btn.getAttribute('data-number'));
    } else if (btn.hasAttribute('data-operator')) {
      handleOperator(btn.getAttribute('data-operator'));
    } else if (btn.hasAttribute('data-action')) {
      const action = btn.getAttribute('data-action');
      if (action === 'clear') handleClear();
      else if (action === 'decimal') handleDecimal();
      else if (action === 'calculate') performCalculation();
      else if (action === 'negate') handleNegate();
      else if (action === 'percent') handlePercent();
      else if (action === 'backspace') handleBackspace();
    }
  });

  // Physical Keyboard Support
  window.addEventListener('keydown', (e) => {
    if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
      handleNumber(e.key);
      highlightKeyVisual(`btn-${e.key}`);
    } else if (e.key === '.') {
      handleDecimal();
      highlightKeyVisual('btn-decimal');
    } else if (e.key === '+') {
      handleOperator('+');
      highlightKeyVisual('btn-add');
    } else if (e.key === '-') {
      handleOperator('−');
      highlightKeyVisual('btn-subtract');
    } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
      handleOperator('×');
      highlightKeyVisual('btn-multiply');
    } else if (e.key === '/') {
      e.preventDefault();
      handleOperator('÷');
      highlightKeyVisual('btn-divide');
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      performCalculation();
      highlightKeyVisual('btn-equals');
    } else if (e.key === 'Backspace') {
      handleBackspace();
      highlightKeyVisual('btn-backspace');
    } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
      handleClear();
      highlightKeyVisual('btn-clear');
    } else if (e.key === '%') {
      handlePercent();
      highlightKeyVisual('btn-percent');
    }
  });

  function highlightKeyVisual(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      el.style.transform = 'translateY(1px) scale(0.95)';
      setTimeout(() => {
        el.style.transform = '';
      }, 100);
    }
  }

  // Backend Health Check
  async function checkServerHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        statusIndicator.classList.remove('offline');
        statusText.textContent = 'Backend Online';
      } else {
        throw new Error('Unhealthy');
      }
    } catch {
      statusIndicator.classList.add('offline');
      statusText.textContent = 'Backend Offline';
    }
  }

  // History Drawer Handling
  async function fetchHistory() {
    try {
      const res = await fetch('/api/history');
      if (!res.ok) return;
      const data = await res.json();
      renderHistory(data.history || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }

  function renderHistory(items) {
    historyBadge.textContent = items.length;
    if (items.length === 0) {
      historyList.innerHTML = '<div class="history-empty">No calculations yet</div>';
      return;
    }

    historyList.innerHTML = items.map(item => `
      <div class="history-item" data-result="${item.result}" title="Click to use this result">
        <div class="history-item-expr">${item.num1} ${item.operator} ${item.num2} =</div>
        <div class="history-item-res">${item.result}</div>
      </div>
    `).join('');

    // Allow user to click a past result to populate calculator
    historyList.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const val = el.getAttribute('data-result');
        currentInput = val;
        awaitingNextInput = false;
        hasEvaluated = true;
        updateDisplay();
        historyDrawer.classList.remove('open');
      });
    });
  }

  // Clear History
  clearHistoryBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/history', { method: 'DELETE' });
      if (res.ok) {
        fetchHistory();
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  });

  // History Drawer Toggles
  historyToggleBtn.addEventListener('click', () => {
    historyDrawer.classList.toggle('open');
    if (historyDrawer.classList.contains('open')) {
      fetchHistory();
    }
  });

  closeDrawerBtn.addEventListener('click', () => {
    historyDrawer.classList.remove('open');
  });

  // Sound FX Toggle
  soundToggleBtn.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    soundToggleBtn.classList.toggle('muted', !isSoundEnabled);
    if (isSoundEnabled) {
      playClickSound(600, 0.05);
    }
  });

  // Initial startup
  updateDisplay();
  checkServerHealth();
  fetchHistory();
  setInterval(checkServerHealth, 15000);
});
