package com.lockin.usecase.finance

import com.lockin.model.Debt
import com.lockin.repository.FinanceRepository
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.todayIn

enum class DebtType {
    OWED_TO_ME,
    I_OWE
}

class DebtUseCase(private val repository: FinanceRepository) {

    fun addDebt(
        personName: String,
        amount: Double,
        type: DebtType,
        note: String? = null
    ): String {
        val today = Clock.System.todayIn(TimeZone.currentSystemDefault()).toString()
        val typeStr = if (type == DebtType.OWED_TO_ME) "owed_to_me" else "i_owe"
        return repository.addDebt(personName, amount, typeStr, null, today)
    }

    fun getOwedToMe(): List<Debt> {
        return repository.getOwedToMe()
    }

    fun getIOwe(): List<Debt> {
        return repository.getIOwe()
    }

    fun getTotalOwedToMe(): Double {
        return repository.getTotalOwedToMe()
    }

    fun getTotalIOwe(): Double {
        return repository.getTotalIOwe()
    }

    fun settleDebt(id: String) {
        repository.settleDebt(id)
    }

    fun deleteDebt(id: String) {
        repository.deleteDebt(id)
    }
}
