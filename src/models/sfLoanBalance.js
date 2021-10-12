const mongoose = require('mongoose')

const sfLoanBalanceSchema = new mongoose.Schema({
  date: { type: Date },
  balance: { type: Number },
  direct_repayments: { type: Number },
  salary_repayments: { type: Number },
  interest_added: { type: Number },
  interest: { type: Number }
});

const sfLoanBalanceModel = mongoose.model('sfLoanBalance', sfLoanBalanceSchema);

module.exports = sfLoanBalanceModel