import { createContext, useContext, useState, useEffect } from 'react'

const CurrencyContext = createContext()

export function useCurrency() {
  return useContext(CurrencyContext)
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('currency')
    return saved || 'USD'
  })
  
  const [exchangeRates, setExchangeRates] = useState({})
  const [loading, setLoading] = useState(false)

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
  ]

  // Fetch exchange rates from a free API
  const fetchExchangeRates = async () => {
    setLoading(true)
    try {
      // Using exchangerate-api.com (free tier)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      const data = await response.json()
      setExchangeRates(data.rates)
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error)
      // Fallback rates (approximate)
      setExchangeRates({
        USD: 1,
        INR: 83.5,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 150,
        CAD: 1.36,
        AUD: 1.52
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExchangeRates()
    // Refresh rates every hour
    const interval = setInterval(fetchExchangeRates, 3600000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    localStorage.setItem('currency', currency)
  }, [currency])

  const convertAmount = (amount, fromCurrency = 'USD', toCurrency = currency) => {
    if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) {
      return amount
    }
    
    // Convert to USD first, then to target currency
    const usdAmount = amount / exchangeRates[fromCurrency]
    return usdAmount * exchangeRates[toCurrency]
  }

  const formatAmount = (amount, currencyCode = currency) => {
    const currencyInfo = currencies.find(c => c.code === currencyCode)
    const symbol = currencyInfo?.symbol || '$'
    
    return `${symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  const getCurrentCurrency = () => {
    return currencies.find(c => c.code === currency)
  }

  const value = {
    currency,
    setCurrency,
    currencies,
    exchangeRates,
    loading,
    convertAmount,
    formatAmount,
    getCurrentCurrency
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}
