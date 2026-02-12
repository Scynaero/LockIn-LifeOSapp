package com.lockin.ui.screen.wallet

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.lockin.model.Budget
import com.lockin.model.Debt
import com.lockin.model.FinancePeriod
import com.lockin.usecase.finance.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.todayIn

data class WalletUiState(
    val currentPeriod: FinancePeriod? = null,
    val budgetStatuses: List<BudgetStatus> = emptyList(),
    val budgets: List<Budget> = emptyList(),
    val recentTransactions: List<Any> = emptyList(), // Expense or Debt
    val owedToMe: Double = 0.0,
    val iOwe: Double = 0.0,
    val isLoading: Boolean = true
)

class WalletScreenModel(
    private val expenseUseCase: ExpenseUseCase,
    private val debtUseCase: DebtUseCase,
    private val budgetUseCase: BudgetUseCase
) : ScreenModel {

    private val _state = MutableStateFlow(WalletUiState())
    val state: StateFlow<WalletUiState> = _state.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            val today = Clock.System.todayIn(TimeZone.currentSystemDefault())
            val month = today.monthNumber
            val year = today.year

            val period = budgetUseCase.getCurrentPeriod()
            val budgetStatuses = budgetUseCase.getBudgetStatus(month, year)
            val budgets = budgetUseCase.getBudgetsForPeriod(period.id)
            val expenses = expenseUseCase.getRecentExpenses(5)
            // Combine expenses and debts for recent activity if needed, or just show expenses separately
            // For now, let's just fetch recent expenses
            
            val owedToMe = debtUseCase.getTotalOwedToMe()
            val iOwe = debtUseCase.getTotalIOwe()

            _state.update {
                it.copy(
                    currentPeriod = period,
                    budgetStatuses = budgetStatuses,
                    budgets = budgets,
                    recentTransactions = expenses, // Simplified for now
                    owedToMe = owedToMe,
                    iOwe = iOwe,
                    isLoading = false
                )
            }
        }
    }

    fun addExpense(amount: Double, category: String, note: String?, isRecurring: Boolean) {
        screenModelScope.launch {
            expenseUseCase.addExpense(amount, category, note, isRecurring = isRecurring)
            loadData()
        }
    }

    fun addDebt(person: String, amount: Double, type: DebtType) {
        screenModelScope.launch {
            debtUseCase.addDebt(person, amount, type)
            loadData()
        }
    }

    fun setIncome(amount: Double) {
        screenModelScope.launch {
            budgetUseCase.setIncome(amount)
            loadData()
        }
    }

    fun setBudget(category: String, limit: Double) {
        screenModelScope.launch {
            budgetUseCase.setBudget(category, limit)
            loadData()
        }
    }
    
    fun settleDebt(id: String) {
        screenModelScope.launch {
            debtUseCase.settleDebt(id)
            loadData()
        }
    }
}
