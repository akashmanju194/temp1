# Full-Stack Calculator App

A modern, responsive full-stack calculator built with HTML, CSS, JavaScript, and an Express.js backend.

## Features

- **Standard Arithmetic Operations**: Addition (`+`), Subtraction (`−`), Multiplication (`×`), and Division (`÷`).
- **Input Keys**: Numbers `0` through `9`, Decimal (`.`), and sign toggle (`+/−</button>`).
- **Utility Features**: Clear all (`AC`), Percentage (`%`), Backspace (`⌫`), and tactile sound feedback.
- **Backend API**: Calculations are sent to and verified by a Node.js Express backend (`POST /api/calculate`).
- **Calculation History**: Calculation history is tracked and stored in the backend with a slide-out drawer (`GET /api/history`, `DELETE /api/history`). Clicking any previous entry re-populates the calculator.
- **Keyboard Support**: Full support for physical keyboards (`0-9`, `+`, `-`, `*`, `/`, `Enter` / `=`, `Backspace`, `Esc`).
- **Aesthetic Design**: Dark obsidian glassmorphic theme with clear functional button color tiers (slate for numbers, cool slate for utility, vibrant amber for operators).

## Project Structure

```
├── .gitignore
├── package.json
├── server.js              # Express API server & static file host
├── public/
│   ├── index.html         # Semantic calculator layout
│   ├── style.css          # Modern dark-mode styling & micro-animations
│   └── app.js             # Client interactivity, keyboard events & API sync
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
npm install
```

### Run Locally
```bash
npm start
```

Then open your browser and navigate to:
```
http://localhost:3000
```
