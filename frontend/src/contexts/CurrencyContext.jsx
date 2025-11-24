import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

const CurrencyContext = createContext()

const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
]

const RATES_ENDPOINT = 'https://open.er-api.com/v6/latest/USD'

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'INR')
  const [rates, setRates] = useState({ USD: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    localStorage.setItem('currency', currency)
  }, [currency])

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true)
        const res = await fetch(RATES_ENDPOINT)
        const data = await res.json()

        if (data.result !== 'success') {
          throw new Error(data['error-type'] || 'Failed to fetch currency rates')
        }

        const fetchedRates = { ...data.rates, USD: 1 }
        setRates(fetchedRates)
        setError('')
      } catch (err) {
        console.error('Currency fetch error:', err)
        setError('Unable to fetch latest currency rates. Values may be inaccurate.')
      } finally {
        setLoading(false)
      }
    }

    fetchRates()
  }, [])

  const convertAmount = useCallback(
    (amount, targetCurrency = currency) => {
      if (typeof amount !== 'number' || Number.isNaN(amount)) return 0
      if (!rates[targetCurrency]) return amount
      return amount * rates[targetCurrency]
    },
    [currency, rates]
  )

  const toBaseAmount = useCallback(
    (amount, sourceCurrency = currency) => {
      if (typeof amount !== 'number' || Number.isNaN(amount)) return 0
      if (!rates[sourceCurrency]) return amount
      return amount / rates[sourceCurrency]
    },
    [currency, rates]
  )

  const formatAmount = useCallback(
    (amount, { currencyCode = currency, skipConversion = false } = {}) => {
      if (typeof amount !== 'number' || Number.isNaN(amount)) return '--'
      const displayValue = skipConversion ? amount : convertAmount(amount, currencyCode)
      const locale = SUPPORTED_CURRENCIES.find((curr) => curr.code === currencyCode)?.locale || 'en-US'
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currencyCode,
          maximumFractionDigits: 2,
        }).format(displayValue)
      } catch {
        return `${currencyCode} ${displayValue.toFixed(2)}`
      }
    },
    [convertAmount, currency]
  )

  const currentCurrency = useMemo(
    () => SUPPORTED_CURRENCIES.find((curr) => curr.code === currency) || SUPPORTED_CURRENCIES[0],
    [currency]
  )

  const value = {
    currency,
    setCurrency,
    currencies: SUPPORTED_CURRENCIES,
    loadingRates: loading,
    rates,
    error,
    convertAmount,
    formatAmount,
    toBaseAmount,
    currentCurrency,
  }

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
