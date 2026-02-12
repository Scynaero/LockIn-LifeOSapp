package com.lockin.model

data class Expense(
    val id: String,
    val amount: Double,
    val category: String,
    val date: String,
    val note: String? = null,
    val isRecurring: Boolean = false
)

data class Debt(
    val id: String,
    val personName: String,
    val amount: Double,
    val type: String, // "owed_to_me" or "i_owe"
    val status: String = "pending", // "pending" or "paid"
    val relatedExpenseId: String? = null,
    val date: String
)

data class Subscription(
    val id: String,
    val name: String,
    val amount: Double,
    val billingCycle: String, // "monthly" or "yearly"
    val nextBillingDate: String
)

data class FinancePeriod(
    val id: String,
    val month: Int,
    val year: Int,
    val incomeAmount: Double = 0.0,
    val createdAt: String? = null
)

data class Budget(
    val id: String,
    val category: String,
    val limitAmount: Double,
    val periodId: String,
    val spent: Double = 0.0 // computed field
)

data class MonthlyOverview(
    val income: Double,
    val spent: Double,
    val remaining: Double,
    val budgets: List<Budget>
)

data class ExpenseSummaryItem(
    val category: String,
    val total: Double,
    val color: Long // Compose Color long value
)
