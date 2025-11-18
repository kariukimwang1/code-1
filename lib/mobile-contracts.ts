import { ethers } from 'ethers'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Mobile-optimized contract configuration
export const MOBILE_CONTRACT_CONFIG = {
  ethereum: {
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
    chainId: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    blockExplorer: 'https://etherscan.io',
    gasLimit: 21000,
    confirmations: 2,
  },
  polygon: {
    rpcUrl: 'https://polygon-rpc.com',
    chainId: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    blockExplorer: 'https://polygonscan.com',
    gasLimit: 21000,
    confirmations: 1,
  },
  bsc: {
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    chainId: 56,
    name: 'BSC',
    symbol: 'BNB',
    blockExplorer: 'https://bscscan.com',
    gasLimit: 21000,
    confirmations: 1,
  }
}

// Contract ABIs (optimized for mobile)
export const MOBILE_CONTRACT_ABIS = {
  MinerToken: [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)'
  ],
  MiningContract: [
    'function startMining(uint256 hashPower, uint256 lockupPeriod) payable',
    'function stopMining()',
    'function claimRewards()',
    'function getUserInfo(address user) view returns (uint256 hashPower, uint256 rewards, uint256 lastClaim)',
    'function getTotalHashPower() view returns (uint256)',
    'function getRewardRate() view returns (uint256)',
    'function withdrawPrincipal()',
    'event MiningStarted(address indexed user, uint256 hashPower, uint256 lockupPeriod)',
    'event MiningStopped(address indexed user)',
    'event RewardsClaimed(address indexed user, uint256 amount)'
  ],
  StakingContract: [
    'function stake(uint256 amount, uint256 lockupPeriod)',
    'function unstake()',
    'function claimRewards()',
    'function getUserPosition(address user) view returns (uint256 amount, uint256 rewards, uint256 apy, uint256 lockupPeriod, uint256 startTime)',
    'function getTotalStaked() view returns (uint256)',
    'function getAPY(uint256 lockupPeriod) view returns (uint256)',
    'event Staked(address indexed user, uint256 amount, uint256 lockupPeriod)',
    'event Unstaked(address indexed user, uint256 amount)',
    'event RewardsClaimed(address indexed user, uint256 amount)'
  ],
  TreasuryMultiSig: [
    'function submitTransaction(address to, uint256 value, bytes data)',
    'function confirmTransaction(uint256 transactionId)',
    'function executeTransaction(uint256 transactionId)',
    'function getTransactionCount() view returns (uint256)',
    'function getTransaction(uint256 transactionId) view returns (address to, uint256 value, bytes data, bool executed, uint256 numConfirmations)',
    'event Submission(uint256 indexed transactionId)',
    'event Execution(uint256 indexed transactionId)'
  ]
}

// Contract addresses (will be loaded from deployment)
export const CONTRACT_ADDRESSES = {
  ethereum: {
    MinerToken: '',
    MiningContract: '',
    StakingContract: '',
    TreasuryMultiSig: ''
  },
  polygon: {
    MinerToken: '',
    MiningContract: '',
    StakingContract: '',
    TreasuryMultiSig: ''
  },
  bsc: {
    MinerToken: '',
    MiningContract: '',
    StakingContract: '',
    TreasuryMultiSig: ''
  }
}

interface MobileWalletInfo {
  address: string
  privateKey?: string
  mnemonic?: string
  network: string
}

interface TransactionInfo {
  hash: string
  from: string
  to: string
  value: string
  gasUsed: string
  status: number
  timestamp: number
}

export class MobileContractService {
  private provider: ethers.JsonRpcProvider | null = null
  private wallet: ethers.Wallet | null = null
  private currentNetwork: string = 'ethereum'

  constructor() {
    this.initializeService()
  }

  private async initializeService() {
    try {
      // Load saved wallet and network
      const savedWallet = await AsyncStorage.getItem('mobile_wallet')
      const savedNetwork = await AsyncStorage.getItem('mobile_network')

      if (savedNetwork) {
        this.currentNetwork = savedNetwork
      }

      if (savedWallet) {
        const walletInfo: MobileWalletInfo = JSON.parse(savedWallet)
        await this.connectWallet(walletInfo)
      } else {
        await this.setProvider()
      }
    } catch (error) {
      console.error('Mobile contract service initialization error:', error)
    }
  }

  private async setProvider() {
    const config = MOBILE_CONTRACT_CONFIG[this.currentNetwork]
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl)

