const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Calculation history in memory
let calculationHistory = [];
const MAX_HISTORY = 50;

// Helper to round precision float issues (e.g., 0.1 + 0.2)
function cleanFloat(value) {
  return parseFloat(Number(value).toPrecision(12));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
});

// Calculation endpoint
app.post('/api/calculate', (req, res) => {
  const { num1, operator, num2 } = req.body;

  if (num1 === undefined || num2 === undefined || !operator) {
    return res.status(400).json({
      success: false,
      error: 'Missing parameters. Please provide num1, operator, and num2.'
    });
  }

  const n1 = parseFloat(num1);
  const n2 = parseFloat(num2);

  if (isNaN(n1) || isNaN(n2)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid numbers provided.'
    });
  }

  let result;
  let opSymbol = operator;

  switch (operator) {
    case '+':
    case 'add':
      result = cleanFloat(n1 + n2);
      opSymbol = '+';
      break;

    case '-':
    case '−':
    case 'sub':
    case 'subtract':
      result = cleanFloat(n1 - n2);
      opSymbol = '−';
      break;

    case '*':
    case '×':
    case 'mul':
    case 'multiply':
      result = cleanFloat(n1 * n2);
      opSymbol = '×';
      break;

    case '/':
    case '÷':
    case 'div':
    case 'divide':
      if (n2 === 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot divide by zero'
        });
      }
      result = cleanFloat(n1 / n2);
      opSymbol = '÷';
      break;

    default:
      return res.status(400).json({
        success: false,
        error: `Unsupported operator: ${operator}. Supported: +, −, ×, ÷`
      });
  }

  const calculationEntry = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
    num1: n1,
    operator: opSymbol,
    num2: n2,
    result,
    expression: `${n1} ${opSymbol} ${n2} = ${result}`,
    timestamp: new Date().toISOString()
  };

  // Prepend to history and limit size
  calculationHistory.unshift(calculationEntry);
  if (calculationHistory.length > MAX_HISTORY) {
    calculationHistory.pop();
  }

  return res.json({
    success: true,
    ...calculationEntry
  });
});

// History endpoints
app.get('/api/history', (req, res) => {
  res.json({
    success: true,
    history: calculationHistory
  });
});

app.delete('/api/history', (req, res) => {
  calculationHistory = [];
  res.json({
    success: true,
    message: 'History cleared'
  });
});

// Fallback to index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Calculator server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
