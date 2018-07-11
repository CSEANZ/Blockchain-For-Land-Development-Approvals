var DADetails = artifacts.require("./DADetails.sol");

contract('DADetails', function (accounts) {

  it("should construct a new instance", async () => {

    // arrange
    var dateLodged = "12334567";
    var daId = "DAID";
    var description = "hello";
    var lga = "BCC";
    var estimatedcost = "4321";

    // act
    var daDetails = await DADetails.new(daId, dateLodged, description, lga, estimatedcost);

    var retrivedDateLodged = await daDetails.dateLodged();
    var retrivedDescription = await daDetails.description();
    var retrivedLga = await daDetails.lga();

    // assert
    assert.equal(retrivedDateLodged.valueOf(), dateLodged, "date lodged isn't the same");
    assert.equal(retrivedDescription.valueOf(), description, "description isn't the same");
    assert.equal(retrivedLga.valueOf(), lga, "lga isn't the same");
  });


  it("should return a list of the geographic files in the contract", async () => {

    var daId = "DAID";
    var dateLodged = "123456";
    var description = "Test geographic file types";
    var lga = "BCC";
    var estimatedCost = "4321"

    var daDetails = await DADetails.new(daId, dateLodged, description, lga, estimatedCost);
    var fileName = "nongeographicfile.pdf";
    var fileType = "conditions";
    var uploadedBy = 0x123;
    var ipfsHash = "Hash1";

    await daDetails.addAttachment(fileName, fileType, uploadedBy, ipfsHash);


    await daDetails.addAttachment(fileName, fileType, uploadedBy, "hash2");

    // add a geographic file
    fileName = "geographicfile.json";
    description = "Test geography file";
    fileType = "geography";
    uploadedBy = 0xacc;
    ipfsHash = "hash3";
    await daDetails.addAttachment(fileName, fileType, uploadedBy, ipfsHash);

    // update the geographic file a couple of times
    await daDetails.addAttachment(fileName, fileType, uploadedBy, "hash4");
    await daDetails.addAttachment(fileName, fileType, uploadedBy, "hash5");

    // add a second geographic file
    await daDetails.addAttachment("geofile2.json", "geography", 0xacc, "hash6");


    var versionCount = await daDetails.getAttachmentVersionCount(fileName);
    //console.log("version count for geographicfile.json ", versionCount);
    assert.equal(3, versionCount);  // there should be 3 versions

    var versionHash = await daDetails.getLatestIpfsHash(fileName);
    //console.log("latest version hash: ", versionHash);
    assert.equal("hash5", versionHash);


    // THIS WAS ALL JUST DEBUGGING CODE
    // console.log("all ipfs hashes:");
    // for (let v = 0; v < versionCount; v++) {
    //   console.log(v);
    //   console.log(await daDetails.getAttachmentVersionByIndex(fileName, v));
    // }

    // console.log("file type:");
    // console.log(await daDetails.getFileType(fileName));

    // console.log("uploaded by:");
    // console.log(await daDetails.getUploadedBy(fileName));

    // // loop through the files, and get a list of the ones that are geographic
    // var fileCount = await daDetails.getFileNamesCount();
    // console.log(fileCount);

    // for (let f = 0; f < fileCount; f++) {
    //   var theFileName = await daDetails.getFileName(f);
    //   console.log(theFileName);
    //   if (await daDetails.getFileType(theFileName) == "geography") {
    //     console.log("GEOGRAPHY FILE - latest version at");
    //     console.log(await daDetails.getLatestIpfsHash(theFileName));
    //   }
    // }

  });


  it("should change add event logs", async () => {
    var daId = "daidtest";
    var dateLodged = "123456";
    var description = "Test geographic file types";
    var lga = "BCC";
    var estimatedCost = "4321"

    var daDetails = await DADetails.new(daId, dateLodged, description, lga, estimatedCost);

    //console.log("Adding events");
    await daDetails.addEventLog("logString1", "logSubject1", "logDescription1", "logBy1", 123)
    await daDetails.addEventLog("logString2", "logSubject2", "logDescription2", "logBy2", 124)

    var eventLogCount = await daDetails.getEventLogsCount();
    //console.log("EventLogCount: ", eventLogCount);
    assert.equal(2, eventLogCount);

    for (let f = 0; f < eventLogCount; f++) {
      var eventlogid = await daDetails.getEventLogId(f);
      //console.log("Event log Id:", eventlogid, " eventLog num: ", f);
      assert.equal(daId+"_"+f, eventlogid); // format is <DAID>+_+<count of log #>
    }

  });
  /*
  
    it("should update and return the contract states from DALodged to PlanRegistered 0 - 7 )", async () => {
      // arrange
      var dateLodged = 12334567;
      var description = "Testing DA Lodge";
      var lga = "BCC";
      var daid = "DAID";
      var estimatedcost = 131443;
      var dateApproved = 12345678;
  
      // act
      var daDetails = await DADetails.new(daid, dateLodged, description, lga);
  
      daDetails.daLodge(daid, dateLodged, description, lga, estimatedcost, dateApproved);
      var currentState = await daDetails.getCurrentState();
      console.log("---------------------------");
      console.log("current state for DALodged ", currentState.toString());
      console.log("---------------------------");
  
      var daApproveStatus = await daDetails.DAApprove(true);
      currentState = await daDetails.getCurrentState();
      console.log("---------------------------");
      console.log("current state for DAApprove ", currentState.toString());
      console.log("---------------------------");
  
      daDetails.CCLodge(12345, "cc lodge", 23456);
      var currentState = await daDetails.getCurrentState();
      console.log("---------------------------");
      console.log("current state for CCLodged ", currentState.toString());
      console.log("---------------------------");
  
      var ccApproveStatus = await daDetails.CCApprove(true);
      currentState = await daDetails.getCurrentState();
      console.log("---------------------------");
      console.log("current state for CCApprove ", currentState.toString());
      console.log("---------------------------");
  
      daDetails.SCLodge(12345, "sc lodge", 23456);
      var currentState = await daDetails.getCurrentState();
      console.log("---------------------------");
      console.log("current state for SCLodged ", currentState.toString());
      console.log("---------------------------");
  
      var ccApproveStatus = await daDetails.SCApprove(true);
      currentState = await daDetails.getCurrentState();
      console.log("---------------------------");
      console.log("current state for SCApprove ", currentState.toString());
      console.log("---------------------------");
  
      daDetails.PlanApprove(12345, "plan approve", 23456);
      var currentState = await daDetails.getCurrentState();
      console.log("---------------------------");
      console.log("current state for SCLodged ", currentState.toString());
      console.log("---------------------------");
  
      var ccApproveStatus = await daDetails.PlanRegister(true);
      currentState = await daDetails.getCurrentState();
      console.log("---------------------------");
      console.log("current state for SCApprove ", currentState.toString());
      console.log("---------------------------");
  
  
    });
  
  */

});