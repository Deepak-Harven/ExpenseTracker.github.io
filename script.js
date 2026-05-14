// 1. SELECT DOM ELEMENTS
const balance = document.getElementById('balance');
const resetBalanceBtn = document.getElementById('reset-balance-btn');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const incomeList = document.getElementById('income-list');
const expenseList = document.getElementById('expense-list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const reportNameInput = document.getElementById('report-name-input');
const saveDailyBtn = document.getElementById('save-daily-btn');
const saveMonthlyBtn = document.getElementById('save-monthly-btn');
const dailyReportsList = document.getElementById('daily-reports-list');
const monthlyReportsList = document.getElementById('monthly-reports-list');

// --- DYNAMIC API ROUTING ---
// If running locally, connect to the local Python server. 
// If running on GitHub Pages, connect to the live PythonAnywhere server.
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '';
const CLOUD_URL = 'https://deepak13python.pythonanywhere.com'; 

const BASE_URL = isLocalhost ? 'http://localhost:5000' : CLOUD_URL;

// Our API URLs
const API_URL = `${BASE_URL}/api/transactions`;
const REPORTS_API_URL = `${BASE_URL}/api/reports`;

// State to hold transactions and reports
let transactions = [];
let savedReports = [];

// 2. FETCH TRANSACTIONS & REPORTS FROM API
async function getTransactions() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    // Update state with database data
    transactions = data;
    
    // Re-render UI
    incomeList.innerHTML = ''; 
    expenseList.innerHTML = '';
    transactions.forEach(addTransactionDOM); 
    updateValues();
  } catch (error) {
    console.error('Error fetching transactions:', error);
  }
}

async function getSavedReports() {
  try {
    const res = await fetch(REPORTS_API_URL);
    const data = await res.json();
    savedReports = data;
    renderSavedReports();
  } catch (error) {
    console.error('Error fetching reports:', error);
  }
}

// 3. ADD TRANSACTION FUNCTION (POST)
async function addTransaction(e) {
  e.preventDefault(); 
  if (text.value.trim() === '' || amount.value.trim() === '') {
    alert('Please add a description and an amount.');
    return;
  } 

  const typeRadios = document.getElementsByName('transaction-type');
  let selectedType = 'expense';
  for (const radio of typeRadios) {
    if (radio.checked) {
      selectedType = radio.value;
      break;
    }
  }

  let parsedAmount = +amount.value;
  if (selectedType === 'expense') {
    parsedAmount = -Math.abs(parsedAmount);
  } else {
    parsedAmount = Math.abs(parsedAmount);
  }

  const newTransaction = {
    text: text.value,
    amount: parsedAmount
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTransaction)
    });
    const data = await res.json();
    transactions.push(data);
    addTransactionDOM(data);
    updateValues();
    text.value = '';
    amount.value = '';
  } catch (error) {
    console.error('Error adding transaction:', error);
  }
}

// 4. RENDER TO DOM
function addTransactionDOM(transaction) {
  const isExpense = transaction.amount < 0;
  const sign = isExpense ? '-' : '+';
  const itemClass = isExpense ? 'minus' : 'plus';
  const item = document.createElement('li');
  item.classList.add(itemClass); 
  item.innerHTML = `
    ${transaction.text} 
    <span>${sign}₹${Math.abs(transaction.amount).toFixed(2)}</span> 
    <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
  `;
  
  if (isExpense) {
    expenseList.appendChild(item);
  } else {
    incomeList.appendChild(item);
  }
}

// 6. RENDER SAVED REPORTS
function renderSavedReports() {
  dailyReportsList.innerHTML = '';
  monthlyReportsList.innerHTML = '';
  
  // Reverse the array so the newest reports show at the top
  const reversedReports = [...savedReports].reverse();
  
  reversedReports.forEach(report => {
    const reportCard = document.createElement('div');
    reportCard.classList.add('report-card');
    
    let descriptionsHtml = '';
    if (report.descriptions && report.descriptions.trim() !== '') {
      descriptionsHtml = `<p style="margin-top: 8px; font-size: 0.85rem; color: var(--text-primary);"><strong>Items:</strong> ${report.descriptions}</p>`;
    }
    
    reportCard.innerHTML = `
      <h4>${report.name}</h4>
      <p>Income: +₹${parseFloat(report.income).toFixed(2)}</p>
      <p>Expense: -₹${parseFloat(report.expense).toFixed(2)}</p>
      <div class="report-balance">Balance: ₹${parseFloat(report.balance).toFixed(2)}</div>
      ${descriptionsHtml}
      <button class="report-delete-btn" onclick="deleteReport('${report.id}')">x</button>
    `;
    
    if (report.type === 'daily') {
      dailyReportsList.appendChild(reportCard);
    } else {
      monthlyReportsList.appendChild(reportCard);
    }
  });
}

