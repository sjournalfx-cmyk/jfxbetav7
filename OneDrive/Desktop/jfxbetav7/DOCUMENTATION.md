# 📓 JournalFX Beta Documentation

<div align="center">

![Version](https://img.shields.io/badge/Version-Beta_2.0-orange?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-green?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Web-blue?style=for-the-badge)

**Your comprehensive trading journal for professional traders**

</div>

---

## 📋 Table of Contents

| # | Section | Description |
|---|---------|-------------|
| 1 | [🚀 Getting Started](#-getting-started) | Account creation and setup |
| 2 | [⭐ Core Features](#-core-features) | Main app functionalities |
| 3 | [🛠️ Trading Tools](#️-trading-tools) | Advanced trading features |
| 4 | [⌨️ Keyboard Shortcuts](#️-keyboard-shortcuts) | Quick action keys |
| 5 | [💳 Account & Billing](#-account--billing) | Subscription plans |
| 6 | [🔧 Troubleshooting](#-troubleshooting) | Common issues & solutions |
| 7 | [❓ FAQ](#-faq) | Frequently asked questions |
| 8 | [📖 Glossary](#-glossary) | Trading terminology |

---

## 🚀 Getting Started

### Creating Your Account

| Step | Action |
|------|--------|
| 1️⃣ | Visit JournalFX and create an account using email or OAuth (Google, GitHub) |
| 2️⃣ | Complete onboarding: select trading style, experience level, initial balance, currency |
| 3️⃣ | Choose your avatar to personalize your trading persona |

### Connecting Your Broker (MetaTrader 5)

> **⚡ Quick Setup**: For automated trade syncing, follow these steps:

```
Settings → Account Config → Generate Sync Key → Enter in JFX Bridge → Enable Auto-Journal
```

| Step | Action |
|------|--------|
| 1 | Navigate to **Settings → Account Config** |
| 2 | Generate your unique **Sync Key** |
| 3 | Download and install **JFX Bridge** |
| 4 | Enter your Sync Key in Bridge settings |
| 5 | Configure auto-journaling |

> **📌 Note**: The EA (Expert Advisor) syncs trades from MT5 to your journal in real-time.

---

## ⭐ Core Features

### 📊 Dashboard

| Feature | Description |
|---------|-------------|
| 🎯 **Trade Summary** | Today's P&L, win rate, and trade count |
| 📈 **Daily Bias** | Set market direction (Bullish/Bearish/Neutral) |
| ⚡ **Quick Actions** | Rapid access to trades, notes, screenshots |
| 📉 **Performance Widgets** | Track momentum and recent results |

### 📓 Journal

| Feature | Description |
|---------|-------------|
| 📝 **Trade Logging** | Symbol, direction, entry/exit, lot size, timestamp |
| ✏️ **Trade Editing** | Full CRUD operations |
| 📸 **Screenshots** | Attach chart snapshots |
| 🏷️ **Tags & Categories** | Organize by strategy, session, pattern |
| 📃 **Trade Notes** | Observations, emotions, lessons |

#### How to Log a Trade

```
Press [T] → Select Symbol → Choose Direction → Enter Prices → 
Set Lot Size → Add Notes → Save
```

### 📈 Analytics

| Feature | Description |
|---------|-------------|
| 📊 **Win/Loss Ratio** | Overall and per-symbol breakdown |
| 📉 **Drawdown Analysis** | Track max drawdown & recovery |
| ⏰ **Time Analysis** | Best sessions, days of week |
| 🎯 **Strategy Performance** | Compare strategies with bubble charts |
| 📑 **Monthly Reports** | PDF/CSV exports |
| 🧠 **Mindset Tracking** | P&L vs emotional states |

### 🎯 Goals

| Feature | Description |
|---------|-------------|
| 💰 **Financial Goals** | Target profit, account growth |
| 📋 **Process Goals** | Daily targets (trades, reviews) |
| 🏆 **Milestones** | Achievable steps |
| 🔄 **Auto-Tracking** | Connected to P&L metrics |

### 📝 Notes

| Feature | Description |
|---------|-------------|
| ✍️ **Create Notes** | Press `N` |
| 📌 **Pin Important** | Keep at top |
| 🎨 **Color Coding** | Categorization |
| 🔗 **Link to Trades** | Connect to trades/goals |
| 🤖 **AI Assistance** | Gemini AI generation |

### 📈 Charts

| Feature | Description |
|---------|-------------|
| 📊 **Multi-Chart Layouts** | Multiple symbols |
| 🔳 **Focus Mode** | Full-screen analysis |
| ✏️ **Drawings Persistence** | Save annotations |
| 📅 **Multi-Timeframe** | 1-min to monthly |

### 📖 Rules & Playbook

| Feature | Description |
|---------|-------------|
| ⚡ **Hard Rules** | Non-negotiable |
| 💡 **Soft Rules** | Guidelines |
| 📝 **Strategy Entries** | Entry conditions |
| 🔀 **Diagram Visualization** | Flowcharts |

---

## 🛠️ Trading Tools

### Backtest Lab

```
Load Data → Apply Rules → Run Tests → Analyze Results
```

### EA Setup

```
Generate Key → Configure Bridge → Set Preferences → Enable Auto-Journal
```

### Broker Connect

| Broker | Integration |
|--------|-------------|
| MetaTrader 5 | MetaAPI |
| Direct APIs | Real-time feeds |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `T` | New Trade |
| `N` | New Note |
| `S` | Screenshot |
| `A` | AI Assistant |
| `D` | Open Dashboard |
| `J` | Open Journal |
| `Ctrl + S` | Save Current Work |
| `Esc` | Close Modal/Drawer |

---

## 💳 Account & Billing

### Subscription Tiers

| Feature | 📝 Journaler | 💼 Analyst | 👑 Masters |
|---------|:------------:|:----------:|:----------:|
| **Trades/Month** | 50 | 500 | ∞ Unlimited |
| **Notes** | 1 | ∞ | ∞ |
| **Chart Layouts** | 1 | 2 | ∞ |
| **Analytics** | Basic | Advanced | Full |
| **EA Sync** | ❌ | ✅ | ✅ |
| **AI Insights** | ❌ | ❌ | ✅ |
| **Custom Themes** | ❌ | ❌ | ✅ |

### Upgrading Your Plan

```
Settings → Plan & Billing → Select Tier → Confirm
```

> **🎉 Beta Special**: All tiers are free during beta testing!

---

## 🔧 Troubleshooting

### ❌ Charts Not Loading

| Solution |
|----------|
| 1. Disable "Keep Charts Alive" in Appearance |
| 2. Refresh the page |
| 3. Check ad blocker isn't blocking TradingView |

### ❌ Trades Not Syncing

| Solution |
|----------|
| 1. Verify Sync Key in JFX Bridge |
| 2. Check internet connection |
| 3. Ensure MT5 is running |
| 4. Check Bridge logs |

### ❌ Can't Export Data

| Solution |
|----------|
| 1. Navigate to Analytics → Reports |
| 2. Select date range |
| 3. Choose format (CSV/PDF) |
| 4. Check browser downloads |

### ❌ Login Issues

| Solution |
|----------|
| 1. Clear cache & cookies |
| 2. Try incognito mode |
| 3. Reset password |
| 4. Check Supabase settings |

### ❌ Performance Issues

| Solution |
|----------|
| 1. Disable "Keep Charts Alive" |
| 2. Reduce open layouts |
| 3. Clear browser cache |
| 4. Upgrade to Premium |

---

## ❓ FAQ

### Q1: How do I sync trades from MT5?

> **Answer**: Go to **Account Config** tab → Generate sync key → Enter in JFX Bridge → Enable auto-sync

---

### Q2: Can I export my trading data?

> **Answer**: Yes! Navigate to **Analytics → Reports** → Click **Export** → Choose CSV or PDF

---

### Q3: How do I upgrade my plan?

> **Answer**: Visit **Settings → Plan & Billing** → Select tier → Confirm (free during beta!)

---

### Q4: Why are my charts not loading?

> **Answer**: Disable "Keep Charts Alive" in Appearance, refresh page, check ad blocker settings

---

### Q6: Can I import historical trades?

> **Answer**: Yes! Use CSV import in Journal section (requires correct format)

---

### Q7: Is my data secure?

> **Answer**: ✅ All data encrypted and stored in Supabase. We never share your trading data.

---

### Q8: How do I contact support?

> **Answer**: Use feedback form in **Settings → Help & Feedback** or join our [Telegram Channel](https://t.me/+w_KvKM5HESYyMTdk)

---

## 📖 Glossary

### Trading Terms

| Term | Definition |
|------|------------|
| **P&L** | Profit and Loss - financial result |
| **Drawdown** | Peak-to-trough decline |
| **Win Rate** | % of profitable trades |
| **Risk:Reward** | Profit:loss ratio |
| **Lot Size** | Trade volume |
| **Pip** | Price Interest Point |
| **Spread** | Bid-ask difference |
| **Slippage** | Execution price difference |

### JournalFX Terms

| Term | Definition |
|------|------------|
| **Daily Bias** | Market outlook (Bullish/Bearish/Neutral) |
| **EA** | Expert Advisor - automated script |
| **Sync Key** | Bridge connection identifier |
| **Auto-Journal** | Automatic trade logging |
| **Plan Adherence** | Rule following score |

---

## 📞 Getting Help

<div align="center">

| Resource | Link |
|----------|------|
| 📚 **Documentation** | [GitBook](https://jfxbeta.gitbook.io/docs) |
| 🎬 **Video Tutorials** | [YouTube](https://youtube.com/@jfxtrading) |
| 💬 **Telegram** | [Join Channel](https://t.me/+w_KvKM5HESYyMTdk) |
| 🐛 **GitHub** | [Report Issues](https://github.com/sjournalfx-cmyk/jfxbetav7/issues) |

</div>

---

<div align="center">

**Version**: JournalFX Beta v2.0 | **Last Updated**: February 2026 | **© 2026 JournalFX**

![Made with ❤️](https://img.shields.io/badge/Made_with-❤️-red?style=for-the-badge)

</div>
