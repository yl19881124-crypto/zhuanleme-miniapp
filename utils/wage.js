function calcSecondIncome(hourSalary = 0) {
  return Number(hourSalary) / 3600;
}

function formatMoney(value, hide = false) {
  if (hide) return '***';
  return Number(value || 0).toFixed(2);
}

module.exports = { calcSecondIncome, formatMoney };
