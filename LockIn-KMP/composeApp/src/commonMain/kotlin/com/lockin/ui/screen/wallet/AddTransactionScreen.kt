package com.lockin.ui.screen.wallet

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.lockin.repository.FinanceRepository
import com.lockin.ui.theme.Background
import com.lockin.ui.theme.TextPrimary
import com.lockin.usecase.finance.DebtType
import org.koin.compose.koinInject

class AddTransactionScreen : Screen {

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val screenModel = getScreenModel<WalletScreenModel>()
        val navigator = LocalNavigator.currentOrThrow
        val financeRepo: FinanceRepository = koinInject()
        val currency = remember { financeRepo.getCurrency() }

        Scaffold(
            containerColor = Background,
            topBar = {
                TopAppBar(
                    title = { Text("Add Transaction", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = TextPrimary)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Background)
                )
            }
        ) { padding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .background(Background)
            ) {
                AddTransactionDialog(
                    currency = currency,
                    onAddExpense = { amount, category, note ->
                        screenModel.addExpense(amount, category, note, false)
                        navigator.pop()
                    },
                    onAddDebt = { person, amount, type ->
                        val debtType = if (type == "owed_to_me") DebtType.OWED_TO_ME else DebtType.I_OWE
                        screenModel.addDebt(person, amount, debtType)
                        navigator.pop()
                    },
                    onDismiss = { navigator.pop() }
                )
            }
        }
    }
}
