var DARegister = artifacts.require("./DARegister.sol");

module.exports = function(deployer) {
  deployer.deploy(DARegister);
};
