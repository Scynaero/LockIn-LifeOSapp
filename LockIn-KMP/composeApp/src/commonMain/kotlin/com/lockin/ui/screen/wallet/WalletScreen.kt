package com.lockin.ui.screen.wallet

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.TrendingDown
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.lockin.model.Expense
import com.lockin.model.Debt
import com.lockin.repository.FinanceRepository
import com.lockin.ui.theme.Background
import com.lockin.ui.theme.Error
import com.lockin.ui.theme.Primary
import com.lockin.ui.theme.Surface
import com.lockin.ui.theme.SurfaceHighlight
import com.lockin.ui.theme.TextPrimary
import com.lockin.ui.theme.TextSecondary
import com.lockin.util.CurrencyUtils
import org.koin.compose.koinInject

class WalletScreen : Screen {
    @Composable
    override fun Content() {
        val screenModel = getScreenModel<WalletScreenModel>()
        val state by screenModel.state.collectAsState()
        val navigator = LocalNavigator.currentOrThrow
        val financeRepo: FinanceRepository = koinInject()
        val currency = remember { financeRepo.getCurrency() }

        var showAddDialog by remember { mutableStateOf(false) }
        var showIncomeDialog by remember { mutableStateOf(false) }

        // Add Transaction Dialog
        if (showAddDialog) {
            AddTransactionDialog(
                currency = currency,
                onAddExpense = { amount, category, note ->
                    screenModel.addExpense(amount, category, note, false)
                    showAddDialog = false
                },
                onAddDebt = { person, amount, type ->
                    val debtType = if (type == "owed_to_me") DebtType.OWED_TO_ME else DebtType.I_OWE
                    screenModel.addDebt(person, amount, debtType)
                    showAddDialog = false
                },
                onDismiss = { showAddDialog = false }
            )
        }

        // Income Dialog
        if (showIncomeDialog) {
            IncomeDialog(
                currentIncome = state.currentPeriod?.incomeAmount ?: 0.0,
                currency = currency,
                onSave = { amount ->
                    screenModel.setIncome(amount)
                    showIncomeDialog = false
                },
                onDismiss = { showIncomeDialog = false }
            )
        }

        Scaffold(
            containerColor = Background,
            floatingActionButton = {
                FloatingActionButton(
                    onClick = { showAddDialog = true },
                    containerColor = Primary,
                    contentColor = Color.Black,
                    shape = CircleShape
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add Transaction")
                }
            }
        ) { paddingValues ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Header
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 16.dp, bottom = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "WALLET",
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Bold,
                            color = Primary,
                            letterSpacing = (-2).sp
                        )
                        // History button
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(SurfaceHighlight)
                                .clickable { navigator.push(TransactionHistoryScreen()) }
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.History, "History", tint = TextSecondary, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("History", fontSize = 13.sp, color = TextSecondary, fontWeight = FontWeight.Medium)
                        }
                    }
                }

                // Income & Spending Overview Card
                item {
                    val income = state.currentPeriod?.incomeAmount ?: 0.0
                    val totalSpent = state.budgetStatuses.sumOf { it.spent }
                    val remaining = income - totalSpent
                    val spendPercent = if (income > 0) (totalSpent / income).toFloat().coerceIn(0f, 1f) else 0f

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Surface)
                            .padding(16.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("MONTHLY OVERVIEW", fontSize = 10.sp, color = TextSecondary, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
                            Text(
                                "Set Income",
                                fontSize = 12.sp,
                                color = Primary,
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .clickable { showIncomeDialog = true }
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(12.dp))

                        // Income
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Income", color = TextSecondary, fontSize = 12.sp)
                                Text(
                                    CurrencyUtils.formatAmount(income, currency),
                                    color = TextPrimary,
                                    fontSize = 22.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("Remaining", color = TextSecondary, fontSize = 12.sp)
                                Text(
                                    CurrencyUtils.formatAmount(remaining, currency),
                                    color = if (remaining >= 0) Primary else Error,
                                    fontSize = 22.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Progress bar
                        LinearProgressIndicator(
                            progress = { spendPercent },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp)),
                            color = if (spendPercent > 0.9f) Error else Primary,
                            trackColor = SurfaceHighlight,
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            "Spent ${CurrencyUtils.formatAmount(totalSpent, currency)} of ${CurrencyUtils.formatAmount(income, currency)}",
                            color = TextSecondary,
                            fontSize = 11.sp
                        )
                    }
                }

                // Debt Summary
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Owed to me
                        DebtCard(
                            label = "Owed To Me",
                            amount = state.owedToMe,
                            currency = currency,
                            color = Primary,
                            icon = Icons.Default.TrendingUp,
                            modifier = Modifier.weight(1f)
                        )
                        // I Owe
                        DebtCard(
                            label = "I Owe",
                            amount = state.iOwe,
                            currency = currency,
                            color = Error,
                            icon = Icons.Default.TrendingDown,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                // Budget Breakdown
                if (state.budgetStatuses.isNotEmpty()) {
                    item {
                        Text(
                            "BUDGETS",
                            fontSize = 10.sp,
                            color = TextSecondary,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 2.sp,
                            modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
                        )
                    }
                    items(state.budgetStatuses) { budget ->
                        BudgetCard(budget = budget, currency = currency)
                    }
                }

                // Recent Transactions
                item {
                    Text(
                        "RECENT",
                        fontSize = 10.sp,
                        color = TextSecondary,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 2.sp,
                        modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
                    )
                }

                if (state.recentTransactions.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(Surface)
                                .padding(24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("No transactions yet", color = TextSecondary, fontSize = 14.sp)
                        }
                    }
                }

                items(state.recentTransactions) { txn ->
                    when (txn) {
                        is Expense -> ExpenseRow(expense = txn, currency = currency)
                        is Debt -> DebtRow(debt = txn, currency = currency, onSettle = { screenModel.settleDebt(txn.id) })
                    }
                }

                item { Spacer(modifier = Modifier.height(80.dp)) }
            }
        }
    }
}

