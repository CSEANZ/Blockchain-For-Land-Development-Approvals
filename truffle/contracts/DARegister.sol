pragma solidity ^0.4.17;
import "./DADetails.sol";

contract DARegister {

    // FIELDS
    mapping(string => address) register;
    string[] daIds;

    // METHODS
    function registerDA (string _daId, address _address) public {
        if (register[_daId] == 0x00) {
            daIds.push(_daId);
        }
        register[_daId] = _address;

    }

    function getDADetailsAddress (string _daId) public view returns(address) {
        return register[_daId];
    }

    function getDARegisterCount() public view returns(uint256) {
        return daIds.length;
    }

    function getDARegisterId(uint256 index) public view returns(string) {
        return daIds[index];
    }

    function createDA (string _daId, uint _dateLodged, string _description, string _lga) public {
        var daDetails = new DADetails(_daId, _dateLodged, _description, _lga);
        registerDA(_daId, daDetails);

    }
 
 }