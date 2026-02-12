package com.lockin.usecase.finance

import com.lockin.model.Expense
import com.lockin.repository.FinanceRepository
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.todayIn

class ExpenseUseCase(private val repository: FinanceRepository) {

    fun addExpense(
        amount: Double,
        category: String,
        note: String?,
        date: String? = null,
        isRecurring: Boolean = false
    ): String {
        val expenseDate = date ?: Clock.System.todayIn(TimeZone.currentSystemDefault()).toString()
        return repository.addExpense(amount, category, expenseDate, note, isRecurring)
    }

    fun getExpensesForMonth(month: Int, year: Int): List<Expense> {
        val yearMonth = "${year}-${month.toString().padStart(2, '0')}"
        return repository.getExpensesByMonth(yearMonth)
    }

    fun getRecentExpenses(limit: Int = 5): List<Expense> {
        return repository.getAllExpenses().sortedByDescending { it.date }.take(limit)
    }

    fun deleteExpense(id: String) {
        repository.deleteExpense(id)
    }

    fun getCategoryBreakdown(month: Int, year: Int): List<Pair<String, Double>> {
        val yearMonth = "${year}-${month.toString().padStart(2, '0')}"
        return repository.getExpenseSummaryByMonth(yearMonth)
            .sortedByDescending { it.second }
    }

    fun getTotalSpending(month: Int, year: Int): Double {
        val yearMonth = "${year}-${month.toString().padStart(2, '0')}"
        return repository.getTotalSpentByMonth(yearMonth)
    }
}
