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

  viewDA: function () {
    var self = this;
    var events = [];
    var daid = document.getElementById("searchdaid").value;
    var daRegister;
    self.setStatus("Searching register for " + daid);
    return DaRegister.deployed()
      .then(function (instance) {
        daRegister = instance;
        self.setStatus("Getting address for " + daid);

        return daRegister.getDADetailsAddress.call(daid, { from: account });
      })
      .then(function (value) {
        var address = value.valueOf();
        self.setStatus("Retrieve contract for " + daid);

        return DaDetails.at(address).then(function (details) {
          self.setStatus("Retrieve attachements for " + daid);

          details.getFileNamesCount().then(function (count) {
            var html = "";
            for (var i = 0; i < count.toNumber(); i++) {

              details.getFileName(i).then(function (fileName) {
                details.getFileType(fileName).then(function (fileType) {
                  details.getLatestIpfsHash(fileName).then(function (hash) {
                    //html += '<li class="list-group-item">File name: ' + fileName + ' File type: ' + fileType + ' File hash:' + hash + '</li>';
                    html += '<li class="list-group-item">File name: <a target="_blank" href="' + hash + '">' + fileName + '</a> File type: ' + fileType + '</li>';
                    $$('#view-app-list').html(html);
                  }).catch(function (e) {
                    console.log("1 " + e);
                    self.setStatus("Error getting da; see log.");
                  });
                }).catch(function (e) {
                  console.log("2 " + e);
                  self.setStatus("Error getting da; see log.");
                });
              }).catch(function (e) {
                console.log("3 " + e);
                self.setStatus("Error getting da; see log.");
              });
            };
          }).catch(function (e) {
            console.log("4 " + e);;
            self.setStatus("Error getting da; see log.");
          });

          details.getEventLogsCount().then(function (count1) {
            self.setStatus("Retrieve events for " + daid);

            var html2 = "";
            if (count1 == null || count1.toNumber() <= 0 ) {
              html2 += '<li class="list-group-item">No events</li>';
              $$('#view-app-events').html(html2);
            } else {

              for (var i = 0; i < count1.toNumber(); i++) {
                var index = i;
                details.getEventLogData.call(index).then(function (eventString) {
                  html2 += '<li class="list-group-item">' + eventString[0] + ': ' + eventString[1] + ' <span class="float-right"> <i class="far fa-clock"></i>' + new Date(Number(eventString[3]) * 1000).toLocaleString() + '</span></li>';
                  $$('#view-app-events').html(html2);
                });
              }
            }
          }).catch(function (e) {
            console.log("5 " + e);
            self.setStatus("Error getting da; see log.");
          });

          details.daid().then(function (daid) {
            document.getElementById("daid").value = daid;
          }).catch(function (e) {
            console.log("6 " + e);
            self.setStatus("Error getting daid; see log.");
          });
          details.dateLodged().then(function (dateLodged) {
            document.getElementById("dateLodged").value = new Date(dateLodged * 1000).toLocaleDateString();
          }).catch(function (e) {
            console.log("7 " + e);
            self.setStatus("Error getting dateLodged; see log.");
          });
          details.description().then(function (desc) {
            document.getElementById("description").value = desc;
          }).catch(function (e) {
            console.log("8 " + e);
            self.setStatus("Error getting description; see log.");
          });
          details.estimatedCost().then(function (ecost) {
            document.getElementById("ecost").value = ecost;
          }).catch(function (e) {
            console.log("9 " + e);
            self.setStatus("Error getting ecost; see log.");
          });

          details.lga().then(function (lga) {
            document.getElementById("lga").value = lga;
          }).catch(function (e) {
            console.log("10 " + e);
            self.setStatus("Error getting lga; see log.");
          });

          details.getCurrentState().then(function (state) {
            var currentState = '';
            switch (state.toNumber()) {
              case 0:
                currentState = 'DA Lodged';
                break;
              case 1:
                currentState = 'DA Approved';
                break;
              case 2:
                currentState = 'CC Lodged';
                break;
              case 3:
                currentState = 'CC Approved';
                break;
              case 4:
                currentState = 'SC Lodged';
                break;
              case 5:
                currentState = 'SC Approved';
                break;
              case 6:
                currentState = 'Plan Approved';
                break;
              case 7:
                currentState = 'Plan Registered';
                break;
              default:
                currentState = 'Unknown';
            }

            document.getElementById("state").value = currentState;

          }).catch(function (e) {
            console.log("state " + e);
            self.setStatus("Error getting state; see log.");
          });

        }).catch(function (e) {
          console.log("11 " + e);
          self.setStatus("Error contact address; see log.");
        });
      }).catch(function (e) {
        console.log("12 " + e);
        self.setStatus("Error getting daid address; see log.");
      });

    self.setStatus("");

  },

  clear: function () {
    document.getElementById("mainForm").reset();
  },

  submitDADetails: function () {
    var self = this;
    var daid = document.getElementById("daid").value;
    var description = document.getElementById("description").value;
    var dateLodged = document.getElementById("dateLodged").value;
    var estimatedCost = document.getElementById("ecost").value;
    let date = (new Date(dateLodged)).getTime();

    let dateLodgedInUnixTimestamp = date / 1000;
    var lga = document.getElementById("lga").value;
    this.setStatus("Initiating transaction... (please wait)");

    var daRegister;

    DaRegister.deployed().then(function (instance) {
      daRegister = instance;
      console.log("createDA");
      self.setStatus("creating Development Application");
      return daRegister.createDA(daid, dateLodgedInUnixTimestamp, description, lga, estimatedCost, { from: account });
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

        self.addAttachments(details, self).then(function () {
          self.setStatus("DALodge Transaction complete!");
        });
        self.setStatus("Finished creating Development Application - Press Clear");
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
          case "DAApproved":
            return self.daApprove(details, self);
            break;
          case "CCLodged":
            return self.ccLodge(details, self);
            break;
          case "CCApproved":
            return self.ccApprove(details, self);
            break;
          case "SCLodged":
            return self.scLodge(details, self);
            break;
          case "SCApproved":
            return self.scApprove(details, self);
            break;
          case "PlanApprove":
            return self.planApprove(details, self);
            break;
          case "PlanRegistered":
            return self.planRegister(details, self);
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


  addEventLog: function (details, title, subject, subTitle) {
    return details.addEventLog(title, subject, account, Date.now() / 1000, { from: account }).then(function (added) {
      console.log("added log " + title );
    });
  },

  daApprove: function (details, self) {
    return details.daApprove(true, { from: account }).then(function () {
      console.log("DAApprove ");
      self.addEventLog(details, "DAApprove", "").then(function () {
        self.addAttachments(details, self).then(function () {
          self.setStatus("DAApprove Transaction complete!");
        });
      }).catch(function (e) {
        console.log(e);
        self.setStatus("Error creating DAApprove");
      });
    });
  },

  ccLodge: function (details, self) {
    var description = document.getElementById("description").value;
    var dateLodged = document.getElementById("dateLodged").value;
    let lodgedDate = (new Date(dateLodged)).getTime();
    let dateLodgedInUnixTimestamp = lodgedDate / 1000;

    var dateApproved = document.getElementById("dateApproved").value;
    let approvedDate = (new Date(dateApproved)).getTime();
    let dateApprovedInUnixTimestamp = approvedDate / 1000;

    return details.ccLodge(dateLodgedInUnixTimestamp, description, dateApprovedInUnixTimestamp, { from: account }).then(function () {
      console.log("CCLodge ");
      self.addEventLog(details, "CCLodge", "", "").then(function () {
        self.addAttachments(details, self).then(function () {
          self.setStatus("CCLodge Transaction complete!");
        });
      }).catch(function (e) {
        console.log(e);
        self.setStatus("Error creating CCLodge");
      });
    });
  },

  ccApprove: function (details, self) {
    return details.ccApprove(true, { from: account }).then(function () {
      console.log("CCApprove ");
      self.addEventLog(details, "CCApprove", "", "").then(function () {
        self.addAttachments(details, self).then(function () {
          self.setStatus("CCApprove Transaction complete!");
        });
      }).catch(function (e) {
        console.log(e);
        self.setStatus("Error creating CCApprove");
      });
    });
  },

  scLodge: function (details, self) {
    var description = document.getElementById("description").value;
    var dateLodged = document.getElementById("dateLodged").value;
    let lodgedDate = (new Date(dateLodged)).getTime();
    let dateLodgedInUnixTimestamp = lodgedDate / 1000;

    var dateApproved = document.getElementById("dateApproved").value;
    let approvedDate = (new Date(dateApproved)).getTime();
    let dateApprovedInUnixTimestamp = approvedDate / 1000;

    return details.scLodge(dateLodgedInUnixTimestamp, description, dateApprovedInUnixTimestamp, { from: account }).then(function () {
      console.log("SCLodge ");
      self.addEventLog(details, "SCLodge", "", "").then(function () {
        self.addAttachments(details, self).then(function () {
          self.setStatus("SCLodge Transaction complete!");
        });
      }).catch(function (e) {
        console.log(e);
        self.setStatus("Error creating SCLodge");
      });
    });
  },

  scApprove: function (details, self) {
    return details.scApprove(true, { from: account }).then(function () {
      console.log("SCApprove ");
      self.addEventLog(details, "SCApprove", "", "").then(function () {
        self.addAttachments(details, self).then(function () {
          self.setStatus("SCApprove Transaction complete!");
        });
      }).catch(function (e) {
        console.log(e);
        self.setStatus("Error creating SCApprove");
      });
    });
  },

  planApprove: function (details, self) {
    var description = document.getElementById("description").value;
    var dateLodged = document.getElementById("dateLodged").value;
    let lodgedDate = (new Date(dateLodged)).getTime();
    let dateLodgedInUnixTimestamp = lodgedDate / 1000;

    var dateApproved = document.getElementById("dateApproved").value;
    let approvedDate = (new Date(dateApproved)).getTime();
    let dateApprovedInUnixTimestamp = approvedDate / 1000;

    return details.planApprove(dateLodgedInUnixTimestamp, description, dateApprovedInUnixTimestamp, { from: account }).then(function () {
      console.log("PlanApprove ");
      self.addEventLog(details, "PlanApprove", "", "").then(function () {
        self.addAttachments(details, self).then(function () {
          self.setStatus("PlanApprove Transaction complete!");
        });
      }).catch(function (e) {
        console.log(e);
        self.setStatus("Error creating PlanApprove");
      });
    });
  },

  planRegister: function (details, self) {
    return details.planRegister(true, { from: account }).then(function () {
      console.log("PlanRegister ");
      self.addEventLog(details, "PlanRegister", "", "").then(function () {
        self.addAttachments(details, self).then(function () {
          self.setStatus("PlanRegister Transaction complete!");
        });
      }).catch(function (e) {
        console.log(e);
        self.setStatus("Error creating PlanRegister");
      });
    });
  },

  addAttachments: function (details, self) {
    return localforage.getItem('myStorage').then(function (storage) {

      if (storage) {
        console.log("got storage: " + storage.length);
        storage.sort(function (x, y) {
          return y.timestamp - x.timestamp;
        });

        for (var i = 0; i < storage.length; i++) {
          var filename = storage[i].fileName;
          var fileType = storage[i].fileType;
          var url = storage[i].url;

          details.addAttachment(fileName, fileType, account, url, { from: account }).then(function (result5) {
            console.log("addAttachment " + i + ": " + result5);
            self.addEventLog(details, "Artifact", fileName, fileType).then(function (added) {
              console.log("added Artifact ");
            });
          });
        }
        localforage.removeItem('myStorage').then(function (result8) {
          console.log("clear local storage");
        });
      }
    });
  },

  setStatus: function (message) {
    document.getElementById("status").value = message;
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
})
