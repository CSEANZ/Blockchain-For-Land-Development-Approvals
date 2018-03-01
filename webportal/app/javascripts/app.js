// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3 } from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import daRegister_artifacts from '../../../truffle/build/contracts/DARegister.json'
import daDetails_artifacts from '../../../truffle/build/contracts/DADetails.json'

var DaRegister = contract(daRegister_artifacts);
var DaDetails = contract(daDetails_artifacts);

var accounts;
var account;

window.App = {
  start: function () {
    var self = this;

    DaRegister.setProvider(web3.currentProvider);
    DaDetails.setProvider(web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function (err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];

    });
  },

  uploadFiles: function () {
    console.log("Uploading Files");
    reader.onloadend = function () {
      const ipfs = window.IpfsApi('52.237.243.236', 5001) // Connect to IPFS
      const buf = buffer.Buffer(reader.result) // Convert data into buffer
      ipfs.files.add(buf, (err, result) => { // Upload buffer to IPFS
        if (err) {
          console.error(err)
          return
        }
        let url = `https://ipfs.io/ipfs/${result[0].hash}`
        console.log(`Url --> ${url}`)
        counter++

        const photo = document.getElementById("attachments");
        if (counter > photo.files.length - 1) return;
        reader.readAsArrayBuffer(photo.files[counter]);
      });
    }
    const photo = document.getElementById("attachments");
    reader.readAsArrayBuffer(photo.files[0]); // Read Provided File    
  },

  getDARegisterAddress: function () {
    var self = this;

    var daid = document.getElementById("searchdaid").value;
    var daRegister;
    DaRegister.deployed()
      .then(function (instance) {
        daRegister = instance;
        return daRegister.getDADetailsAddress.call(daid, { from: account });
      })
      .then(function (value) {
        var address = value.valueOf();
        return DaDetails.at(address).then(function (details) {
          var attachments = document.getElementById("attachments");
          var ecost = document.getElementById("ecost");

          details.daid().then(function (daid) {
            document.getElementById("daid").value = daid;
          });
          details.dateLodged().then(function (dateLodged) {
            document.getElementById("dateLodged").value = new Date(dateLodged*1000).toLocaleDateString();
          });
          details.description().then(function (desc) {
            document.getElementById("description").value = desc;
          });
          details.lga().then(function (lga) {
            document.getElementById("lga").value = lga;
          });
          
        });
      }).catch(function (e) {
        console.log(e);
        self.setStatus("Error getting da; see log.");
      });
  },

  submitDADetails: function () {
    var self = this;
    var daid = document.getElementById("daid").value;
    var description = document.getElementById("description").value;
    var dateLodged = document.getElementById("dateLodged").value;
    let date = (new Date(dateLodged)).getTime();

    let dateLodgedInUnixTimestamp = date / 1000;
    var lga = document.getElementById("lga").value;

    this.setStatus("Uploading files... (please wait)");
    // this.uploadFiles(); // upload all files by Sarthak Dabhi

    this.setStatus("Initiating transaction... (please wait)");

    var daRegister;

    DaRegister.deployed().then(function (instance) {
      daRegister = instance;
      return daRegister.createDA(daid, dateLodgedInUnixTimestamp, description, lga, { from: account });
    }).then(function () {
      self.setStatus("Transaction complete!");
    }).catch(function (e) {
      console.log(e);
      self.setStatus("Error creating DA");
    });
  },

  setStatus: function (message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

};

window.addEventListener('load', function () {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:7545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
  }

  App.start();
  //App.loading();
})
