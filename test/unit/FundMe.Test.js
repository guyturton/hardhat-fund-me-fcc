//const { FunctionFragment } = require("@ethersproject/abi");
const { developmentChains } = require("../../helper-hardhat-config");
const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
// const {
//     isCallTrace,
// } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          let sendValue = ethers.utils.parseEther("0.1"); //--> parceEthers seems to cause tests to pass but zero are run????

          beforeEach(async function () {
              //first deploy contract using hardhat deploy
              //const accounts = ethers.getSigners();
              // const account1 = accounts[0];
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture("all");
              fundMe = await ethers.getContract("FundMe", deployer);
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });

          describe("constructor", function () {
              it("sets the aggregator addresses correctly", async () => {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, mockV3Aggregator.address);
              });
              it("tests tf test work", async () => {
                  assert.equal(1, 1);
              });
          });

          describe("fund", function () {
              // https://ethereum-waffle.readthedocs.io/en/latest/matchers.html
              // could also do assert.fail
              it("Fails if you don't send enough ETH", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't send enough funds!!!"
                  );
              });
              // we could be even more precise here by making sure exactly $50 works
              // but this is good enough for now
              it("Updates the amount funded data structure", async () => {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  );
                  assert.equal(response.toString(), sendValue.toString());
              });

              it("adds funders to the funders array", async function () {
                  await fundMe.fund({ value: sendValue });
                  const funder = await fundMe.getFunder(0);
                  assert.equal(funder, deployer);
              });
          });

          describe("withdrawl", async function () {
              {
                  beforeEach(async function () {
                      await fundMe.fund({ value: sendValue });
                  });

                  it("withdraw ETH from a single founder", async function () {
                      const startingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address);
                      const startingDeployerBalance =
                          await fundMe.provider.getBalance(deployer);

                      const transactionReponse = await fundMe.withdrawl();
                      const transactionReceipt = await transactionReponse.wait(
                          1
                      );

                      const { gasUsed, effectiveGasPrice } = transactionReceipt;
                      const gasCost = gasUsed.mul(effectiveGasPrice);

                      const endingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address);
                      const endingDeployerBalance =
                          await fundMe.provider.getBalance(deployer);

                      assert.equal(endingFundMeBalance, 0);
                      assert.equal(
                          startingFundMeBalance
                              .add(startingDeployerBalance)
                              .toString(),
                          endingDeployerBalance.add(gasCost).toString()
                      );
                  });

                  it("allow to withdrawl from a number of different funders", async function () {
                      const accounts = await ethers.getSigners();
                      for (let i = 1; i < 6; i++) {
                          const fundMeConnectedContract = await fundMe.connect(
                              accounts[i]
                          );
                          await fundMeConnectedContract.fund({
                              value: sendValue,
                          });
                      }

                      const startingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address);
                      const startingDeployerBalance =
                          await fundMe.provider.getBalance(deployer);

                      const transactionReponse = await fundMe.withdrawl();
                      const transactionReceipt = await transactionReponse.wait(
                          1
                      );

                      const { gasUsed, effectiveGasPrice } = transactionReceipt;
                      const gasCost = gasUsed.mul(effectiveGasPrice);

                      const endingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address);
                      const endingDeployerBalance =
                          await fundMe.provider.getBalance(deployer);

                      assert.equal(endingFundMeBalance, 0);
                      assert.equal(
                          startingFundMeBalance
                              .add(startingDeployerBalance)
                              .toString(),
                          endingDeployerBalance.add(gasCost).toString()
                      );

                      // need to ensure funders array is cleared out
                      await expect(fundMe.getFunder(0)).to.be.reverted;

                      for (i = 1; i < 6; i++) {
                          assert.equal(
                              await fundMe.getAddressToAmountFunded(
                                  accounts[i].address
                              ),
                              0
                          );
                      }
                  });

                  it("cheaper withdrawl from a number of different funders", async function () {
                      const accounts = await ethers.getSigners();
                      for (let i = 1; i < 6; i++) {
                          const fundMeConnectedContract = await fundMe.connect(
                              accounts[i]
                          );
                          await fundMeConnectedContract.fund({
                              value: sendValue,
                          });
                      }

                      const startingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address);
                      const startingDeployerBalance =
                          await fundMe.provider.getBalance(deployer);

                      const transactionReponse =
                          await fundMe.cheaperWithdrawl();
                      const transactionReceipt = await transactionReponse.wait(
                          1
                      );

                      const { gasUsed, effectiveGasPrice } = transactionReceipt;
                      const gasCost = gasUsed.mul(effectiveGasPrice);

                      const endingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address);
                      const endingDeployerBalance =
                          await fundMe.provider.getBalance(deployer);

                      assert.equal(endingFundMeBalance, 0);
                      assert.equal(
                          startingFundMeBalance
                              .add(startingDeployerBalance)
                              .toString(),
                          endingDeployerBalance.add(gasCost).toString()
                      );

                      // need to ensure funders array is cleared out
                      await expect(fundMe.getFunder(0)).to.be.reverted;

                      for (i = 1; i < 6; i++) {
                          assert.equal(
                              await fundMe.getAddressToAmountFunded(
                                  accounts[i].address
                              ),
                              0
                          );
                      }
                  });

                  it("only allow owner to withdrawl funds", async function () {
                      const accounts = await ethers.getSigners();
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[7]
                      );
                      await expect(fundMeConnectedContract.withdrawl())
                          .reverted; //.to.be //With("FundMe__NotOwner");
                  });
              }
          });
      });