    // Test connection
    try {
      await this.provider.getBlockNumber()
      console.log(`Connected to ${config.name}`)
    } catch (error) {
      console.error(`Failed to connect to ${config.name}:`, error)
    }
  }

  async createWallet(): Promise<MobileWalletInfo> {
    try {
      const wallet = ethers.Wallet.createRandom()
      const walletInfo: MobileWalletInfo = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase,
        network: this.currentNetwork
      }

      // Save wallet info
      await AsyncStorage.setItem('mobile_wallet', JSON.stringify(walletInfo))

      // Set as current wallet
      this.wallet = wallet
      if (this.provider) {
        this.wallet = wallet.connect(this.provider)
      }

      return walletInfo
    } catch (error) {
      console.error('Error creating wallet:', error)
      throw new Error('Failed to create wallet')
    }
  }

  async importWallet(privateKeyOrMnemonic: string): Promise<MobileWalletInfo> {
    try {
      let wallet: ethers.Wallet

      // Check if it's a mnemonic or private key
      if (privateKeyOrMnemonic.trim().split(' ').length > 1) {
        wallet = ethers.Wallet.fromPhrase(privateKeyOrMnemonic.trim())
      } else {
        wallet = new ethers.Wallet(privateKeyOrMnemonic.trim())
      }

      const walletInfo: MobileWalletInfo = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase,
        network: this.currentNetwork
      }

      // Save wallet info
      await AsyncStorage.setItem('mobile_wallet', JSON.stringify(walletInfo))

      // Set as current wallet
      this.wallet = wallet
      if (this.provider) {
        this.wallet = wallet.connect(this.provider)
      }

      return walletInfo
    } catch (error) {
      console.error('Error importing wallet:', error)
      throw new Error('Failed to import wallet')
    }
  }

  async connectWallet(walletInfo: MobileWalletInfo): Promise<void> {
    try {
      if (this.provider && walletInfo.privateKey) {
        this.wallet = new ethers.Wallet(walletInfo.privateKey, this.provider)
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      throw new Error('Failed to connect wallet')
    }
  }

  async switchNetwork(network: string): Promise<void> {
    if (!MOBILE_CONTRACT_CONFIG[network]) {
      throw new Error('Invalid network')
    }

    this.currentNetwork = network
    await this.setProvider()
    await AsyncStorage.setItem('mobile_network', network)

    // Reconnect wallet if exists
    const savedWallet = await AsyncStorage.getItem('mobile_wallet')
    if (savedWallet) {
      const walletInfo: MobileWalletInfo = JSON.parse(savedWallet)
      await this.connectWallet(walletInfo)
    }
  }

  getTokenBalance(tokenAddress: string, userAddress?: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }

    const address = userAddress || this.wallet?.address
    if (!address) {
      throw new Error('No wallet address available')
    }

    const contract = new ethers.Contract(tokenAddress, MOBILE_CONTRACT_ABIS.MinerToken, this.provider)
    return contract.balanceOf(address)
  }

  async transferToken(tokenAddress: string, to: string, amount: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected')
    }

    const config = MOBILE_CONTRACT_CONFIG[this.currentNetwork]
    const contract = new ethers.Contract(tokenAddress, MOBILE_CONTRACT_ABIS.MinerToken, this.wallet)

    const parsedAmount = ethers.parseEther(amount)

    const tx = await contract.transfer(to, parsedAmount, {
      gasLimit: config.gasLimit,
    })

    return tx.hash
  }

  async stakeTokens(stakingAddress: string, amount: string, lockupPeriod: number): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected')
    }

    const config = MOBILE_CONTRACT_CONFIG[this.currentNetwork]
    const stakingContract = new ethers.Contract(stakingAddress, MOBILE_CONTRACT_ABIS.StakingContract, this.wallet)

    const parsedAmount = ethers.parseEther(amount)

    const tx = await stakingContract.stake(parsedAmount, lockupPeriod, {
      gasLimit: config.gasLimit * 3, // Higher gas limit for staking
    })

    return tx.hash
  }

  async startMining(miningAddress: string, hashPower: string, lockupPeriod: number, value?: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected')
    }

    const config = MOBILE_CONTRACT_CONFIG[this.currentNetwork]
    const miningContract = new ethers.Contract(miningAddress, MOBILE_CONTRACT_ABIS.MiningContract, this.wallet)

    const parsedHashPower = ethers.parseEther(hashPower)
    const txValue = value ? ethers.parseEther(value) : undefined

    const tx = await miningContract.startMining(parsedHashPower, lockupPeriod, {
      gasLimit: config.gasLimit * 5, // Higher gas limit for mining
      value: txValue,
    })

    return tx.hash
  }

  async claimRewards(contractAddress: string, contractType: 'mining' | 'staking'): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected')
    }

    const config = MOBILE_CONTRACT_CONFIG[this.currentNetwork]
    const abi = contractType === 'mining' ? MOBILE_CONTRACT_ABIS.MiningContract : MOBILE_CONTRACT_ABIS.StakingContract
    const contract = new ethers.Contract(contractAddress, abi, this.wallet)

    const tx = await contract.claimRewards({
      gasLimit: config.gasLimit * 2,
    })

    return tx.hash
  }

  async waitForTransaction(txHash: string, confirmations: number = 1): Promise<any> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }

    const config = MOBILE_CONTRACT_CONFIG[this.currentNetwork]
    const requiredConfirmations = Math.min(confirmations, config.confirmations)

    const receipt = await this.provider.waitForTransaction(txHash, requiredConfirmations)
    return receipt
  }

  async getTransactionStatus(txHash: string): Promise<TransactionInfo | null> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }

    try {
      const [tx, receipt] = await Promise.all([
        this.provider.getTransaction(txHash),
        this.provider.getTransactionReceipt(txHash)
      ])

      if (!tx || !receipt) {
        return null
      }

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        value: ethers.formatEther(tx.value),
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status || 0,
        timestamp: Date.now() // Would need block info for actual timestamp
      }
    } catch (error) {
      console.error('Error getting transaction status:', error)
      return null
    }
  }

  async getETHBalance(address?: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }

    const addr = address || this.wallet?.address
    if (!addr) {
      throw new Error('No wallet address available')
    }

    const balance = await this.provider.getBalance(addr)
    return ethers.formatEther(balance)
  }

  async getGasPrice(): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }

    const feeData = await this.provider.getFeeData()
    return feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : '0'
  }

  async estimateGas(to: string, value?: string, data?: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }

    try {
      const gasEstimate = await this.provider.estimateGas({
        to,
        value: value ? ethers.parseEther(value) : undefined,
        data,
      })

      return gasEstimate.toString()
    } catch (error) {
      console.error('Error estimating gas:', error)
      return '21000'
    }
  }

  getCurrentNetwork(): string {
    return this.currentNetwork
  }

  getWalletAddress(): string | null {
    return this.wallet?.address || null
  }

  isConnected(): boolean {
    return !!(this.provider && this.wallet)
  }

  async disconnect(): Promise<void> {
    this.wallet = null
    await AsyncStorage.removeItem('mobile_wallet')
  }

  // Smart contract interaction helpers
  async getContractInstance(contractAddress: string, abi: any) {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }

    return new ethers.Contract(contractAddress, abi, this.provider)
  }

  async getContractWithSigner(contractAddress: string, abi: any) {
    if (!this.wallet) {
      throw new Error('Wallet not connected')
    }

    return new ethers.Contract(contractAddress, abi, this.wallet)
  }

  // Batch transaction support for mobile
  async executeBatch(transactions: Array<{
    to: string
    value?: string
    data?: string
  }>): Promise<string[]> {
    if (!this.wallet) {
      throw new Error('Wallet not connected')
    }

    const txHashes: string[] = []
    const config = MOBILE_CONTRACT_CONFIG[this.currentNetwork]

    for (const tx of transactions) {
      try {
        const txResponse = await this.wallet.sendTransaction({
          to: tx.to,
          value: tx.value ? ethers.parseEther(tx.value) : undefined,
          data: tx.data,
          gasLimit: config.gasLimit,
        })

        txHashes.push(txResponse.hash)
      } catch (error) {
        console.error('Batch transaction error:', error)
        throw error
      }
    }

    return txHashes
  }
}

// Global mobile contract service instance
export const mobileContractService = new MobileContractService()

// Utility functions for mobile blockchain integration
export const formatAddress = (address: string, length: number = 6): string => {
  if (!address || address.length < 10) return address
  return `${address.slice(0, length)}...${address.slice(-length)}`
}

export const formatBalance = (balance: string, decimals: number = 4): string => {
  const num = parseFloat(balance)
  if (num === 0) return '0'
  if (num < 0.0001) return '<0.0001'
  return num.toFixed(decimals)
}

export const formatTransactionHash = (hash: string): string => {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

export const getNetworkInfo = (network: string) => {
  return MOBILE_CONTRACT_CONFIG[network] || MOBILE_CONTRACT_CONFIG.ethereum
}

export const validateAddress = (address: string): boolean => {
  return ethers.isAddress(address)
}

export const validatePrivateKey = (privateKey: string): boolean => {
  try {
    new ethers.Wallet(privateKey)
    return true
  } catch {
    return false
  }
}

export const validateMnemonic = (mnemonic: string): boolean => {
  try {
    ethers.Wallet.fromPhrase(mnemonic.trim())
    return true
  } catch {
    return false
  }
}