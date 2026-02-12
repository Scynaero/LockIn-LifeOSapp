package com.lockin.util

object CurrencyUtils {

    private val currencySymbols = mapOf(
        "INR" to "₹",
        "USD" to "$",
        "EUR" to "€",
        "GBP" to "£",
        "JPY" to "¥",
        "CNY" to "¥",
        "KRW" to "₩",
        "AUD" to "A$",
        "CAD" to "C$",
        "SGD" to "S$",
        "HKD" to "HK$",
        "CHF" to "CHF",
        "SEK" to "kr",
        "NOK" to "kr",
        "DKK" to "kr",
        "NZD" to "NZ$",
        "ZAR" to "R",
        "BRL" to "R$",
        "MXN" to "MX$",
        "THB" to "฿",
        "AED" to "د.إ",
        "SAR" to "﷼",
        "RUB" to "₽",
        "TRY" to "₺",
        "PHP" to "₱",
        "IDR" to "Rp",
        "MYR" to "RM",
        "VND" to "₫",
        "TWD" to "NT$"
    )

    fun getSymbol(code: String): String {
        return currencySymbols[code] ?: code
    }

    fun getAllCurrencies(): List<Pair<String, String>> {
        return currencySymbols.entries.map { (code, symbol) -> Pair(code, symbol) }
            .sortedBy { it.first }
    }

    fun formatAmount(amount: Double, currencyCode: String): String {
        val symbol = getSymbol(currencyCode)
        return if (amount == amount.toLong().toDouble()) {
            "$symbol${amount.toLong()}"
        } else {
            "$symbol${"%.2f".format(amount)}"
        }
    }
}
