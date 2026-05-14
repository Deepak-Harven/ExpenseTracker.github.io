let transactions = [
  {text: "Salary", amount: 1000},
  {text: "HIDDEN_ROLLOVER_EXPENSE", amount: -200},
  {text: "Bonus", amount: 500}
];

const allAmounts = transactions.map(transaction => transaction.amount);
const total = allAmounts.reduce((acc, item) => (acc += item), 0).toFixed(2);

const visibleTransactions = transactions.filter(t => t.text !== 'HIDDEN_ROLLOVER_EXPENSE');
const visibleAmounts = visibleTransactions.map(t => t.amount);

const income = visibleAmounts.filter(item => item > 0).reduce((acc, item) => (acc += item), 0).toFixed(2);
const expense = (visibleAmounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1).toFixed(2);

console.log({ total, income, expense });
