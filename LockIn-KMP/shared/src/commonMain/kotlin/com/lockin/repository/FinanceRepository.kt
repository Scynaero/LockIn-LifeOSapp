package com.lockin.repository

import com.lockin.db.LockinDatabase
import com.lockin.model.*
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.todayIn
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

@OptIn(ExperimentalUuidApi::class)
class FinanceRepository(private val database: LockinDatabase) {

    // --- Expenses ---

    fun addExpense(amount: Double, category: String, date: String, note: String?, isRecurring: Boolean): String {
        val id = Uuid.random().toString()
        database.expensesQueries.insertExpense(
            id = id,
            amount = amount,
            category = category,
            date = date,
            note = note,
            is_recurring = if (isRecurring) 1 else 0
        )
        return id
    }

    fun getAllExpenses(): List<Expense> {
        return database.expensesQueries.getAllExpenses().executeAsList().map { mapExpense(it) }
    }

    fun getExpensesByMonth(yearMonth: String): List<Expense> {
        return database.expensesQueries.getExpensesByMonth("$yearMonth%").executeAsList().map { mapExpense(it) }
    }

    fun deleteExpense(id: String) {
        database.expensesQueries.deleteExpense(id)
    }

    fun getExpenseSummaryByMonth(yearMonth: String): List<Pair<String, Double>> {
        return database.expensesQueries.getExpenseSummaryByMonth("$yearMonth%").executeAsList().map {
            Pair(it.category, it.total ?: 0.0)
        }
    }

    fun getTotalSpentByMonth(yearMonth: String): Double {
        return database.expensesQueries.getTotalSpentByMonth("$yearMonth%").executeAsOneOrNull()?.total ?: 0.0
    }

    // --- Debts ---

    fun addDebt(personName: String, amount: Double, type: String, relatedExpenseId: String?, date: String): String {
        val id = Uuid.random().toString()
        database.debtsQueries.insertDebt(
            id = id,
            person_name = personName,
            amount = amount,
            type = type,
            status = "pending",
            related_expense_id = relatedExpenseId,
            date = date
        )
        return id
    }

    fun getAllDebts(): List<Debt> {
        return database.debtsQueries.getAllDebts().executeAsList().map { mapDebt(it) }
    }

    fun getPendingDebts(): List<Debt> {
        return database.debtsQueries.getPendingDebts().executeAsList().map { mapDebt(it) }
    }

    fun getOwedToMe(): List<Debt> {
        return database.debtsQueries.getOwedToMe().executeAsList().map { mapDebt(it) }
    }

    fun getIOwe(): List<Debt> {
        return database.debtsQueries.getIOwe().executeAsList().map { mapDebt(it) }
    }

    fun getTotalOwedToMe(): Double {
        return database.debtsQueries.getTotalOwedToMe().executeAsOneOrNull()?.total ?: 0.0
    }

    fun getTotalIOwe(): Double {
        return database.debtsQueries.getTotalIOwe().executeAsOneOrNull()?.total ?: 0.0
    }

    fun settleDebt(id: String) {
        database.debtsQueries.settleDebt(id)
    }

    fun updateDebtAmount(id: String, amount: Double) {
        database.debtsQueries.updateDebtAmount(amount = amount, id = id)
    }

    fun deleteDebt(id: String) {
        database.debtsQueries.deleteDebt(id)
    }

    // --- Subscriptions ---

    fun getAllSubscriptions(): List<Subscription> {
        return database.subscriptionsQueries.getAllSubscriptions().executeAsList().map { s ->
            Subscription(
                id = s.id,
                name = s.name,
                amount = s.amount,
                billingCycle = s.billing_cycle,
                nextBillingDate = s.next_billing_date
            )
        }
    }

    fun addSubscription(name: String, amount: Double, billingCycle: String, nextBillingDate: String): String {
        val id = Uuid.random().toString()
        database.subscriptionsQueries.insertSubscription(
            id = id, name = name, amount = amount,
            billing_cycle = billingCycle, next_billing_date = nextBillingDate
        )
        return id
    }

    // --- Finance Periods & Budgets ---

    fun getFinancePeriod(month: Int, year: Int): FinancePeriod? {
        val p = database.financePeriodsQueries.getByMonthYear(month.toLong(), year.toLong())
            .executeAsOneOrNull() ?: return null
        return FinancePeriod(
            id = p.id,
            month = p.month.toInt(),
            year = p.year.toInt(),
            incomeAmount = p.income_amount,
            createdAt = p.created_at
        )
    }

    fun setIncome(month: Int, year: Int, amount: Double): String {
        val existing = getFinancePeriod(month, year)
        if (existing != null) {
            database.financePeriodsQueries.updateIncome(income_amount = amount, id = existing.id)
            return existing.id
        }
        val id = Uuid.random().toString()
        database.financePeriodsQueries.upsertPeriod(
            id = id,
            month = month.toLong(),
            year = year.toLong(),
            income_amount = amount,
            created_at = Clock.System.now().toString()
        )
        return id
    }

    fun setBudget(periodId: String, category: String, limitAmount: Double) {
        val id = Uuid.random().toString()
        database.financeBudgetsQueries.upsertBudget(
            id = id,
            category = category,
            limit_amount = limitAmount,
            period_id = periodId
        )
    }

    fun getBudgetsForPeriod(periodId: String): List<Budget> {
        return database.financeBudgetsQueries.getBudgetsForPeriod(periodId).executeAsList().map { b ->
            Budget(
                id = b.id,
                category = b.category,
                limitAmount = b.limit_amount,
                periodId = b.period_id
            )
        }
    }

    // --- Currency ---

    fun getCurrency(): String {
        return database.userMetaQueries.getValue("currency").executeAsOneOrNull() ?: "INR"
    }

    fun setCurrency(code: String) {
        database.userMetaQueries.upsert(key = "currency", value_ = code)
    }

    // --- Recent Transactions (combined expenses + debts) ---

    fun getRecentTransactions(limit: Int = 5): List<Any> {
        val expenses = getAllExpenses().take(limit)
        val debts = getPendingDebts().take(limit)
        return (expenses + debts).sortedByDescending {
            when (it) {
                is Expense -> it.date
                is Debt -> it.date
                else -> ""
            }
        }.take(limit)
    }

    // --- Helpers ---

    private fun mapExpense(e: com.lockin.db.Expenses): Expense {
        return Expense(
            id = e.id,
            amount = e.amount,
            category = e.category,
            date = e.date,
            note = e.note,
            isRecurring = e.is_recurring != 0L
        )
    }

    private fun mapDebt(d: com.lockin.db.Debts): Debt {
        return Debt(
            id = d.id,
            personName = d.person_name,
            amount = d.amount,
            type = d.type,
            status = d.status,
            relatedExpenseId = d.related_expense_id,
            date = d.date
        )
    }
}