// 3. UPDATE BALANCE, INCOME AND EXPENSE
function updateValues() {
  const amounts = transactions.map(transaction => parseFloat(transaction.amount));
  
  // Calculate raw total from active transactions
  const rawTotal = amounts.reduce((acc, item) => (acc += item), 0);
  
  // Subtract any carried over expenses from previous Daily Saves (stored invisibly)
  const carriedOverExpense = parseFloat(localStorage.getItem('carriedOverExpense')) || 0;
  const total = (rawTotal - carriedOverExpense).toFixed(2);
  
  const income = amounts.filter(item => item > 0).reduce((acc, item) => (acc += item), 0).toFixed(2);
  const expense = (amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1).toFixed(2);

  balance.innerText = `₹${total}`;
  money_plus.innerText = `+₹${income}`;
  money_minus.innerText = `-₹${expense}`;
  
  return { total, income, expense };
}

// 6. DELETE TRANSACTION (DELETE)
async function removeTransaction(id) {
  try {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    // Remove from local state
    transactions = transactions.filter(transaction => transaction.id !== id);
    
    // Re-render UI
    incomeList.innerHTML = '';
    expenseList.innerHTML = '';
    transactions.forEach(addTransactionDOM);
    updateValues();
  } catch (error) {
    console.error('Error deleting transaction:', error);
  }
}

// 6.5 DELETE REPORT (DELETE)
async function deleteReport(id) {
  try {
    await fetch(`${REPORTS_API_URL}/${id}`, { method: 'DELETE' });
    savedReports = savedReports.filter(report => report.id !== id);
    renderSavedReports();
  } catch (error) {
    console.error('Error deleting report:', error);
  }
}

// 7. SAVE SNAPSHOT TO CSV
let isSaving = false;

async function saveSnapshot(type) {
  if (isSaving) return;
  
  const name = reportNameInput.value.trim();
  if (!name) {
    alert("Please enter a Report Name first.");
    return;
  }

  isSaving = true;
  saveDailyBtn.disabled = true;
  saveMonthlyBtn.disabled = true;
  saveDailyBtn.style.opacity = '0.6';
  saveMonthlyBtn.style.opacity = '0.6';

  const currentTotals = updateValues();
  
  // Gather descriptions for daily reports
  let descriptionsStr = '';
  if (type === 'daily') {
    const expenseDescriptions = transactions
      .filter(t => t.amount < 0)
      .map(t => `${t.text} (₹${Math.abs(t.amount).toFixed(2)})`);
    descriptionsStr = expenseDescriptions.join(', ');
  }
  
  const reportData = {
    name: name,
    type: type,
    income: currentTotals.income,
    expense: currentTotals.expense,
    balance: currentTotals.total,
    descriptions: descriptionsStr
  };

  try {
    const res = await fetch(REPORTS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    
    if (res.ok) {
      // Clear input and refresh
      reportNameInput.value = '';
      getSavedReports();
      
      // If saving a daily report, ONLY delete expenses and leave everything else exactly as it is
      if (type === 'daily') {
        const expenses = transactions.filter(t => t.amount < 0);
        let dailyExpenseTotal = 0;
        
        // Delete all expenses from backend and sum them up
        for (const expense of expenses) {
          dailyExpenseTotal += Math.abs(expense.amount);
          await fetch(`${API_URL}/${expense.id}`, { method: 'DELETE' });
        }
        
        // Save the deleted expenses into localStorage so the Balance stays mathematically accurate
        let currentCarried = parseFloat(localStorage.getItem('carriedOverExpense')) || 0;
        localStorage.setItem('carriedOverExpense', currentCarried + dailyExpenseTotal);
        
        // Refresh the UI. Incomes will remain totally untouched, and expenses will be cleared!
        getTransactions();
      } else if (type === 'monthly') {
        // If saving a monthly report, wipe all transactions for a clean slate
        for (const t of transactions) {
          await fetch(`${API_URL}/${t.id}`, { method: 'DELETE' });
        }
        localStorage.removeItem('carriedOverExpense'); // Reset the invisible carry-over
        // Refresh to show empty state
        getTransactions();
      }
    } else {
      alert("Error saving report.");
    }
  } catch (error) {
    console.error('Error saving report:', error);
  } finally {
    isSaving = false;
    saveDailyBtn.disabled = false;
    saveMonthlyBtn.disabled = false;
    saveDailyBtn.style.opacity = '1';
    saveMonthlyBtn.style.opacity = '1';
  }
}

// 8. RESET BALANCE
async function resetBalance() {
  if (confirm("Are you sure you want to reset your balance to ₹0.00? This will permanently delete all active transactions.")) {
    for (const t of transactions) {
      await fetch(`${API_URL}/${t.id}`, { method: 'DELETE' });
    }
    localStorage.removeItem('carriedOverExpense'); // Reset the invisible carry-over
    getTransactions();
  }
}

// 9. INITIALIZE APP
function init() {
  getTransactions(); 
  getSavedReports();
}

init();

form.addEventListener('submit', addTransaction);
saveDailyBtn.addEventListener('click', () => saveSnapshot('daily'));
saveMonthlyBtn.addEventListener('click', () => saveSnapshot('monthly'));
resetBalanceBtn.addEventListener('click', resetBalance);
