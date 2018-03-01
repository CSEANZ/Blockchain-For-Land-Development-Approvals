# Blockchain for Land Development

Artefacts from a hack done with the NSW DFSI Spatial Services, the CRC for Spatial Information and Microsoft Commercial Software Engineering (ANZ). 

## Overview/Problem Statement

The process for lodging a (property) development application in NSW varies from Local Government Area to Local Goverment Area, but there are some common features and problems.

1. The property developer lodges a Development Application (DA) with the appropriate Local Goverment Authority (LGA). A (varying) number of documents are attached in support of the application including:
    1. Geographic details
    1. Non-geographic details
1. The LGA approves the application with a number of conditions including:
    1. Approval from utilities
    1. provision of environmental assesments



[workflowdiagram]: ./images/NSW-DFSI-proposed-workflow.png "Proposed Workflow"

![Proposed Workflow][workflowdiagram]

## Proposed property DA approval process on Blockchain
### Plan phase  
1. Property Developer submits DA in submission web portal 
1. Smart contract deployed to Azure Ethereum Network that represents the specific DA and forms/other relevant documents uploaded to IPFS
    * **Proposed layer updated**
1. LGA notified of new DA submission. LGA then notifies relevant utilities and authorities (e.g. fire service)
1. Utilities and authorities can view DA, approve plans, make comments (requirements), attach documents and approve - all new transactions on the blockchain submitted from web portal 

### Design phase 
1. Property Developer notified of state changes, comments and new attachments (notice of requirements) to view for that DA
(possible back and forth here between property developer and ulilties/authorities to gain approvals)
    * **Proposed layer updated**  
1. Utilities and LGA can view DA in web portal and attach **Approval to Proceed** and **Construction Certificate** (respectively) - documents uploaded to IFPS and new transactions submitted on the blockchain 
1. Developer notified of state change and can start construction 

### Deliver phase
1. Property Developer submits new transaction to the blockchain through web portal for utility inspections 
1. Utilities/authorities are notified of state change and start off-chain process to inspect and then connect infrastructure
1. Developer submits final plan to Land Registry Services through web portal for Plan Registration 
    * **Proposed layer updated** 

(this is simplified down to the core steps in the process)
 

## Relevant templates and resources 

* [Ethereum Azure Resource Manager template](https://github.com/EthereumEx/ethereum-arm-templates/tree/master/ethereum-consortium) to make it easy to spin up a Blockchain network will work on it's own or that could easily be connected to an existing network.
* A how-to guide on setting up your [Windows 10 PC for Ethereum development](https://davidburela.wordpress.com/2017/05/12/how-to-install-truffle-testrpc-on-ubuntu-or-windows-10-with-windows-subsystem-for-linux/)
* [Short guide](https://github.com/tikyau/IPFS-On-Azure) to setup Docker environment for IPFS on Azure  
* [Docker image](https://hub.docker.com/r/delon1192/ipfs-upload-media/) for IPFS image/media upload  
* [IPFS](https://ipfs.io/#how), a peer-to-peer hypermedia protocol
to make the web faster, safer, and more open

