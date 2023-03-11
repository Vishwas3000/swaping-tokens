const { getNamedAccounts, ethers } = require("hardhat")
const { getWeth, AMOUNT } = require("./getWeth")
async function main() {
    await getWeth()
    const { deployer } = await getNamedAccounts()
    // abi, address

    // Lending Pool address provider: 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
    // Lending Pool:

    const lendingPool = await getLendingPool(deployer)
    console.log(`Lending Pool ${lendingPool.address}`)

    // deposit
    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    // approval
    await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)
    console.log("Depositing...")
    await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
    console.log("Deposited!")
    //Borrow
    const { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(
        lendingPool,
        deployer
    )
    const daiPrice = await getDAIPrice()
    console.log(`DAI/ETH price is ${daiPrice}`)
    const amountDaiToBorrow =
        availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber())
    console.log(`You can borrow ${amountDaiToBorrow} DAI`)

    const amountDaiToBorrowWei = ethers.utils.parseEther(
        amountDaiToBorrow.toString()
    )
    const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"

    await borrowDai(
        daiTokenAddress,
        lendingPool,
        amountDaiToBorrowWei,
        deployer
    )
    await getBorrowUserData(lendingPool, deployer)

    await repay(lendingPool, daiTokenAddress, amountDaiToBorrowWei, deployer)
    await getBorrowUserData(lendingPool, deployer)
}

async function repay(lendingPool, daiAddress, amountDaiToRepay, account) {
    await approveErc20(
        daiAddress,
        lendingPool.address,
        amountDaiToRepay,
        account
    )
    const repayTx = await lendingPool.repay(
        daiAddress,
        amountDaiToRepay,
        1,
        account
    )
    await repayTx.wait(1)
    console.log("Repaid")
}

async function borrowDai(daiAddress, lendingPool, amountToBorrow, account) {
    const borrowTx = await lendingPool.borrow(
        daiAddress,
        amountToBorrow,
        1,
        0,
        account
    )
    await borrowTx.wait(1)
    console.log("You have borrow")
}

async function getLendingPool(account) {
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        account
    )
    const lendingPoolAddress =
        await lendingPoolAddressesProvider.getLendingPool()
    const lendingPool = await ethers.getContractAt(
        "ILendingPool",
        lendingPoolAddress,
        account
    )
    return lendingPool
}

async function approveErc20(
    erc20Address,
    spenderAddress,
    amountToSpend,
    account
) {
    const erc20Token = await ethers.getContractAt(
        "IERC20",
        erc20Address,
        account
    )
    const tx = await erc20Token.approve(spenderAddress, amountToSpend)
    await tx.wait(1)
    console.log("Approved!")
}

async function getBorrowUserData(lendingPool, account) {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
        await lendingPool.getUserAccountData(account)
    console.log("--------------------------------")
    console.log(`You have ${totalCollateralETH} worth of ETH deposited`)
    console.log(`You have ${totalDebtETH} worth of ETH borrowed`)
    console.log(`You can borrow ${availableBorrowsETH} worth of ETH`)
    console.log("--------------------------------")
    return { availableBorrowsETH, totalDebtETH }
}

async function getDAIPrice() {
    const daiEthPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        "0x773616E4d11A78F511299002da57A0a94577F1f4"
    )
    const price = (await daiEthPriceFeed.latestRoundData())[1]
    return price
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
