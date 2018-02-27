pragma solidity ^0.4.17;

contract DADetails {

    //STRUCTS
    struct FileAttachment {
        string[] ipfsHash;
        string fileName;
        string fileType;
        address uploadedBy;
    }

    // EVENTS
    event StateChanged();
    // ... all the state changes ...


    // FIELDS
    address public applicant;
    string public daid;
    uint public dateLodged;
    //...
    // parcels {LotId, SectionId, PlanId, PlanType};
    string public description;
    uint public estimatedCost;
    string public lga;
    // status: DALodged, DApproval
    string[] public fileNames; 
    mapping (string => FileAttachment) attachments;

    // statechangedevents[]


    // CONSTRUCTOR
    function DADetails (uint _dateLodged, string _description, string _lga) public {
        applicant = msg.sender;
        dateLodged = _dateLodged;
        description = _description;
        lga = _lga;
    }

    // METHODS

    // get the hash of all the geographic files associated with this contract
    function getGeoFiles() public view returns(string) {
        return "[]";
    }

    function addAttachment(string fileName, string fileType, address uploadedBy, string ipfsHash) public returns(bool) {
        // look for the file name in the contract already
        var attachment = attachments[fileName];
        // if it's there, simply add the ipfs hash to the array of hashes, update the filetype and uploadedby
        // if it's not, we get a blank one back, so this will fill it in.
        if (attachment.uploadedBy == 0x00) {
            fileNames.push(fileName);
        }
        attachment.ipfsHash.push(ipfsHash);
        attachment.fileType = fileType;
        attachment.uploadedBy = uploadedBy;
        attachment.fileName = fileName;
        attachments[fileName] = attachment;
    }

    function getFileNamesCount() public view returns(uint256) {
        return fileNames.length;
    }

    function getFileName(uint256 index) public view returns(string) {
        return fileNames[index];
    }


}