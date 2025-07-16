"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeoLocation = exports.isValidBuilding = exports.createBuildingObject = exports.Building = void 0;
const http = __importStar(require("http"));
class Building {
    fullName;
    shortName;
    address;
    lat;
    lon;
    href;
    constructor(fullName, shortName, address, lat, lon, href) {
        this.fullName = fullName;
        this.shortName = shortName;
        this.address = address;
        this.lat = lat;
        this.lon = lon;
        this.href = href;
    }
}
exports.Building = Building;
function createBuildingObject(buildingDetails) {
    return {
        fullName: buildingDetails.fullName,
        shortName: buildingDetails.shortName,
        address: buildingDetails.address,
        lat: buildingDetails.geoLocation.lat,
        lon: buildingDetails.geoLocation.lon,
        href: buildingDetails.buildingLink,
    };
}
exports.createBuildingObject = createBuildingObject;
function isValidBuilding(buildingDetails) {
    return (buildingDetails.fullName !== null &&
        buildingDetails.shortName !== null &&
        buildingDetails.address !== null &&
        buildingDetails.geoLocation !== null &&
        buildingDetails.buildingLink !== null);
}
exports.isValidBuilding = isValidBuilding;
async function getGeoLocation(address) {
    const encodedAddress = encodeURIComponent(address);
    const url = `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team223/${encodedAddress}`;
    return new Promise((resolve, reject) => {
        http
            .get(url, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                try {
                    const geoResponse = JSON.parse(data);
                    resolve(geoResponse);
                }
                catch (_error) {
                    reject({ error: "Error parsing JSON response." });
                }
            });
        })
            .on("error", (err) => {
            reject({ error: err.message });
        });
    });
}
exports.getGeoLocation = getGeoLocation;
//# sourceMappingURL=Building.js.map