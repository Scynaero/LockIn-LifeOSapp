import { DatabaseService } from './DatabaseService';

const CURRENCY_KEY = 'user_currency';
const DEFAULT_CURRENCY = 'INR';

export const CurrencyService = {
    getCurrency: async (): Promise<string> => {
        try {
            const db = DatabaseService.getDB();
            const result = await db.getFirstAsync<{ value: string }>(
                'SELECT value FROM user_meta WHERE key = ?',
                [CURRENCY_KEY]
            );
            return result?.value || DEFAULT_CURRENCY;
        } catch (e) {
            console.error('Error fetching currency:', e);
            return DEFAULT_CURRENCY;
        }
    },

    setCurrency: async (currency: string): Promise<void> => {
        try {
            const db = DatabaseService.getDB();
            await db.runAsync(
                'INSERT OR REPLACE INTO user_meta (key, value) VALUES (?, ?)',
                [CURRENCY_KEY, currency]
            );
        } catch (e) {
            console.error('Failed to save currency', e);
        }
    },

    getSymbol: (currencyCode: string): string => {
        const symbols: { [key: string]: string } = {
            'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'INR': '₹',
            'AUD': 'A$', 'CAD': 'C$', 'CHF': 'Fr', 'CNY': '¥', 'SEK': 'kr',
            'NZD': 'NZ$', 'MXN': '$', 'SGD': 'S$', 'HKD': 'HK$', 'NOK': 'kr',
            'KRW': '₩', 'TRY': '₺', 'RUB': '₽', 'BRL': 'R$', 'ZAR': 'R'
        };
        return symbols[currencyCode] || currencyCode;
    }
};
