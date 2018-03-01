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

DaRegister.setProvider(web3.currentProvider);
DaDetails.setProvider(web3.currentProvider);

//var daid = '123';
var daRegister;
var proposedLotGLink='';
var oldLotGLink='';
var query = window.location.search.substring(1);
var vars = query.split("&");
var pair = vars[0].split("=");
var daid=pair[1];

DaRegister.deployed().then(function (instance) {
    daRegister = instance;
    console.log("daRegister.address: " + daRegister.address);
    console.log("daid: " + daid)
    return daRegister.getDADetailsAddress.call(daid, { from: account });
}).then(function (value) {
    var address = value.valueOf();
    var proposedHash = '';
    var oldHash = '';
    var parcelIds;
    console.log("daDetails address: " + address);
    return DaDetails.at(address).then(function (details) {
        //var description = document.getElementById("description");
        //return details.description().then(function (desc) {
        return details.getLatestIpfsHash('proposed_lot').then(function (hash) {
            console.log("value proposed hash is: " + hash);
            proposedHash = hash;
            //refresMap(hash,'','');
            //oldLotGeojson = 'https://ipfs.io/ipfs/' + details.getLatestIpfsHash('old_lot')
            //description.innerHTML = desc;
            return details.getLatestIpfsHash('old_lot').then(function (hash) {
                console.log("value of old hash is: " + hash);
                oldHash = hash;
                //refresMap(proposedHash,oldHash,'');
                return details.getFileNamesCount().then(function (fileCount) {
                    console.log("value of file count is: " + fileCount);
                    refresMap(proposedHash, oldHash, '');
                });
            });

        });
    });
}).catch(function (e) {
    console.log(e);
});

function refresMap(proposedHash, oldHash, parcelIds) {
    /*
    for (var i = 0; i < daDetails.parcels.length; i++) {
        parcelString += parcelString + ',' + daDetails.parcels[i];
    }
    */

    var lotIdString = (parcelIds == '' ? '1104//DP1191303,1393//DP1205498' : parcelIds);
    proposedLotGLink = (proposedHash == '' ? 'https://ipfs.io/ipfs/QmduWgc8GusY8XRtfVPs6APoQcdRhKwneM3pQxNzFdUHNk' : 'https://ipfs.io/ipfs/' + proposedHash);
    oldLotGLink = (oldHash == '' ? 'https://ipfs.io/ipfs/QmTfYnrtQqJcEu9fPxGnj94TLDq16yPBuUuSvhBzzJvJFi' : 'https://ipfs.io/ipfs/' + oldHash);

    /*Before merge
    var lotIdString= '1104//DP1191303,1393//DP1205498';
    var proposedLotGLink= 'https://ipfs.io/ipfs/QmduWgc8GusY8XRtfVPs6APoQcdRhKwneM3pQxNzFdUHNk';
    var oldLotGLink= 'https://ipfs.io/ipfs/QmTfYnrtQqJcEu9fPxGnj94TLDq16yPBuUuSvhBzzJvJFi';
    */

    var resolvedlotIdString = lotIdString.replace(",", "','");

    var nswImagery = L.esri.tiledMapLayer({
        url: 'http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Imagery/MapServer',
        minZoom: 1,
        maxZoom: 20
    });

    var nswBasemap = L.esri.tiledMapLayer({
        url: 'http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Base_Map/MapServer',
        minZoom: 1,
        maxZoom: 20
    });

    var selectedLot = L.esri.featureLayer({
        url: 'http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer/9',
        where: "lotIdString in ('" + resolvedlotIdString + "')",
        opacity: 0.7,
        color: 'red'
    });

    var proposedLot = new L.GeoJSON.AJAX([proposedLotGLink], { style: styleFunctionNew });

    var oldLot = new L.GeoJSON.AJAX([oldLotGLink], { style: styleFunctionOld });

    var cadastre = L.esri.featureLayer({
        url: 'http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer/9',
        opacity: 0.3,
        color: 'black'
    });

    var oldCadastre = L.esri.dynamicMapLayer({
        url: 'http://mapsq.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer',
        opacity: 0.7
    });

    var map = L.map('map', {
        center: [-33.698, 150.817],
        zoom: 15,
        layers: [nswImagery, proposedLot]
    });

    var baseLayers = {
        "NSW Imagery": nswImagery,
        "NSW Basemap": nswBasemap
    };

    var overlays = {
        "Selected Lot": selectedLot,
        "Former Lot": oldLot,
        "Proposed Lot": proposedLot,
        "Final Cadastre": cadastre
    };

    function styleFunctionNew() {
        return { color: "orange" };
    }

    function styleFunctionOld() {
        return { color: "cyan" };
    }

    L.control.layers(baseLayers, overlays).addTo(map);

};
