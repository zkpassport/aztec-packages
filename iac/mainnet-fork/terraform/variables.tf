variable "INFURA_API_KEY" {
  type = string
}

variable "FORK_MNEMONIC" {
  type = string
}

variable "API_KEY" {
  type = string
}

variable "FORK_ADMIN_API_KEY" {
  type = string
}

variable "DOCKERHUB_ACCOUNT" {
  type = string
}

variable "DEPLOY_TAG" {
  type = string
}

variable "L1_CHAIN_ID" {
  type = string
}

variable "MAINNET_FORK_CPU_UNITS" {
  type    = string
  default = "2048"
}

variable "MAINNET_FORK_MEMORY_UNITS" {
  type    = string
  default = "4096"
}
