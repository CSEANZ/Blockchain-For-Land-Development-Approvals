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

var daid = '123';
var daRegister;
var proposedLotGeojson;
var oldLotGeojson;

DaRegister.deployed().then(function (instance) {
    daRegister = instance;
    console.log("daRegister: " + daRegister);
    return daRegister.getDARegisterAddress.call(daid, { from: account });
}).then(function (value) {
    var address = value.valueOf();
    console.log("daDetails address: " + address);
    return DaDetails.at(address).then(function (details) {
        //var description = document.getElementById("description");
        return details.description().then(function (desc) {
            proposedLotGeojson = 'https://ipfs.io/ipfs/' + details.getLatestIpfsHash('proposed_lot');
            oldLotGeojson = 'https://ipfs.io/ipfs/' + details.getLatestIpfsHash('old_lot')
            //description.innerHTML = desc;
        });
    });
}).catch(function (e) {
    console.log(e);
    //self.setStatus("Error getting da; see log.");
});

/*After merge*/
var parcelString = '';
/*
for (var i = 0; i < daDetails.parcels.length; i++) {
    parcelString += parcelString + ',' + daDetails.parcels[i];
}
*/

//var proposedLotGeojson = 'https://ipfs.io/ipfs/' + daDetails.getLatestIpfsHash('proposed_lot');
//var oldLotGeojson = 'https://ipfs.io/ipfs/' + daDetails.getLatestIpfsHash('old_lot');

var lotIdString = (parcelString == '' ? '1104//DP1191303,1393//DP1205498' : parcelString);
var proposedLotGLink = (proposedLotGeojson == '' ? 'https://ipfs.io/ipfs/QmduWgc8GusY8XRtfVPs6APoQcdRhKwneM3pQxNzFdUHNk' : proposedLotGeojson);
var oldLotGLink = (oldLotGeojson == '' ? 'https://ipfs.io/ipfs/QmTfYnrtQqJcEu9fPxGnj94TLDq16yPBuUuSvhBzzJvJFi' : oldLotGeojson);

/**/

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
    opacity: 0.7,
    color: 'beige'
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
