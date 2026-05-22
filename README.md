# 🏡 Soroban Family Fund

A decentralized household financial management application built on the Stellar Soroban network. Automate chores, manage allowances, and introduce your family to Web3!

## 🚀 Features
- **Role-based Access**: Admin (Parents) and Members (Children).
- **Task & Reward System**: Assign chores and automatically disburse funds upon completion.
- **Automated Allowances**: Time-locked monthly or weekly allowances.
- **Transfer Requests**: Members can request funds for specific needs.

## 🛠 Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/) & `wasm32-unknown-unknown` target
- [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup)
- [Freighter Wallet](https://www.freighter.app/) extension (with Experimental Mode enabled and on Testnet)

## 📦 Installation & Setup

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/family-fund.git
cd family-fund
```

**2. Build & Deploy Smart Contract**
```bash
# Build the contract to WASM
make build

# Setup Testnet account and deploy
make deploy-testnet
```

**3. Run the Frontend**
```bash
# Start the Vite React app
make dev
```
The application will be available at `http://localhost:5173`. Connect your Freighter wallet to start managing your family fund!
