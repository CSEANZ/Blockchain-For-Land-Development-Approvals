pragma solidity ^0.4.17;

contract DADetails {

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
    // attachments { IPFSHash[], filename, fileType, uploader }

    // statechangedevents[]


    // CONSTRUCTOR
    function DADetails (uint _dateLodged, string _description, string _lga) public {
        applicant = msg.sender;
        dateLodged = _dateLodged;
        description = _description;
        lga = _lga;
    }

    // METHODS


}