// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";
import "../stylesheets/main.css";

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

  uploadFile: function (file, el) {
    fileType = file.type;
    fileName = file.name;
    var that = this;
    var reader = new FileReader();
    reader.onloadend = function () {
      const ipfs = window.IpfsApi('ipfs.landchain.com.au', 5001) // Connect to IPFS
      const buf = buffer.Buffer(reader.result) // Convert data into buffer
      ipfs.files.add(buf, (err, result) => { // Upload buffer to IPFS
        if (err) {
          console.error(err);
          return 0;
        }
        let url = `https://ipfs.io/ipfs/${result[0].hash}`;
        el.html('Uploaded');
        el.prop('disabled', true);
        el.parent().siblings().eq(0).prop('disabled', true);
        el.removeClass('btn-outline-secondary').addClass('btn-success');
        el.parent().parent().siblings().eq(1).remove();

        localforage.getItem('myStorage').then(function (value) {
          if (value === null) {
            let dt = new Date();
            let obj = {
              fileName: fileName,
              url: url,
              fileType: fileType,
              timestamp: Math.floor(Date.now() / 1000)
            };
            let temp = [];
            temp.push(obj);
            localforage.setItem('myStorage', temp).then(function (value) {
              // console.log(value[0]);
            }).catch(function (err) {
              console.log(err);
            });
          } else {
            let dt = new Date();
            let temp = value;
            let obj = {
              fileName: fileName,
              url: url,
              fileType: fileType,
              timestamp: Math.floor(Date.now() / 1000)
            };
            temp.push(obj);
            localforage.setItem('myStorage', temp).then(function (value) {
              // console.log(value);
            }).catch(function (err) {
              console.log(err);
            });
          }
        }).catch(function (err) {
          console.log(err);
        });

      });
    };
    reader.readAsArrayBuffer(file);
  },


  attchmentField: '<div class="form-group"><label for="attachments">Attachment</label> <a href="javascript:void(0)" class="remove-attachment small">remove</a><div class="input-group mb-3"><input type="file" class="form-control" placeholder="Attachment" name="attachments[]"><div class="input-group-append"><button class="btn btn-outline-secondary upload-attachment" type="button">Upload</button></div></div></div>',

  attachEvents: function () {
    var that = this;

    $$(document).on('click', '.upload-attachment', function (e) {
      that.uploadFile($$(this).parent().siblings()[0].files[0], $$(this));
    });

    $$(document).on('click', '.remove-attachment', function (e) {
      $$(this).parent().remove();
    });

    $$('#add-new-attachments').on('click', function (e) {
      $$('#attachments').append(that.attchmentField);
    });
  },

  start: function () {
    var self = this;

    this.attachEvents();

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
          details.daid().then(function (daid) {
            document.getElementById("daid").value = daid;
          });
          details.dateLodged().then(function (dateLodged) {
            document.getElementById("dateLodged").value = new Date(dateLodged * 1000).toLocaleDateString();
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

  clear: function () {
    document.getElementById("mainForm").reset();
  },

  submitDADetails: function () {
    var self = this;
    var daid = document.getElementById("daid").value;
    var description = document.getElementById("description").value;
    var dateLodged = document.getElementById("dateLodged").value;
    let date = (new Date(dateLodged)).getTime();

    let dateLodgedInUnixTimestamp = date / 1000;
    var lga = document.getElementById("lga").value;
    this.setStatus("Initiating transaction... (please wait)");

    var daRegister;

    DaRegister.deployed().then(function (instance) {
      daRegister = instance;
      console.log("createDA");
      self.setStatus("creating Development Application");
      return daRegister.createDA(daid, dateLodgedInUnixTimestamp, description, lga, { from: account });
    }).then(function (result) {
      console.log("created createDA");
      self.setStatus("created Development Application");
      return daRegister.getDADetailsAddress.call(daid, { from: account });
    }).then(function (result2) {
      console.log("got address: " + result2);
      self.setStatus("retrieving Attachments");
      var address = result2.valueOf();
      return DaDetails.at(address).then(function (details) {
        console.log("got details: " + details);

        return localforage.getItem('myStorage').then(function (storage) {

          self.setStatus("Adding " + storage.length + " Attachments...");
          console.log("got storage: " + storage.length);
          storage.sort(function (x, y) {
            return y.timestamp - x.timestamp;
          });

          for (var i = 0; i < storage.length; i++) {
            details.addAttachment(storage[i].fileName, storage[i].fileType, account, storage[i].url, { from: account }).then(function (result5) {
              console.log("addAttachment " + i + ": " + result5);
            });
          }

          localforage.removeItem('myStorage').then(function (result6) {
            console.log("clear local storage");
          });

          self.setStatus("Finished creating Development Application - Press Clear");

        });
      });
    });
  },

  approveDA: function () {
    var self = this;
    var daid = document.getElementById("daid").value;
    var description = document.getElementById("description").value;
    var dateLodged = document.getElementById("dateLodged").value;
    let lodgedDate = (new Date(dateLodged)).getTime();
    let dateLodgedInUnixTimestamp = lodgedDate / 1000;

    var lga = document.getElementById("lga").value;
    var status = document.getElementById("states").value;
    var estimatedcost = document.getElementById("ecost").value;
    var dateApproved = document.getElementById("dateApproved").value;
    let approvedDate = (new Date(dateApproved)).getTime();
    let dateApprovedInUnixTimestamp = approvedDate / 1000;

    var daRegister;

    DaRegister.deployed().then(function (instance) {
      daRegister = instance;
      console.log("Retrieving");
      self.setStatus("Retrieving Development Application");
      return daRegister.getDADetailsAddress.call(daid, { from: account });
    }).then(function (result) {
      console.log("Retrieved");
      self.setStatus("Retrieved Development Application");
      var address = result.valueOf();
      return DaDetails.at(address).then(function (details) {

        switch (status) {
          case "DALodged":
            return details.DALodge(account, daid, dateLodgedInUnixTimestamp, description, lga,
              estimatedcost, dateApprovedInUnixTimestamp, { from: account })
              .then(function () {
                self.addAttachments(details).then(function () {
                  self.setStatus("DALodge Transaction complete!");
                });
              }).catch(function (e) {
                console.log(e);
                self.setStatus("Error creating DALodge");
              });
            break;
          case "DAApproved":
            return details.DAApprove(true, { from: account })
              .then(function () {
                self.addAttachments(details).then(function () {
                  self.setStatus("DAApprove Transaction complete!");
                });
              }).catch(function (e) {
                console.log(e);
                self.setStatus("Error creating DAApprove");
              });
            break;
          case "CCLodged":
            return details.CCLodge(dateLodgedInUnixTimestamp, description, dateApprovedInUnixTimestamp, { from: account })
              .then(function () {
                self.addAttachments(details).then(function () {
                  self.setStatus("CCLodge Transaction complete!");
                });
              }).catch(function (e) {
                console.log(e);
                self.setStatus("Error creating CCLodge");
              });
            break;
          case "CCApproved":
            return details.CCApprove(true, { from: account })
              .then(function () {
                self.addAttachments(details).then(function () {
                  self.setStatus("CCApprove Transaction complete!");
                });
              }).catch(function (e) {
                console.log(e);
                self.setStatus("Error creating CCApprove");
              });
            break;
          case "SCLodged":
            return details.SCLodge(dateLodgedInUnixTimestamp, description, dateApprovedInUnixTimestamp, { from: account })
              .then(function () {
                self.addAttachments(details).then(function () {
                  self.setStatus("SCLodge Transaction complete!");
                });
              }).catch(function (e) {
                console.log(e);
                self.setStatus("Error creating SCLodge");
              });
            break;
          case "SCApproved":
            return details.SCApprove(true, { from: account })
              .then(function () {
                self.addAttachments(details).then(function () {
                  self.setStatus("SCApprove Transaction complete!");
                });
              }).catch(function (e) {
                console.log(e);
                self.setStatus("Error creating SCApprove");
              });
            break;
          case "PlanApprove":
            return details.PlanApprove(dateLodgedInUnixTimestamp, description, dateApprovedInUnixTimestamp, { from: account })
              .then(function () {
                self.addAttachments(details).then(function () {
                  self.setStatus("PlanApprove Transaction complete!");
                });
              }).catch(function (e) {
                console.log(e);
                self.setStatus("Error creating PlanApprove");
              });
            break;
          case "PlanRegistered":
            return details.PlanRegistered(true, { from: account })
              .then(function () {
                self.addAttachments(details).then(function () {
                  self.setStatus("PlanRegistered Transaction complete!");
                });
              }).catch(function (e) {
                console.log(e);
                self.setStatus("Error creating PlanRegistered");
              });
            break;
          default:
            {
              console.log("Error status not implimented.");
              self.setStatus("Error status not implimented.");
            }
        }

        self.setStatus("Finished creating Development Application - Press Clear");

      });
    });
  },

  addAttachments: function (details) {
    return localforage.getItem('myStorage').then(function (storage) {

      if (storage) {

        //self.setStatus("Adding " + storage.length + " Attachments...");
        console.log("got storage: " + storage.length);
        storage.sort(function (x, y) {
          return y.timestamp - x.timestamp;
        });

        for (var i = 0; i < storage.length; i++) {
          details.addAttachment(storage[i].fileName, storage[i].fileType, account, storage[i].url, { from: account }).then(function (result5) {
            console.log("addAttachment " + i + ": " + result5);
          });
        }

        localforage.removeItem('myStorage').then(function (result6) {
          console.log("clear local storage");
        });

        // self.setStatus("Finished creating Development Application - Press Clear");
      }
    });

  },

  setStatus: function (message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  hideDiv: function () {
    document.getElementById('daid').readOnly = true;
    document.getElementById('ecost').readOnly = true;
    document.getElementById('lga').readOnly = true;
    document.getElementById('description').readOnly = true;
    document.getElementById('dateLodged').readOnly = true;
    document.getElementById('dateApproved').readOnly = true;
  },

  showDiv: function (elem) {
    var self = this;
    switch (elem.value) {
      case "DALodged":
        document.getElementById('daid').readOnly = false;
        document.getElementById('ecost').readOnly = false;
        document.getElementById('lga').readOnly = false;
        document.getElementById('description').readOnly = false;
        document.getElementById('dateLodged').readOnly = false;
        document.getElementById('dateApproved').readOnly = false;
        break;
      case "CCLodged":
        App.hideDiv();
        document.getElementById('daid').readOnly = false;
        document.getElementById('description').readOnly = false;
        document.getElementById('dateLodged').readOnly = false;
        document.getElementById('dateApproved').readOnly = false;
        break;
      case "SCLodged":
        App.hideDiv();
        document.getElementById('daid').readOnly = false;
        document.getElementById('description').readOnly = false;
        document.getElementById('dateLodged').readOnly = false;
        document.getElementById('dateApproved').readOnly = false;
        break;
      case "PlanApprove":
        App.hideDiv();
        document.getElementById('daid').readOnly = false;
        document.getElementById('description').readOnly = false;
        document.getElementById('dateLodged').readOnly = false;
        document.getElementById('dateApproved').readOnly = false;
        break;
      default:
        {
          App.hideDiv();
          document.getElementById('daid').readOnly = false;
          document.getElementById('ecost').readOnly = true;
          document.getElementById('lga').readOnly = true;
          document.getElementById('description').readOnly = true;
          document.getElementById('dateLodged').readOnly = true;
          document.getElementById('dateApproved').readOnly = true;
        }
    }
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