@Composable
private fun DebtCard(
    label: String,
    amount: Double,
    currency: String,
    color: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(Surface)
            .padding(14.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = color, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text(label, color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            CurrencyUtils.formatAmount(amount, currency),
            color = color,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun BudgetCard(
    budget: com.lockin.usecase.finance.BudgetStatus,
    currency: String
) {
    val progress = (budget.usagePercent / 100f).coerceIn(0f, 1f)
    val progressColor = when {
        budget.usagePercent > 90f -> Error
        budget.usagePercent > 70f -> Color(0xFFF59E0B) // amber
        else -> Primary
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Surface)
            .padding(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(budget.category, color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Text(
                "${budget.usagePercent.toInt()}%",
                color = progressColor,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier
                .fillMaxWidth()
                .height(4.dp)
                .clip(RoundedCornerShape(2.dp)),
            color = progressColor,
            trackColor = SurfaceHighlight,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                "Spent: ${CurrencyUtils.formatAmount(budget.spent, currency)}",
                color = TextSecondary,
                fontSize = 11.sp
            )
            Text(
                "Limit: ${CurrencyUtils.formatAmount(budget.limit, currency)}",
                color = TextSecondary,
                fontSize = 11.sp
            )
        }
    }
}

@Composable
private fun ExpenseRow(expense: Expense, currency: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Surface)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(expense.category, color = TextPrimary, fontWeight = FontWeight.Medium, fontSize = 14.sp)
            if (!expense.note.isNullOrBlank()) {
                Text(expense.note, color = TextSecondary, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(
                CurrencyUtils.formatAmount(expense.amount, currency),
                color = Error,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
            Text(expense.date.takeLast(5), color = TextSecondary, fontSize = 11.sp)
        }
    }
}

@Composable
private fun DebtRow(debt: Debt, currency: String, onSettle: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Surface)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(debt.personName, color = TextPrimary, fontWeight = FontWeight.Medium, fontSize = 14.sp)
            Text(
                if (debt.type == "owed_to_me") "Owes you" else "You owe",
                color = if (debt.type == "owed_to_me") Primary else Error,
                fontSize = 12.sp
            )
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(
                CurrencyUtils.formatAmount(debt.amount, currency),
                color = if (debt.type == "owed_to_me") Primary else Error,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
            if (debt.status == "pending") {
                Text(
                    "Settle",
                    color = Primary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .clickable { onSettle() }
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                )
            }
        }
    }
}
