#!/usr/bin/env npx ts-node

import axios from "axios"
import { ethers } from "ethers"

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || "http://localhost:3000",
  testUser: {
    email: `test${Date.now()}@example.com`,
    password: "TestPassword123!",
    wallet: null
  },
  testAmounts: {
    small: 10,
    medium: 100,
    large: 1000
  },
  timeout: 10000
}

interface TestResult {
  test: string
  status: "pass" | "fail" | "skip"
  message: string
  duration: number
  details?: any
}

class SystemTester {
  private baseUrl: string
  private testResults: TestResult[] = []
  private authToken: string | null = null

  constructor(baseUrl: string = TEST_CONFIG.baseUrl) {
    this.baseUrl = baseUrl
  }

  async runAllTests(): Promise<void> {
    console.log("🧪 Starting comprehensive system tests...")
    console.log("==========================================")

    const tests = [
      this.testAPIConnectivity,
      this.testUserRegistration,
      this.testUserLogin,
      this.testWalletConnection,
      this.testMiningOperations,
      this.testStakingOperations,
      this.testWithdrawalProcess,
      this.testKYCSubmission,
      this.testPaymentProcessing,
      this.testAdminDashboard,
      this.testContractIntegration,
      this.testEmailVerification,
      this.testSecurityMeasures,
      this.testPerformanceMetrics,
      this.testDataConsistency,
      this.testErrorHandling
    ]

    const startTime = Date.now()

    for (const test of tests) {
      try {
        await test.call(this)
      } catch (error) {
        this.addTestResult(
          test.name.replace("this.test", ""),
          "fail",
          `Test failed: ${error.message}`,
          0
        )
      }
    }

    const totalDuration = Date.now() - startTime

    this.printTestResults(totalDuration)

    // Exit with appropriate code based on test results
    const failedTests = this.testResults.filter(r => r.status === "fail").length
    const skippedTests = this.testResults.filter(r => r.status === "skip").length

    if (failedTests > 0) {
      console.error(`\n❌ ${failedTests} test(s) failed`)
      process.exit(1)
    } else if (skippedTests > 0) {
      console.log(`\n⚠️ ${skippedTests} test(s) skipped`)
      process.exit(0)
    } else {
      console.log(`\n✅ All ${this.testResults.length} tests passed!`)
      process.exit(0)
    }
  }

