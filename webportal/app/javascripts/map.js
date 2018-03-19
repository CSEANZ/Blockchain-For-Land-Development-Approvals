// Import libraries we need.

import { default as Web3 } from 'web3';
import { default as contract } from 'truffle-contract'
import { default as xml2json } from 'land-xml-to-geojson'
import { default as xml2js } from 'xml2js'

// Import our contract artifacts and turn them into usable abstractions.
import daRegister_artifacts from '../../../truffle/build/contracts/DARegister.json'
import daDetails_artifacts from '../../../truffle/build/contracts/DADetails.json'

// High level functions.
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

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
var daid = getParameterByName('daid')
var ipfs = getParameterByName('ipfs')

DaRegister.deployed().then(function (instance) {
    daRegister = instance;
    console.log("daRegister.address: " + daRegister.address);
    console.log("daid: " + daid)
    if (daid !== null) {
        return daRegister.getDADetailsAddress.call(daid, { from: account });
    } else {
        return null
    }
}).then(function (value) {
    if (value !== null) { 
        console.log("Fetching current lots not yet implemented.")
        var affectedLots = ''  // This should be dynamic, based on what's passed in from the DAID.
        console.log(ipfs)
        refreshMap(ipfs, affectedLots)

        // var address = value.valueOf();
        // var proposedHash = '';
        // var oldHash = '';
        // var parcelIds;
        // console.log("daDetails address: " + address);
        // return DaDetails.at(address).then(function (details) {
        //     //var description = document.getElementById("description");
        //     //return details.description().then(function (desc) {
        //     return details.getLatestIpfsHash('proposed_lot').then(function (hash) {
        //         console.log("value proposed hash is: " + hash);
        //         proposedHash = hash;
        //         //refreshMap(hash,'','');
        //         //oldLotGeojson = 'https://ipfs.io/ipfs/' + details.getLatestIpfsHash('old_lot')
        //         //description.innerHTML = desc;
        //         return details.getLatestIpfsHash('old_lot').then(function (hash) {
        //             console.log("value of old hash is: " + hash);
        //             oldHash = hash;
        //             //refreshMap(proposedHash,oldHash,'');
        //             return details.getFileNamesCount().then(function (fileCount) {
        //                 console.log("value of file count is: " + fileCount);
        //             });
        //         });

        //     });
        // });
    } else {
        console.log("No DAID passed in...")
        refreshMap('', '')
    }
}).catch(function (e) {
    console.error(e);
});

function refreshMap(proposedHash, affectedLots) {
    /*
    for (var i = 0; i < daDetails.parcels.length; i++) {
        parcelString += parcelString + ',' + daDetails.parcels[i];
    }
    */

    var lotIdString = (affectedLots === '' ? '1104//DP1191303,1393//DP1205498' : affectedLots);
    var resolvedlotIdString = lotIdString.replace(",", "','");

    // proposedLotGLink = (proposedHash === '' ? 'https://ipfs.io/ipfs/QmduWgc8GusY8XRtfVPs6APoQcdRhKwneM3pQxNzFdUHNk' : 'https://ipfs.io/ipfs/' + proposedHash);
    // oldLotGLink = (oldHash === '' ? 'https://ipfs.io/ipfs/QmTfYnrtQqJcEu9fPxGnj94TLDq16yPBuUuSvhBzzJvJFi' : 'https://ipfs.io/ipfs/' + oldHash);

    /*Before merge
    var lotIdString= '1104//DP1191303,1393//DP1205498';
    var proposedLotGLink= 'https://ipfs.io/ipfs/QmduWgc8GusY8XRtfVPs6APoQcdRhKwneM3pQxNzFdUHNk';
    var oldLotGLink= 'https://ipfs.io/ipfs/QmTfYnrtQqJcEu9fPxGnj94TLDq16yPBuUuSvhBzzJvJFi';
    */


    // Base layers
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

    // Lots covered by the DA
    var selectedLot = L.esri.featureLayer({
        url: 'http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer/9',
        where: "lotIdString in ('" + resolvedlotIdString + "')",
        opacity: 0.7,
        color: 'red'
    });

    var proposedLot = L.geoJSON()

    // var oldLot = new L.GeoJSON.AJAX([oldLotGLink], { style: styleFunctionOld });

    var cadastre = L.esri.featureLayer({
        url: 'http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer/9',
        opacity: 0.3,
        color: 'black',
        minZoom: 15
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
        "Existing Lots": selectedLot,
        "Proposed Lot": proposedLot,
        "Current Cadastre": cadastre
    };

    function styleFunctionNew() {
        return { color: "orange" };
    }

    function styleFunctionOld() {
        return { color: "cyan" };
    }

    var layerControl = L.control.layers(baseLayers, overlays).addTo(map);

    $$.get({
        url: "https://ipfs.io/ipfs/" + proposedHash,
        dataType: 'text',
        success: function (data) {
            // console.log("XML is: ", data)
            var p = new xml2js.Parser()
            p.parseString( data, ( err, result ) => {
                if (err) {
                    console.error(err)
                } else {
                    var converted = xml2json.convert(result)
                    layerControl.removeLayer(proposedLot)
                    proposedLot = L.geoJSON(converted, {
                        filter: function(feature, layer) {
                            return feature.properties.state === 'proposed';
                        }
                    }).addTo(map)
                    map.fitBounds(proposedLot.getBounds());
                    layerControl.addOverlay(proposedLot, 'Proposed Lots')
                }
            })
        }
    });
};
