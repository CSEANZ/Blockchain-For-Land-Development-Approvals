// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";
import "../stylesheets/main.css";

// Import libraries we need.
import { default as Web3 } from 'web3';
import { default as contract } from 'truffle-contract'

import {default as buffer} from './buffer.js'

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
      // ** CHANGE THIS TO YOUR IPFS NODE ADDRESS IF NOT LOCALHOST **
      const ipfs = window.IpfsApi('localhost', 5001) // Connect to IPFS
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
            console.log(obj)
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
    // Clear out local storage.
    localforage.clear();

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
    this.clear();
    self.setStatus("Locating Development Application register");
    return DaRegister.deployed()
      .then(function (instance) {
        daRegister = instance;
        self.setStatus("Searching register for " + daid);

        return daRegister.getDADetailsAddress.call(daid, { from: account });
      })
      .then(function (value) {
        var address = value.valueOf();

        if (address.substring(0, 4) == '0x00') {
          self.setStatus("Register address not found for " + daid);
          return;
        }

        self.setStatus("Retrieving " + daid);

        return DaDetails.at(address).then(function (details) {

          details.getFileNamesCount().then(function (count) {
            console.log("Found ", count.toNumber(), " files")

            if (count.toNumber() > 0) {
              self.setStatus("Retrieving attachments for " + daid);
            }

            var html = "";
            for (var i = 0; i < count.toNumber(); i++) {
              console.log("Getting file ", i)

              details.getFileName(i).then(function (fileName) {
                console.log("File name was: ", fileName)
                details.getFileType(fileName).then(function (fileType) {
                  console.log("File type was: ", fileType)
                  details.getLatestIpfsHash(fileName).then(function (hash) {

                    //html += '<li class="list-group-item">File name: ' + fileName + ' File type: ' + fileType + ' File hash:' + hash + '</li>';
                    if (fileType !== 'text/xml') {
                      html += '<li class="list-group-item">File name: <a target="_blank" href="' 
                        + hash + '">' 
                        + fileName + '</a> File type: ' 
                        + fileType + '</li>';
                    } else {
                      // This is XML, it might be land xml... let's assume it is!
                      html += '<li class="list-group-item">File name: <a target="_blank" href="/ldviewer.html?ipfs=' 
                        + hash.replace('https://ipfs.io/ipfs/', '')
                        + '&daid=' + daid + '">' 
                        + fileName + '</a> File type: ' 
                        + fileType + '</li>';
                    }
                    $$('#view-app-list').html(html);
                  }).catch(function (e) {
                    console.log("1 " + e);
                    self.setStatus("Error getting latest ipfs hash");
                  });
                }).catch(function (e) {
                  console.log("2 " + e);
                  self.setStatus("Error getting file type");
                });
              }).catch(function (e) {
                console.log("3 " + e);
                self.setStatus("Error getting filename");
              });
            };
          }).catch(function (e) {
            console.log("4 " + e);;
            self.setStatus("Error getting attachments count");
          });

          details.getEventLogsCount().then(function (count1) {

            var html2 = "";
            if (count1 == null || count1.toNumber() <= 0) {
              html2 += '<li class="list-group-item">No events</li>';
              $$('#view-app-events').html(html2);
            } else {
              self.setStatus("Retrieving events for " + daid);
              for (var i = 0; i < count1.toNumber(); i++) {
                var index = i;
                details.getEventLogData.call(index).then(function (eventString) {
                  html2 += '<li class="list-group-item">' + eventString[0] + ': ' + eventString[1] + ': ' + eventString[2] + ' <span class="float-right"> ' + new Date(eventString[4] * 1000).toLocaleDateString() + ' ' + new Date(Number(eventString[4]) * 1000).toLocaleTimeString() + '</span></li>';
                  $$('#view-app-events').html(html2);
                }).catch(function (e) {
                  self.setStatus("Error getting event data");
                });
              }
            }
          }).catch(function (e) {
            self.setStatus("Error getting events count");
          });

          details.daid().then(function (daid) {
            document.getElementById("daid").value = daid;
          }).catch(function (e) {
            self.setStatus("Error getting daid");
          });
          details.dateLodged().then(function (dateLodged) {
            document.getElementById("dateLodged").value = new Date(dateLodged * 1000).toLocaleDateString();
          }).catch(function (e) {
            self.setStatus("Error getting dateLodged");
          });
          details.description().then(function (desc) {
            document.getElementById("description").value = desc;
          }).catch(function (e) {
            self.setStatus("Error getting description");
          });
          details.estimatedCost().then(function (ecost) {
            document.getElementById("ecost").value = ecost;
          }).catch(function (e) {
            self.setStatus("Error getting ecost");
          });

          details.lga().then(function (lga) {
            document.getElementById("lga").value = lga;
          }).catch(function (e) {
            self.setStatus("Error getting lga");
          });

          self.getCurrentState(details, self).then(function (state) {
            var currentState;
            document.getElementById("state").value = state[1];
            self.setStatus("Found " + daid);

          }).catch(function (e) {
            self.setStatus("Error getting state");
          });

        }).catch(function (e) {
          self.setStatus("Error getting address " + e);
        });
      }).catch(function (e) {
        self.setStatus("Error " + e);
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
      self.setStatus("Registered Development Application " + daid);
      return daRegister.getDADetailsAddress.call(daid, { from: account });
    }).then(function (result2) {

      if (result2.substring(0, 4) == '0x00') {
        self.setStatus("Register address not found for " + daid);
        return;
      }

      console.log("got address: " + result2);
      self.setStatus("retrieving Attachments");
      var address = result2.valueOf();
      return DaDetails.at(address).then(function (details) {
        console.log("got details: " + details);

        self.addAttachments(details, self).then(function () {
          self.setStatus("Development application successfully lodged.");
        });
        self.setStatus("Finished creating Development Application - Press Clear");
      });
    });
  },

  approveDA: function () {
    var self = this;
    var daid = document.getElementById("daid").value;
    var status = document.getElementById("states").value;
    var daRegister;

    DaRegister.deployed().then(function (instance) {
      daRegister = instance;
      console.log("Retrieving");
      self.setStatus("Searching register for " + daid);
      return daRegister.getDADetailsAddress.call(daid, { from: account });
    }).then(function (result) {

      if (result.substring(0, 4) == '0x00') {
        self.setStatus("Register address not found for " + daid);
        return;
      }

      console.log("Retrieved");
      self.setStatus("Retrieved Development Application");
      var address = result.valueOf();
      return DaDetails.at(address).then(function (details) {

        return self.getCurrentState(details, self).then(function (state) {
          var nextState = self.validNextState(state[0], self);
          var selectedNextState = self.findStateTupleByString(status)[0];

          if (nextState < 0) {
            self.setStatus("No further state changes available");
            return;
          }

          if (selectedNextState !== nextState) 
          {
            self.setStatus("Invalid option. Choose another approval or lodgement");
            return;
          }

          switch (status) {
            case "DA Approved":
              return self.daApprove(details, self);
              break;
            case "CC Lodged":
              return self.ccLodge(details, self);
              break;
            case "CC Approved":
              return self.ccApprove(details, self);
              break;
            case "SC Lodged":
              return self.scLodge(details, self);
              break;
            case "SC Approved":
              return self.scApprove(details, self);
              break;
            case "Plan Approve":
              return self.planApprove(details, self);
              break;
            case "Plan Registered":
              return self.planRegister(details, self);
              break;
            default:
              {
                console.log("Error status not implimented.");
                self.setStatus("Error status not implimented.");
              }
          }

        }).catch(function (e) {
          self.setStatus("Error getting state");
        });


        

        self.setStatus("Finished creating Development Application - Press Clear");

      });
    });
  },

  addEventLogDA: function () {
    var self = this;
    var daid = document.getElementById("daid").value;
    var daRegister;

    return localforage.getItem('myStorage').then(function (storage) {

      self.setStatus("Locating Development Application register");
      return DaRegister.deployed().then(function (instance) {
        daRegister = instance;
        console.log("Retrieving");
        self.setStatus("Searching register for " + daid);
        return daRegister.getDADetailsAddress.call(daid, { from: account });
      }).then(function (result) {

        if (result.substring(0, 4) == '0x00') {
          self.setStatus("Register address not found for " + daid);
          return;
        }

        console.log("Retrieved");
        self.setStatus("Retrieved Development Application");
        var address = result.valueOf();
        return DaDetails.at(address).then(function (details) {
          // First add the event
          self.setStatus("Adding an event for " + daid);
          self.daAddEventLog(details, "Manual Event", "", document.getElementById("description").value).then(function () {
            // And then if we need to, add the attachment
            if (storage) {
                return self.addAttachments(details, self, true).then(function () {
                self.setStatus("Finished Adding Event - Press Clear");
              }).catch(function (e) {
                console.log(e);
                self.setStatus("Error Adding Event/Attachment");
              });
            } else {
              self.setStatus("Finished Adding Event - Press Clear");
              return;
            }
          }).catch(function (e) {
            console.log(e);
            self.setStatus("Error Adding Event/Attachment");
          });
        });
      });
    });
  },

  daAddEventLog: function (details, title, subject, description) {
    return details.addEventLog(title, subject, description, account, Date.now() / 1000, { from: account }).then(function (added) {
      console.log("added log " + title);
    });
  },

  daApprove: function (details, self) {
    return details.daApprove(true, { from: account }).then(function () {
      console.log("DAApprove ");
      self.daAddEventLog(details, "DAApprove", "", "").then(function () {
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
      self.daAddEventLog(details, "CCLodge", "", "").then(function () {
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
      self.daAddEventLog(details, "CCApprove", "", "").then(function () {
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
      self.daAddEventLog(details, "SCLodge", "", "").then(function () {
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
      self.daAddEventLog(details, "SCApprove", "", "").then(function () {
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
      self.daAddEventLog(details, "PlanApprove", "", "").then(function () {
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
      self.daAddEventLog(details, "PlanRegister", "", "").then(function () {
        self.addAttachments(details, self).then(function () {
          self.setStatus("PlanRegister Transaction complete!");
        });
      }).catch(function (e) {
        console.log(e);
        self.setStatus("Error creating PlanRegister");
      });
    });
  },

  addAttachments: function (details, self, withDescription = false) {
    return localforage.getItem('myStorage').then(function (storage) {

      if (storage) {
        console.log("got storage: " + storage.length);
        storage.sort(function (x, y) {
          return y.timestamp - x.timestamp;
        });

        for (var i = 0; i < storage.length; i++) {
          var fileName = storage[i].fileName;
          var fileType = storage[i].fileType;
          var url = storage[i].url;

          console.log("Attaching the file: ", fileName, fileType, url)

          details.addAttachment(fileName, fileType, account, url, { from: account }).then(function (result5) {
            console.log("addAttachment working, result follows");
            console.log(result5)
            // if (withDescription) {
            //   self.daAddEventLog(details, "Artifact", fileName, document.getElementById("description").value).then(function (added) {
            //     console.log("added Artifact ");
            //   });
            // } else {
            //   self.daAddEventLog(details, "Artifact", fileName, "").then(function (added) {
            //     console.log("added Artifact ");
            //   });
            // }
          });
        }
        // Clear out the storage after uploading items
        localforage.clear()
      }
    });
  },

  setStatus: function (message) {
    document.getElementById("status").value = message;
  },

  getCurrentState: function (details, self) {

    return details.getCurrentState().then(function (state) {
      return self.findStateTupleByNumber(state.toNumber());
    }).catch(function (e) {
      self.setStatus("Error getting state");
    });

  },

  validNextState: function (state, self) {
    var nextStateTuple = self.findStateTupleByNumber(state);
    var nextIndex = nextStateTuple[0] + 1;

    if (nextIndex > 7) {
      return -1;
    } else {
      return nextIndex;
    }
  },

  findStateTupleByNumber: function (state) {

    switch (state) {
      case 0:
        return [state, 'DA Lodged'];
        break;
      case 1:
        return [state, 'DA Approved'];
        break;
      case 2:
        return [state, 'CC Lodged'];
        break;
      case 3:
        return [state, 'CC Approved'];
        break;
      case 4:
        return [state, 'SC Lodged'];
        break;
      case 5:
        return [state, 'SC Approved'];
        break;
      case 6:
        return [state, 'Plan Approved'];
        break;
      case 7:
        return [state, 'Plan Registered'];
        break;
      default:
        return [state, 'Unknown'];
    }
  },

  findStateTupleByString: function (state) {

    switch (state) {
      case 'DA Lodged':
        return [0, 'DA Lodged'];
        break;
      case 'DA Approved':
        return [1, 'DA Approved'];
        break;
      case 'CC Lodged':
        return [2, 'CC Lodged'];
        break;
      case 'CC Approved':
        return [3, 'CC Approved'];
        break;
      case 'SC Lodged':
        return [4, 'SC Lodged'];
        break;
      case 'SC Approved':
        return [5, 'SC Approved'];
        break;
      case 'Plan Approved':
        return [6, 'Plan Approved'];
        break;
      case 'Plan Registered':
        return [7, 'Plan Registered'];
        break;
      default:
        return [8, 'Unknown'];
    }
  },

  hideDiv: function () {
    document.getElementById('daid').readOnly = true;
    document.getElementById('description').readOnly = true;
    document.getElementById('dateLodged').readOnly = true;
    document.getElementById('dateApproved').readOnly = true;
  },

  showDiv: function (elem) {
    var self = this;
    switch (elem.value) {
      case "DA Lodged":
        document.getElementById('daid').readOnly = false;
        document.getElementById('description').readOnly = false;
        document.getElementById('dateLodged').readOnly = false;
        document.getElementById('dateApproved').readOnly = false;
        break;
      case "CC Lodged":
        App.hideDiv();
        document.getElementById('daid').readOnly = false;
        document.getElementById('description').readOnly = false;
        document.getElementById('dateLodged').readOnly = false;
        document.getElementById('dateApproved').readOnly = false;
        break;
      case "SC Lodged":
        App.hideDiv();
        document.getElementById('daid').readOnly = false;
        document.getElementById('description').readOnly = false;
        document.getElementById('dateLodged').readOnly = false;
        document.getElementById('dateApproved').readOnly = false;
        break;
      case "Plan Approve":
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