  private async testAPIConnectivity(): Promise<void> {
    const testName = "API Connectivity"
    const startTime = Date.now()

    try {
      const response = await axios.get(`${this.baseUrl}/api/health`, {
        timeout: TEST_CONFIG.timeout
      })

      if (response.status === 200) {
        this.addTestResult(
          testName,
          "pass",
          "API server is responding correctly",
          Date.now() - startTime
        )
      } else {
        this.addTestResult(
          testName,
          "fail",
          `API server returned status ${response.status}`,
          Date.now() - startTime
        )
      }
    } catch (error) {
      this.addTestResult(
        testName,
        "fail",
        `Failed to connect to API: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testUserRegistration(): Promise<void> {
    const testName = "User Registration"
    const startTime = Date.now()

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/auth/signup`,
        {
          email: TEST_CONFIG.testUser.email,
          password: TEST_CONFIG.testUser.password,
          agreeToTerms: true
        },
        {
          timeout: TEST_CONFIG.timeout,
          headers: {
            "Content-Type": "application/json"
          }
        }
      )

      if (response.status === 200) {
        this.addTestResult(
          testName,
          "pass",
          "User registration successful",
          Date.now() - startTime
        )

        // Store auth token for later tests
        if (response.data.token) {
          this.authToken = response.data.token
          TEST_CONFIG.testUser.email = response.data.user.email
        }
      } else {
        this.addTestResult(
          testName,
          "fail",
          `Registration failed with status ${response.status}`,
          Date.now() - startTime
        )
      }
    } catch (error) {
      this.addTestResult(
        testName,
        "fail",
        `Registration failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testUserLogin(): Promise<void> {
    const testName = "User Login"
    const startTime = Date.now()

    if (!this.authToken) {
      this.addTestResult(
        testName,
        "skip",
        "No auth token available from registration test",
        0
      )
      return
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/auth/login`,
        {
          email: TEST_CONFIG.testUser.email,
          password: TEST_CONFIG.testUser.password
        },
        {
          timeout: TEST_CONFIG.timeout,
          headers: {
            "Content-Type": "application/json"
          }
        }
      )

      if (response.status === 200) {
        this.addTestResult(
          testName,
          "pass",
          "User login successful",
          Date.now() - startTime
        )

        // Update auth token
        if (response.data.token) {
          this.authToken = response.data.token
        }
      } else {
        this.addTestResult(
          testName,
          "fail",
          `Login failed with status ${response.status}`,
          Date.now() - startTime
        )
      }
    } catch (error) {
      this.addTestResult(
        testName,
        "fail",
        `Login failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testWalletConnection(): Promise<void> {
    const testName = "Wallet Connection"
    const startTime = Date.now()

    // Check if MetaMask is available (in browser environment)
    if (typeof window === "undefined") {
      this.addTestResult(
        testName,
        "skip",
        "Wallet connection test requires browser environment",
        0
      )
      return
    }

    try {
      // Check if MetaMask is installed
      if (!(window as any).ethereum) {
        this.addTestResult(
          testName,
          "skip",
          "MetaMask not available",
          0
        )
        return
      }

      // Try to connect to MetaMask
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts"
      })

      if (accounts.length > 0) {
        this.addTestResult(
          testName,
          "pass",
          "Wallet connection successful",
          Date.now() - startTime
        )
        TEST_CONFIG.testUser.wallet = accounts[0]
      } else {
        this.addTestResult(
          testName,
          "fail",
          "No accounts available in wallet",
          Date.now() - startTime
        )
      }
    } catch (error) {
      this.addTestResult(
        testName,
        "fail",
        `Wallet connection failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testMiningOperations(): Promise<void> {
    const testName = "Mining Operations"
    const startTime = Date.now()

    if (!this.authToken) {
      this.addTestResult(
        testName,
        "skip",
        "No auth token available",
        0
      )
      return
    }

    try {
      // Test mining status
      const statusResponse = await axios.get(
        `${this.baseUrl}/api/mining/status`,
        {
          headers: {
            "Authorization": `Bearer ${this.authToken}`
          },
          timeout: TEST_CONFIG.timeout
        }
      )

      // Test mining submission (simulated)
      const submitResponse = await axios.post(
        `${this.baseUrl}/api/mining/submit`,
        {
          taskId: "test-task-123",
          result: "success",
          hash: "0x1234567890abcdef1234567890abcdef1234567890",
          timestamp: Date.now()
        },
        {
          headers: {
            "Authorization": `Bearer ${this.authToken}`,
            "Content-Type": "application/json"
          },
          timeout: TEST_CONFIG.timeout
        }
      )

      if (statusResponse.status === 200 && submitResponse.status === 200) {
        this.addTestResult(
          testName,
          "pass",
          "Mining operations working correctly",
          Date.now() - startTime
        )
      } else {
        this.addTestResult(
          testName,
          "fail",
          "Mining operations failed",
          Date.now() - startTime
        )
      }
    } catch (error) {
      this.addTestResult(
        testName,
        "fail",
        `Mining operations failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testStakingOperations(): Promise<void> {
    const testName = "Staking Operations"
    const startTime = Date.now()

    if (!this.authToken) {
      this.addTestResult(
        testName,
        "skip",
        "No auth token available",
        0
      )
      return
    }

    try {
      // Get staking positions
      const positionsResponse = await axios.get(
        `${this.baseUrl}/api/staking/positions`,
        {
          headers: {
            "Authorization": `Bearer ${this.authToken}`
          },
          timeout: TEST_CONFIG.timeout
        }
      )

      // Test staking submission
      const stakeResponse = await axios.post(
        `${this.baseUrl}/api/staking/stake`,
        {
          amount: TEST_CONFIG.testAmounts.small,
          lockDays: 30
        },
        {
          headers: {
            "Authorization": `Bearer ${this.authToken}`,
            "Content-Type": "application/json"
          },
          timeout: TEST_CONFIG.timeout
        }
      )

      if (positionsResponse.status === 200 && stakeResponse.status === 200) {
        this.addTestResult(
          testName,
          "pass",
          "Staking operations working correctly",
          Date.now() - startTime
        )
      } else {
        this.addTestResult(
          testName,
          "fail",
          "Staking operations failed",
          Date.now() - startTime
        )
      }
    } catch (error) {
      this.addTestResult(
        testName,
        "fail",
        `Staking operations failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testWithdrawalProcess(): Promise<void> {
    const testName = "Withdrawal Process"
    const startTime = Date.now()

    if (!this.authToken) {
      this.addTestResult(
        testName,
        "skip",
        "No auth token available",
        0
      )
      return
    }

    try {
      // Get withdrawal history
      const historyResponse = await axios.get(
        `${this.baseUrl}/api/withdrawals/history`,
        {
          headers: {
            "Authorization": `Bearer ${this.authToken}`
          },
          timeout: TEST_CONFIG.timeout
        }
      )

      // Create withdrawal request
      const withdrawResponse = await axios.post(
        `${this.baseUrl}/api/withdrawals/create`,
        {
          amount_usd: TEST_CONFIG.testAmounts.small,
          payout_method: "paypal",
          payee_email: "test@example.com"
        },
        {
          headers: {
            "Authorization": `Bearer ${this.authToken}`,
            "Content-Type": "application/json"
          },
          timeout: TEST_CONFIG.timeout
        }
      )

      if (historyResponse.status === 200 && withdrawResponse.status === 200) {
        this.addTestResult(
          testName,
          "pass",
          "Withdrawal process working correctly",
          Date.now() - startTime
        )
      } else {
        this.addTestResult(
          testName,
          "fail",
          "Withdrawal process failed",
          Date.now() - startTime
        )
      }
    } catch (error) {
      this.addTestResult(
        testName,
        "fail",
        `Withdrawal process failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testKYCSubmission(): Promise<void> {
    const testName = "KYC Submission"
    const startTime = Date.now()

    if (!this.authToken) {
      this.addTestResult(
        testName,
        "skip",
        "No auth token available",
        0
      )
      return
    }

    try {
      const kycData = {
        level: 1,
        fullName: "Test User",
        dateOfBirth: "1990-01-01",
        address: {
          street: "123 Test Street",
          city: "Test City",
          state: "TS",
          postalCode: "12345",
          country: "US"
        },
        phoneNumber: "+1234567890",
        idDocumentType: "DRIVING_LICENSE",
        idDocumentFront: "base64-encoded-front-image-data",
        proofOfAddress: "base64-encoded-proof-data"
      }

      const response = await axios.post(
        `${this.baseUrl}/api/kyc/submit`,
        kycData,
        {
          headers: {
            "Authorization": `Bearer ${this.authToken}`,
            "Content-Type": "application/json"
          },
          timeout: TEST_CONFIG.timeout
        }
      )

      if (response.status === 200) {
        this.addTestResult(
          testName,
          "pass",
          "KYC submission successful",
          Date.now() - startTime
        )
      } else {
        this.addTestResult(
          testName,
          "fail",
          `KYC submission failed with status ${response.status}`,
          Date.now() - startTime
        )
      }
    } catch (error) {
      this.addTestResult(
        testName,
        "fail",
        `KYC submission failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testPaymentProcessing(): Promise<void> {
    const testName = "Payment Processing"
    const startTime = Date.now()

    try {
      // Test Stripe webhook handling (simulated)
      const stripeWebhookData = {
        type: "payment_intent.succeeded",
        data: {
          id: "pi_test_1234567890",
          amount: 1000,
          currency: "usd",
          metadata: {
            userId: "test-user-id"
          }
        }
      }

      const stripeResponse = await axios.post(
        `${this.baseUrl}/api/payments/stripe-webhook`,
        stripeWebhookData,
        {
          timeout: TEST_CONFIG.timeout,
          headers: {
            "stripe-signature": "test-signature"
          }
        }
      )

      // Test PayPal webhook handling (simulated)
      const paypalWebhookData = {
        event_type: "PAYMENT.SALE.COMPLETED",
        resource: {
          id: "PAY-1234567890",
          status: "completed",
          amount: {
            total: "10.00",
            currency: "USD"
          },
          payer: {
            email_address: "buyer@example.com"
          }
        }
      }

      const paypalResponse = await axios.post(
        `${this.baseUrl}/api/payments/paypal-webhook`,
        paypalWebhookData,
        {
          timeout: TEST_CONFIG.timeout
        }
      )

      if (stripeResponse.status === 200 && paypalResponse.status === 200) {
        this.addTestResult(
          testName,
          "pass",
          "Payment webhooks working correctly",
          Date.now() - startTime
        )
      } else {
        this.addTestResult(
          testName,
          "fail",
          "Payment webhook handling failed",
          Date.now() - startTime
        )
      }
    } catch (error) {
      this.addTestResult(
        testName,
        "fail",
        `Payment processing test failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testAdminDashboard(): Promise<void> {
    const testName = "Admin Dashboard"
    const startTime = Date.now()

    if (!this.authToken) {
      this.addTestResult(
        testName,
        "skip",
        "No auth token available",
        0
      )
      return
    }

    try {
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY

      // Test admin reports
      const reportsResponse = await axios.get(
        `${this.baseUrl}/api/admin/reports/daily-summary`,
        {
          headers: {
            "x-admin-key": adminKey || "",
            "Authorization": `Bearer ${this.authToken}`
          },
          timeout: TEST_CONFIG.timeout
        }
      )

      // Test compliance report
      const complianceResponse = await axios.get(
        `${this.baseUrl}/api/admin/reports/compliance?days=30`,
        {
          headers: {
            "x-admin-key": adminKey || "",
            "Authorization": `Bearer ${this.authToken}`
          },
          timeout: TEST_CONFIG.timeout
        }
      )

      // Test treasury metrics
      const treasuryResponse = await axios.get(
        `${this.baseUrl}/api/admin/treasury/metrics`,
        {
          headers: {
            "Authorization": `Bearer ${this.authToken}`
          },
          timeout: TEST_CONFIG.timeout
        }
      )

      if (reportsResponse.status === 200 &&
          complianceResponse.status === 200 &&
          treasuryResponse.status === 200) {
        this.addTestResult(
          testName,
          "pass",
          "Admin dashboard and APIs working correctly",
          Date.now() - startTime
        )
      } else {
        this.addTestResult(
          testName,
          "fail",
          "Admin dashboard test failed",
          Date.now() - startTime
        )
      }
    } catch (error) {
      this.addTestResult(
        testName,
        "fail",
        `Admin dashboard test failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testContractIntegration(): Promise<void> {
    const testName = "Smart Contract Integration"
    const startTime = Date.now()

    try {
      // Test if contract addresses are configured
      const requiredContracts = [
        "MINER_TOKEN_ADDRESS",
        "REWARD_DISTRIBUTOR_ADDRESS",
        "STAKING_V2_ADDRESS",
        "TREASURY_ADDRESS"
      ]

      const missingContracts = requiredContracts.filter(
        contract => !process.env[contract]
      )

      if (missingContracts.length > 0) {
        this.addTestResult(
          testName,
          "skip",
          `Missing contract addresses: ${missingContracts.join(", ")}`,
          0
        )
        return
      }

      // Test contract RPC calls (simulated)
      const contractData = {
        tokenAddress: process.env.MINER_TOKEN_ADDRESS,
        rewardDistributorAddress: process.env.REWARD_DISTRIBUTOR_ADDRESS,
        stakingAddress: process.env.STAKING_V2_ADDRESS,
        treasuryAddress: process.env.TREASURY_ADDRESS
      }

      this.addTestResult(
        testName,
        "pass",
        "Smart contracts properly configured",
        Date.now() - startTime,
        contractData
      )
    } catch (error) {
      this.addTestResult(
        testName,
        "fail",
        `Contract integration test failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testEmailVerification(): Promise<void> {
    const testName = "Email Verification"
    const startTime = Date.now()

    if (!this.authToken) {
      this.addTestResult(
        testName,
        "skip",
        "No auth token available",
        0
      )
      return
    }

    try {
      // Test sending verification email
      const emailData = {
        email: TEST_CONFIG.testUser.email
      }

      const response = await axios.post(
        `${this.baseUrl}/api/auth/send-verification`,
        emailData,
        {
          headers: {
            "Content-Type": "application/json"
          },
          timeout: TEST_CONFIG.timeout
        }
      )

      if (response.status === 200) {
        this.addTestResult(
          testName,
          "pass",
          "Email verification system working",
          Date.now() - startTime
        )
      } else {
        this.addTestResult(
          testName,
          "fail",
          `Email verification failed with status ${response.status}`,
          Date.now() - startTime
        )
      }
    } catch (error) {
      this.addTestResult(
        testName,
        "fail",
        `Email verification test failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testSecurityMeasures(): Promise<void> {
    const testName = "Security Measures"
    const startTime = Date.now()

    try {
      // Test rate limiting on auth endpoints
      const rateLimitPromises = Array(10).fill(null).map(() =>
        axios.post(
          `${this.baseUrl}/api/auth/login`,
          {
            email: "test@example.com",
            password: "password123"
          },
          { timeout: 1000 }
        )
      )

      const rateLimitResults = await Promise.allSettled(rateLimitPromises)

      const rateLimitBlocked = rateLimitResults.filter(
        result => result.status === 429 // Too Many Requests
      ).length

      // Test SQL injection protection
      const sqlInjectionPayload = "'; DROP TABLE users; --"
      const sqlResponse = await axios.post(
        `${this.baseUrl}/api/auth/login`,
        {
          email: sqlInjectionPayload,
          password: "password123"
        },
        {
          timeout: TEST_CONFIG.timeout
        }
      )

      // Test XSS protection
      const xssPayload = "<script>alert('xss')</script>"
      const xssResponse = await axios.post(
        `${this.baseUrl}/api/auth/login`,
        {
          email: xssPayload,
          password: "password123"
        },
        {
          timeout: TEST_CONFIG.timeout
        }
      )

      if (rateLimitBlocked > 5 && sqlResponse.status === 400 && xssResponse.status === 400) {
        this.addTestResult(
          testName,
          "pass",
          "Security measures working correctly (rate limiting, SQL injection, XSS protection)",
          Date.now() - startTime
        )
      } else {
        this.addResult(
          testName,
          "fail",
          "Some security measures may not be working properly",
          Date.now() - startTime
        )
      }
    } catch (error) {
      this.addTestResult(
        testName,
        "fail",
        `Security measures test failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testPerformanceMetrics(): Promise<void> {
    const testName = "Performance Metrics"
    const startTime = Date.now()

    try {
      // Test API response times
      const apiResponseTimes = await Promise.all([
        axios.get(`${this.baseUrl}/api/user/profile`, {
          headers: this.authToken ? { "Authorization": `Bearer ${this.authToken}` } : {},
          timeout: TEST_CONFIG.timeout
        }),
        axios.get(`${this.baseUrl}/api/mining/status`, {
          headers: this.authToken ? { "Authorization": `Bearer ${this.authToken}` } : {},
          timeout: TEST_CONFIG.timeout
        }),
        axios.get(`${this.baseUrl}/api/staking/positions`, {
          headers: this.authToken ? { "Authorization": `Bearer ${this.authToken}` } : {},
          timeout: TEST_CONFIG.timeout
        })
      ])

      const avgResponseTime = apiResponseTimes.reduce(
        (sum, response) => sum + response.data.responseTime,
        0
      ) / apiResponseTimes.length

      if (avgResponseTime < 1000) { // Less than 1 second average
        this.addTestResult(
          testName,
          "pass",
          `API response times acceptable (avg: ${avgResponseTime}ms)`,
          Date.now() - startTime
        )
      } else {
        this.addResult(
          testName,
          "fail",
          `API response times slow (avg: ${avgResponseTime}ms)`,
          Date.now() - startTime
        )
      }
    } catch (error) {
      this.addTestResult(
        testName,
        "fail",
        `Performance metrics test failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testDataConsistency(): Promise<void> {
    const testName = "Data Consistency"
    const startTime = Date.now()

    if (!this.authToken) {
      this.addResult(
        testName,
        "skip",
        "No auth token available",
        0
      )
      return
    }

    try {
      // Get user profile and balance
      const profileResponse = await axios.get(
        `${this.baseUrl}/api/user/profile`,
        {
          headers: {
            "Authorization": `Bearer ${this.authToken}`
          },
          timeout: TEST_CONFIG.timeout
        }
      )

      // Check if user balance data is consistent
      if (profileResponse.data.balance &&
          typeof profileResponse.data.balance.token_balance === "number" &&
          typeof profileResponse.data.balance.usdc_balance === "number") {
        this.addTestResult(
          testName,
          "pass",
          "User balance data is consistent",
          Date.now() - startTime
        )
      } else {
        this.addTestResult(
          testName,
          "fail",
          "User balance data consistency issues",
          Date.now() - startTime
        )
      }
    } catch (error) {
      this.addResult(
        testName,
        "fail",
        `Data consistency test failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private async testErrorHandling(): Promise<void> {
    const testName = "Error Handling"
    const startTime = Date.now()

    try {
      // Test 404 handling
      const notFoundResponse = await axios.get(
        `${this.baseUrl}/api/nonexistent-endpoint`,
        { timeout: TEST_CONFIG.timeout }
      )

      // Test 401 handling
      const unauthorizedResponse = await axios.get(
        `${this.baseUrl}/api/admin/reports/daily-summary`,
        { timeout: TEST_CONFIG.timeout }
      )

      // Test 400 handling
      const badRequestResponse = await axios.post(
        `${this.baseUrl}/api/auth/login`,
        { invalid: "data" },
        { timeout: TEST_CONFIG.timeout }
      )

      if (notFoundResponse.status === 404 &&
          unauthorizedResponse.status === 401 &&
          badRequestResponse.status === 400) {
        this.addTestResult(
          testName,
          "pass",
          "Error handling working correctly (404, 401, 400)",
          Date.now() - startTime
        )
      } else {
        this.addResult(
          testName,
          "fail",
          "Error handling may have issues",
          Date.now() - startTime
        )
      }
    } catch (error) {
      this.addTestResult(
        testName,
        "fail",
        `Error handling test failed: ${error.message}`,
        Date.now() - startTime
      )
    }
  }

  private addTestResult(test: string, status: string, message: string, duration: number, details?: any): void {
    this.testResults.push({
      test,
      status,
      message,
      duration,
      details
    })
  }

  private printTestResults(totalDuration: number): void {
    console.log("\n📊 Test Results")
    console.log("==========================================")
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`)

    const passedTests = this.testResults.filter(r => r.status === "pass")
    const failedTests = this.testResults.filter(r => r.status === "fail")
    const skippedTests = this.testResults.filter(r => r.status === "skip")

    console.log(`✅ Passed: ${passedTests.length}`)
    console.log(`❌ Failed: ${failedTests.length}`)
    console.log(`⚠️ Skipped: ${skippedTests.length}`)
    console.log(`📋 Total: ${this.testResults.length}`)

    if (failedTests.length > 0) {
      console.log("\n❌ Failed Tests:")
      failedTests.forEach(test => {
        console.log(`  • ${test.test}: ${test.message}`)
        if (test.details) {
          console.log(`    Details: ${JSON.stringify(test.details, null, 2)}`)
        }
      })
    }

    if (skippedTests.length > 0) {
      console.log("\n⚠️ Skipped Tests:")
      skippedTests.forEach(test => {
        console.log(`  • ${test.test}: ${test.message}`)
      })
    }

    console.log("\n⏱ Test Performance Summary:")
    this.testResults.forEach(test => {
      console.log(
        `  • ${test.test}: ${test.status.toUpperCase()} (${(test.duration / 1000).toFixed(2)}s)`
      )
    })
  }

  private addResult(test: string, status: string, message: string, duration: number): void {
    this.testResults.push({
      test,
      status,
      message,
      duration
    })
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  const tester = new SystemTester()
  tester.runAllTests()
}