const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
    const { deployer } = await getNamedAccounts;
    const fundMe = await ethers.getContract("FundMe", deployer);
    console.log("Withdrawing .....");
    const transRepsonse = await fundMe.withdrawl();
    await transRepsonse.wait(1);
    console.log("Got it back!!!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
