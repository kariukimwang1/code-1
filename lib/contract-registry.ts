/**
 * Contract Registry - Stores deployed contract addresses and ABIs
 * Dynamically loads based on environment and network
 */

export interface ContractConfig {
  network: string
  token: string
  rewardDistributor: string
  staking: string
  treasury: string
  oracleAddress: string
  deploymentTime: number
}

const REGISTRY: Record<string, ContractConfig> = {
  "sepolia-main": {
    network: "sepolia",
    token: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "0x0",
    rewardDistributor: process.env.NEXT_PUBLIC_REWARD_DISTRIBUTOR || "0x0",
    staking: process.env.NEXT_PUBLIC_STAKING_ADDRESS || "0x0",
    treasury: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || "0x0",
    oracleAddress: process.env.ORACLE_ADDRESS || "0x0",
    deploymentTime: Date.now(),
  },
  "polygon-main": {
    network: "polygon",
    token: process.env.POLYGON_TOKEN_ADDRESS || "0x0",
    rewardDistributor: process.env.POLYGON_REWARD_DISTRIBUTOR || "0x0",
    staking: process.env.POLYGON_STAKING_ADDRESS || "0x0",
    treasury: process.env.POLYGON_TREASURY_ADDRESS || "0x0",
    oracleAddress: process.env.POLYGON_ORACLE_ADDRESS || "0x0",
    deploymentTime: Date.now(),
  },
}

export function getContractConfig(network: string): ContractConfig {
  const config = REGISTRY[`${network}-main`]
  if (!config) throw new Error(`No config for network: ${network}`)
  return config
}

export function getAllConfigs(): Record<string, ContractConfig> {
  return REGISTRY
}
