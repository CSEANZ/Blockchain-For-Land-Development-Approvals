pragma solidity ^0.4.17;

contract DADetails {

    //STRUCTS
    struct FileAttachment {
        string[] ipfsHash;
        string fileName;
        string fileType;
        address uploadedBy;
    }

    struct EventLog {
        uint date;
        string party;
        string description;
        string ipfsHash;
    }

    // EVENTS
    event StateChanged(ContractStates newState);
    // ... all the state changes ...


    // FIELDS
    address public applicant;
    string public daid;
    uint public dateLodged;
    uint public dateApproved;
    //...
    // parcels {LotId, SectionId, PlanId, PlanType};
    string public description;
    uint public estimatedCost;
    string public lga;
    // status: DALodged, DApproval
    string[] public fileNames; 
    mapping (string => FileAttachment) attachments;
    EventLog[] public eventLogs;

    // contract states
    enum ContractStates {stateInitialized, DALodged, DAApproved, CCLodged, CCApproved, SCLodged, SCApproved, PlanLodged, PlanRegistered }
    ContractStates public State;


    // statechangedevents[]


    // CONSTRUCTOR
    function DADetails (string _daId, uint _dateLodged, string _description, string _lga) public {
        applicant = msg.sender;
        daid = _daId;
        dateLodged = _dateLodged;
        description = _description;
        lga = _lga;
    }

    // METHODS
    
    // function change the state
	function ChangeState(ContractStates newState) public {
		State = newState;
		StateChanged(newState);
	}

   // function returns the current state 
    function getCurrentState() public view returns (ContractStates) {
       return State;
    }


    // function changes the state to DA lodged 
    function DALodge (address _applicant, string _daid, uint _dateLodged, string _description, string _lga, uint _estimatedcost, uint _dateApproved) public {
        applicant = msg.sender;
        daid = _daid;
        dateLodged = _dateLodged;
        description = _description;
        lga = _lga;
        estimatedCost = _estimatedcost;
        dateApproved = _dateApproved;
        ChangeState(ContractStates.DALodged);
    }


    // function changes the state to DA Approved if current contract state is DA Lodged
    function DAApprove(bool DAApproveResult) public returns (bool) {
		require(State == ContractStates.DALodged);
		
		if(DAApproveResult) {
			StateChanged(ContractStates.DAApproved);
		} else {
			StateChanged(ContractStates.DALodged);
		}
	return true;
	}

    // function changes the state to construction (CC) lodged if current contract state is DAApproved approved
    function CCLodge (address _applicant, string _daid, uint _dateLodged, string _description, string _lga, uint _estimatedcost, uint _dateApproved) public {      
        require(State == ContractStates.DAApproved);
       
        applicant = msg.sender;
        daid = _daid;
        dateLodged = _dateLodged;
        description = _description;
        lga = _lga;
        estimatedCost = _estimatedcost;
        dateApproved = _dateApproved;
        ChangeState(ContractStates.CCLodged);
    }


    // function changes the state to construction (CC) approved if current contract state is construction (CC) lodged
    function CCApprove(bool CCApproveResult) public returns (bool) {
		require(State == ContractStates.CCLodged);
		
		if(CCApproveResult) {
			StateChanged(ContractStates.CCApproved);
		} else {
			StateChanged(ContractStates.CCLodged);
		}
	return true;
	}


    // function changes the state to sub division (SC) lodged if current contract state is construction (CC) approved
     function SCLodge (address _applicant, string _daid, uint _dateLodged, string _description, string _lga, uint _estimatedcost, uint _dateApproved) public {
        require(State == ContractStates.CCApproved);
        applicant = msg.sender;
        daid = _daid;
        dateLodged = _dateLodged;
        description = _description;
        lga = _lga;
        estimatedCost = _estimatedcost;
        dateApproved = _dateApproved;
        ChangeState(ContractStates.SCLodged);
    }

   // function changes the state to sub division (SC) approved if current contract state is sub division (SC) lodged
    function SCApprove(bool SCApproveResult) public returns (bool) {
		require(State == ContractStates.SCLodged);
		
		if(SCApproveResult) {
			StateChanged(ContractStates.SCApproved);
		} else {
			StateChanged(ContractStates.SCLodged);
		}
	return true;
	}


    // function changes the state to Plan lodged if current contract state is sub divison approved
     function PlanApprove (address _applicant, string _daid, uint _dateLodged, string _description, string _lga, uint _estimatedcost, uint _dateApproved) public {
        require(State == ContractStates.SCApproved);

        applicant = msg.sender;
        daid = _daid;
        dateLodged = _dateLodged;
        description = _description;
        lga = _lga;
        estimatedCost = _estimatedcost;
        dateApproved = _dateApproved;
        StateChanged(ContractStates.PlanLodged);
    }

    // function changes the state to PlanRegistered if current contract state is Plan Lodged
     function PlanRegister(bool PlanRegisteredResult) public returns (bool) {
		require(State == ContractStates.PlanLodged);
		
		if (PlanRegisteredResult) {
			StateChanged(ContractStates.PlanRegistered);
		} else {
			StateChanged(ContractStates.PlanLodged);
		}
	return true;
	}


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

    function getFileType(string fileName) public view returns(string) {
        var attachment = attachments[fileName];
        return attachment.fileType;
    } 

    function getLatestIpfsHash(string fileName) public view returns(string) {
        var attachment = attachments[fileName];
        if (attachment.uploadedBy == 0x00) {
            return "";
        } else {
            return attachment.ipfsHash[attachment.ipfsHash.length - 1];
        }
    }

    function getAttachmentVersionCount(string fileName) public view returns(uint256) {
        var attachment = attachments[fileName];
        if (attachment.uploadedBy == 0x00) {
            return 0;
        } else {
            return attachment.ipfsHash.length;
        }
    }

    function getAttachmentVersionByIndex(string fileName, uint256 index) public view returns(string) {
        var attachment = attachments[fileName];
        if (attachment.uploadedBy == 0x00) {
            return "";
        } else if (attachment.ipfsHash.length < index + 1) {
            return "";
        } else {
            return attachment.ipfsHash[index];
        }
    }

    function getUploadedBy(string fileName) public view returns(address) {
        var attachment = attachments[fileName];
        return attachment.uploadedBy;
    }

    function addEventLog(string party, string description, string ipfsHash) public {
        EventLog eventLog;
        eventLog.date = now;
        eventLog.party = party;
        eventLog.description = description;
        eventLog.ipfsHash = ipfsHash;
        eventLogs.push(eventLog);
    }

    function getEventLogsNumber() public view returns (uint256) {
        return eventLogs.length;
    }
}