'use client'

import { useState } from 'react'
import { Smartphone, Send, ArrowUpRight, ArrowDownLeft, CheckCircle, AlertCircle } from 'lucide-react'

interface MpesaPaymentProps {
  userId: string
  onSuccess?: (amount: number) => void
  onError?: (error: string) => void
}

interface Transaction {
  id: string
  amount: number
  type: 'deposit' | 'withdrawal'
  status: 'pending' | 'completed' | 'failed'
  phoneNumber: string
  createdAt: string
}

export default function MpesaPayment({ userId, onSuccess, onError }: MpesaPaymentProps) {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdrawal'>('deposit')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const quickAmounts = [50, 100, 500, 1000, 2500, 5000]

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '')

    // Limit to 9 digits (for 07xxxxxxxx format)
    return digits.slice(0, 9)
  }

  const validatePhoneNumber = (phone: string): boolean => {
    // Kenyan phone number validation (07xxxxxxxx or 01xxxxxxxx)
    const phoneRegex = /^(07|01)[0-9]{8}$/
    return phoneRegex.test(phone)
  }

  const handleDeposit = async () => {
    if (!phoneNumber || !amount) {
      onError?.('Please fill in all fields')
      return
    }

    if (!validatePhoneNumber(phoneNumber)) {
      onError?.('Please enter a valid Kenyan phone number (07xxxxxxxx)')
      return
    }

    const depositAmount = parseInt(amount)
    if (depositAmount < 10) {
      onError?.('Minimum deposit amount is 10 KES')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/payments/mpesa-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          amount: depositAmount,
          userId,
          accountReference: `MINER-${userId.slice(-6)}`,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage('STK push sent! Please check your phone and enter your PIN.')
        setShowSuccess(true)
        onSuccess?.(depositAmount)

        // Add to recent transactions
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          amount: depositAmount,
          type: 'deposit',
          status: 'pending',
          phoneNumber,
          createdAt: new Date().toISOString(),
        }
        setRecentTransactions(prev => [newTransaction, ...prev.slice(0, 4)])

        // Reset form
        setAmount('')
      } else {
        onError?.(data.error || 'Deposit failed')
      }
    } catch (error) {
      onError?.('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdrawal = async () => {
    if (!phoneNumber || !amount) {
      onError?.('Please fill in all fields')
      return
    }

    if (!validatePhoneNumber(phoneNumber)) {
      onError?.('Please enter a valid Kenyan phone number (07xxxxxxxx)')
      return
    }

    const withdrawalAmount = parseInt(amount)
    if (withdrawalAmount < 50) {
      onError?.('Minimum withdrawal amount is 50 KES')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/payments/mpesa-withdrawal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          amount: withdrawalAmount,
          userId,
          remarks: 'Withdrawal from MINER platform',
          occasion: 'Withdrawal',
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage('Withdrawal request submitted successfully! You will receive the money shortly.')
        setShowSuccess(true)
        onSuccess?.(-withdrawalAmount)

        // Add to recent transactions
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          amount: withdrawalAmount,
          type: 'withdrawal',
          status: 'processing',
          phoneNumber,
          createdAt: new Date().toISOString(),
        }
        setRecentTransactions(prev => [newTransaction, ...prev.slice(0, 4)])

        // Reset form
        setAmount('')
      } else {
        onError?.(data.error || 'Withdrawal failed')
      }
    } catch (error) {
      onError?.('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString())
  }

  const formatPhoneDisplay = (phone: string) => {
    if (phone.length === 9) {
      return `0${phone.slice(0, 4)} ${phone.slice(4)}`
    }
    return phone
  }

  return (
    <div className="mobile-card p-6 space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <div className="mobile-card p-4 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                {successMessage}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {activeTab === 'deposit'
                  ? 'Check your phone for the STK push prompt'
                  : 'Your withdrawal is being processed'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl mb-3">
          <Smartphone className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="mobile-text-lg font-semibold">M-Pesa Payment</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Fast and secure mobile money transfers
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted rounded-xl p-1">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-all touch-target ${
            activeTab === 'deposit'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Deposit</span>
        </button>
        <button
          onClick={() => setActiveTab('withdrawal')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-all touch-target ${
            activeTab === 'withdrawal'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span className="text-sm font-medium">Withdraw</span>
        </button>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              0
            </div>
            <input
              type="tel"
              placeholder="712 345 678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
              className="mobile-input pl-8 w-full"
              maxLength={9}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Kenyan number (07xxxxxxxx or 01xxxxxxxx)
          </p>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Amount (KES)
          </label>
          <input
            type="number"
            placeholder={activeTab === 'deposit' ? 'Minimum 10 KES' : 'Minimum 50 KES'}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mobile-input w-full"
            min={activeTab === 'deposit' ? 10 : 50}
            max={activeTab === 'withdrawal' ? 100000 : undefined}
          />
        </div>

        {/* Quick Amounts */}
        <div className="grid grid-cols-3 gap-2">
          {quickAmounts.map((quickAmount) => (
            <button
              key={quickAmount}
              onClick={() => handleQuickAmount(quickAmount)}
              className="py-2 px-3 text-sm rounded-lg border border-border hover:bg-accent transition-colors touch-target"
            >
              {quickAmount.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={activeTab === 'deposit' ? handleDeposit : handleWithdrawal}
          disabled={isLoading || !phoneNumber || !amount}
          className="mobile-button-primary w-full flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{activeTab === 'deposit' ? 'Send Deposit Request' : 'Request Withdrawal'}</span>
            </>
          )}
        </button>
      </div>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-medium mb-3">Recent Transactions</h3>
          <div className="space-y-2">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    transaction.type === 'deposit'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    {transaction.type === 'deposit' ? (
                      <ArrowDownLeft className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatPhoneDisplay(transaction.phoneNumber)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {transaction.type === 'deposit' ? '+' : '-'}KES {transaction.amount.toLocaleString()}
                  </p>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${
                      transaction.status === 'completed'
                        ? 'bg-green-500'
                        : transaction.status === 'processing'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`} />
                    <p className="text-xs text-muted-foreground capitalize">
                      {transaction.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mobile-card p-4 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">
              {activeTab === 'deposit' ? 'Deposit Information' : 'Withdrawal Information'}
            </p>
            <ul className="space-y-1">
              {activeTab === 'deposit' ? (
                <>
                  <li>• Minimum deposit: 10 KES</li>
                  <li>• You'll receive a prompt to enter your M-Pesa PIN</li>
                  <li>• Funds will be credited instantly upon successful payment</li>
                </>
              ) : (
                <>
                  <li>• Minimum withdrawal: 50 KES</li>
                  <li>• Maximum withdrawal: 100,000 KES</li>
                  <li>• Withdrawals are processed instantly</li>
                  <li>• You'll receive the money directly to your M-Pesa account</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}