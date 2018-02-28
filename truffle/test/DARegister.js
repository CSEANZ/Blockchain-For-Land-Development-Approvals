var DARegister = artifacts.require("./DARegister.sol");

contract('DARegister', function (accounts) {
    it("should construct a new instance", async () => {
        // arrange
        var daId1 = "DAID1";
        var daId1Address = 0xda1;
        var daId2 = "DAID2";
        var daId2Address = 0xda2;
        var daId3 = "DAID3";

        var daId4 = "DAID4";
        var daDateLodged = "12345678";
        var daDescription = "Created description";
        var daLga = "Test LGA";

        // act
        // create a daRegister
        var daRegister = await DARegister.new();

        // add a couple of DAIds
        await daRegister.registerDA(daId1, daId1Address);
        await daRegister.registerDA(daId2, daId2Address);

        // call the Create method
        var created = await daRegister.createDA(daId4, daDateLodged, daDescription, daLga);


        // retrieve some details
        var registerCount = await daRegister.getDARegisterCount();
        var retrievedIds = [];
        for (let index = 0; index < registerCount; index++) {
            retrievedIds.push(await daRegister.getDARegisterId(index));
        }

        var retrievedAddress1 = await daRegister.getDADetailsAddress(daId1);
        var retrievedAddress2 = await daRegister.getDADetailsAddress(daId2);
        var retrievedAddress3 = await daRegister.getDADetailsAddress(daId3);
        var retrievedAddress4 = await daRegister.getDADetailsAddress(daId4);

        // assert
        console.log("There are ", registerCount, " DAs registered");
        assert.equal(registerCount, 3, "There should be 3 DAs registered");
        assert.equal(retrievedIds.find(r => r == daId1), daId1, "DAID1 should be in the regisered list");
        assert.equal(retrievedIds.find(r => r == daId2), daId2, "DAID2 should be in the regisered list");
        assert.equal(retrievedIds.indexOf(r => r == daId3), -1, "DAID3 should NOT be in the regisered list");
        assert.notEqual(retrievedAddress4, 0x00, "DAID4 address should NOT be empty");
        assert.equal(retrievedAddress1, daId1Address, "DAID1 Address should be 0xda1");
        assert.equal(retrievedAddress2, daId2Address, "DAID2 Address should be 0xda2");
        assert.equal(retrievedAddress3, 0x00, "DAID3 Address should be empty");


    });
});