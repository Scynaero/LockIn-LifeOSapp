package com.lockin.db

import app.cash.sqldelight.db.SqlDriver

expect class DatabaseDriverFactory {
    fun createDriver(): SqlDriver
}

fun createDatabase(driverFactory: DatabaseDriverFactory): LockinDatabase {
    val driver = driverFactory.createDriver()

    // Enable WAL mode and foreign keys
    driver.execute(null, "PRAGMA journal_mode = WAL", 0)
    driver.execute(null, "PRAGMA foreign_keys = ON", 0)

    return LockinDatabase(driver)
}
