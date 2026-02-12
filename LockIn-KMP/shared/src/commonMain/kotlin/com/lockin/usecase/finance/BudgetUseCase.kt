package com.lockin.usecase.finance

import com.lockin.model.Budget
import com.lockin.model.FinancePeriod
import com.lockin.repository.FinanceRepository
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.todayIn

data class BudgetStatus(
    val category: String,
    val limit: Double,
    val spent: Double,
    val remaining: Double,
    val usagePercent: Float
)
class BudgetUseCase(private val repository: FinanceRepository) {

    fun getCurrentPeriod(): FinancePeriod {
        val today = Clock.System.todayIn(TimeZone.currentSystemDefault())
        return getCreatePeriod(today.monthNumber, today.year)
    }

    fun getBudgetsForPeriod(periodId: String): List<Budget> {
        return repository.getBudgetsForPeriod(periodId)
    }

    fun getBudgetStatus(month: Int, year: Int): List<BudgetStatus> {
        val period = getCreatePeriod(month, year)
        val budgets = repository.getBudgetsForPeriod(period.id)
        val expenses = repository.getExpensesByMonth("${year}-${month.toString().padStart(2, '0')}")

        return budgets.map { budget ->
            val spent = expenses.filter { it.category == budget.category }.sumOf { it.amount }
            BudgetStatus(
                category = budget.category,
                limit = budget.limitAmount,
                spent = spent,
                remaining = budget.limitAmount - spent,
                usagePercent = if (budget.limitAmount > 0) ((spent / budget.limitAmount) * 100).toFloat() else 0f
            )
        }
    }

    fun setIncome(amount: Double) {
        val today = Clock.System.todayIn(TimeZone.currentSystemDefault())
        repository.setIncome(today.monthNumber, today.year, amount)
    }

    fun setBudget(category: String, limit: Double) {
        val period = getCurrentPeriod()
        repository.setBudget(period.id, category, limit)
    }

    private fun getCreatePeriod(month: Int, year: Int): FinancePeriod {
        var period = repository.getFinancePeriod(month, year)
        if (period == null) {
            repository.setIncome(month, year, 0.0) // Creates period
            period = repository.getFinancePeriod(month, year)!!
        }
        return period
    }
}
