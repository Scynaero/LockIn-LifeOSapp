import { DatabaseService } from './DatabaseService';
import * as Crypto from 'expo-crypto';

export type Expense = {
    id: string;
    amount: number;
    category: string;
    date: string;
    note?: string;
    is_recurring: boolean;
};

export type Debt = {
    id: string;
    person_name: string;
    amount: number;
    type: 'owed_to_me' | 'i_owe';
    status: 'pending' | 'paid';
    related_expense_id?: string;
    date: string;
};

export type Subscription = {
    id: string;
    name: string;
    amount: number;
    billing_cycle: 'monthly' | 'yearly';
    next_billing_date: string;
};

export const FinanceService = {
    // --- Expenses ---
    addExpense: async (amount: number, category: string, date: string, note?: string, isRecurring: boolean = false) => {
        const db = DatabaseService.getDB();
        const id = Crypto.randomUUID();
        await db.runAsync(
            'INSERT INTO expenses (id, amount, category, date, note, is_recurring) VALUES (?, ?, ?, ?, ?, ?)',
            [id, amount, category, date, note || null, isRecurring ? 1 : 0]
        );
        return id;
    },

    getExpenses: async () => {
        const db = DatabaseService.getDB();
        return await db.getAllAsync<Expense>('SELECT * FROM expenses ORDER BY date DESC');
    },

    getExpensesByMonth: async (month: number, year: number) => { // month: 0-11
        const db = DatabaseService.getDB();
        const startProp = new Date(year, month, 1).toISOString();
        const endProp = new Date(year, month + 1, 0).toISOString(); // Last day of month

        // SQLite string comparison works for ISO dates
        return await db.getAllAsync<Expense>(
            `SELECT * FROM expenses WHERE date >= ? AND date <= ? ORDER BY date DESC`,
            [startProp, endProp]
        );
    },

    // --- Debts ---
    addDebt: async (personName: string, amount: number, type: 'owed_to_me' | 'i_owe', relatedExpenseId?: string) => {
        const db = DatabaseService.getDB();
        const id = Crypto.randomUUID();
        const date = new Date().toISOString();
        await db.runAsync(
            'INSERT INTO debts (id, person_name, amount, type, status, related_expense_id, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, personName, amount, type, 'pending', relatedExpenseId || null, date]
        );
        return id;
    },

    getDebts: async () => {
        const db = DatabaseService.getDB();
        return await db.getAllAsync<Debt>('SELECT * FROM debts ORDER BY date DESC');
    },

    getItemsOwedToMe: async () => {
        const db = DatabaseService.getDB();
        return await db.getAllAsync<Debt>(`SELECT * FROM debts WHERE type = 'owed_to_me' AND status = 'pending' ORDER BY date DESC`);
    },

    getItemsIOwe: async () => {
        const db = DatabaseService.getDB();
        return await db.getAllAsync<Debt>(`SELECT * FROM debts WHERE type = 'i_owe' AND status = 'pending' ORDER BY date DESC`);
    },

    settleDebt: async (id: string) => {
        const db = DatabaseService.getDB();
        await db.runAsync('UPDATE debts SET status = ? WHERE id = ?', ['paid', id]);
    },

    // Partial payment logic could be complex (creating a new record for remainder vs updating current). 
    // For now, let's implement a simple update amount or mark as paid.
    updateDebtAmount: async (id: string, newAmount: number) => {
        const db = DatabaseService.getDB();
        if (newAmount <= 0) {
            await db.runAsync('UPDATE debts SET status = ?, amount = 0 WHERE id = ?', ['paid', id]);
        } else {
            await db.runAsync('UPDATE debts SET amount = ? WHERE id = ?', [newAmount, id]);
        }
    },

    // --- Summary / Dashboard Helpers ---
    getTotalOwedToMe: async () => {
        const db = DatabaseService.getDB();
        const result = await db.getFirstAsync<{ total: number }>(
            `SELECT SUM(amount) as total FROM debts WHERE type = 'owed_to_me' AND status = 'pending'`
        );
        return result?.total || 0;
    },

    getTotalIOwe: async () => {
        const db = DatabaseService.getDB();
        const result = await db.getFirstAsync<{ total: number }>(
            `SELECT SUM(amount) as total FROM debts WHERE type = 'i_owe' AND status = 'pending'`
        );
        return result?.total || 0;
    },

    getRecentTransactions: async (limit: number = 10) => {
        const db = DatabaseService.getDB();
        const expenses = await db.getAllAsync<Expense>(`SELECT * FROM expenses ORDER BY date DESC LIMIT ?`, [limit]);
        const debts = await db.getAllAsync<Debt>(`SELECT * FROM debts ORDER BY date DESC LIMIT ?`, [limit]);

        const combined = [
            ...expenses.map(e => ({ ...e, type: 'expense' })),
            ...debts.map(d => ({ ...d, type: 'debt' }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, limit);

        return combined;
    },

    getAllTransactions: async () => {
        const db = DatabaseService.getDB();
        const expenses = await db.getAllAsync<Expense>(`SELECT * FROM expenses`);
        const debts = await db.getAllAsync<Debt>(`SELECT * FROM debts`);

        const combined = [
            ...expenses.map(e => ({ ...e, type: 'expense' })),
            ...debts.map(d => ({ ...d, type: 'debt' }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return combined;
    },

    deleteExpense: async (id: string) => {
        const db = DatabaseService.getDB();
        // If it has related debts (from splits), do we delete them? 
        // For now, let's keep it simple. If we delete expense, we might orphan debts if we don't cascade.
        // The foreign key ON DELETE SET NULL was set.
        await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
    },

    deleteDebt: async (id: string) => {
        const db = DatabaseService.getDB();
        await db.runAsync('DELETE FROM debts WHERE id = ?', [id]);
    },

    getExpenseSummary: async (month?: number, year?: number) => {
        const db = DatabaseService.getDB();
        // If month/year provided, filter. Else (for now) get all to simplify current dashboard view or current month default.
        // Let's stick to "This Month" as the UI says "THIS MONTH'S SPENDING".

        const now = new Date();
        const targetMonth = month ?? now.getMonth();
        const targetYear = year ?? now.getFullYear();

        const start = new Date(targetYear, targetMonth, 1).toISOString();
        const end = new Date(targetYear, targetMonth + 1, 0).toISOString();

        const expenses = await db.getAllAsync<{ category: string; amount: number }>(
            `SELECT category, SUM(amount) as amount FROM expenses WHERE date >= ? AND date <= ? GROUP BY category`,
            [start, end]
        );

        // Color mapping
        const colors: { [key: string]: string } = {
            'Food': '#34D399', // Emerald 400
            'Transport': '#A78BFA', // Violet 400
            'Entertainment': '#F472B6', // Pink 400
            'Shopping': '#60A5FA', // Blue 400
            'Bills': '#FBBF24', // Amber 400
            'Health': '#38BDF8', // Sky 400
            'Other': '#9CA3AF' // Gray 400
        };

        return expenses.map(e => ({
            x: e.category,
            y: e.amount,
            color: colors[e.category] || '#CCCCCC'
        }));
    },

    // --- Budget & Income ---
    getFinancePeriod: async (month: number, year: number) => {
        const db = DatabaseService.getDB();
        let period = await db.getFirstAsync<{ id: string, income_amount: number }>(
            'SELECT * FROM finance_periods WHERE month = ? AND year = ?',
            [month, year]
        );

        if (!period) {
            const id = Crypto.randomUUID();
            await db.runAsync(
                'INSERT INTO finance_periods (id, month, year, income_amount) VALUES (?, ?, ?, 0)',
                [id, month, year]
            );
            period = { id, income_amount: 0 };
        }
        return period;
    },

    setIncome: async (month: number, year: number, amount: number) => {
        const db = DatabaseService.getDB();
        const period = await FinanceService.getFinancePeriod(month, year);
        await db.runAsync('UPDATE finance_periods SET income_amount = ? WHERE id = ?', [amount, period.id]);
    },

    setBudget: async (category: string, limitAmount: number, month: number, year: number) => {
        const db = DatabaseService.getDB();
        const period = await FinanceService.getFinancePeriod(month, year);

        // Upsert logic
        await db.runAsync(`
            INSERT INTO finance_budgets (id, category, limit_amount, period_id)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(period_id, category) DO UPDATE SET limit_amount = ?
        `, [
            Crypto.randomUUID(),
            category,
            limitAmount,
            period.id,
            limitAmount
        ]);
    },

    getBudgets: async (month: number, year: number) => {
        const db = DatabaseService.getDB();
        const period = await FinanceService.getFinancePeriod(month, year);

        // Get budgets
        const budgets = await db.getAllAsync<{ category: string, limit_amount: number }>(
            'SELECT category, limit_amount FROM finance_budgets WHERE period_id = ?',
            [period.id]
        );

        // Get actual spending
        const spending = await FinanceService.getExpenseSummary(month, year);

        // Combine
        return budgets.map(b => {
            const spent = spending.find(s => s.x === b.category)?.y || 0;
            return {
                category: b.category,
                limit: b.limit_amount,
                spent: spent,
                remaining: b.limit_amount - spent
            };
        });
    },

    getMonthlyOverview: async (month: number, year: number) => {
        const period = await FinanceService.getFinancePeriod(month, year);
        const spending = await FinanceService.getExpenseSummary(month, year);
        const totalSpent = spending.reduce((acc, curr) => acc + curr.y, 0);

        return {
            income: period.income_amount,
            spent: totalSpent,
            remaining: period.income_amount - totalSpent
        };
    }
};
