const { ethers, network } = require("hardhat")

const networkConfig = {
    default: {
        name: "hardhat",
    },
    31337: {
        name: "localhost",
    },
    5: {
        name: "goerli",
    },
    1: {
        name: "mainnet",
    },
}
const developementChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developementChains,
}
