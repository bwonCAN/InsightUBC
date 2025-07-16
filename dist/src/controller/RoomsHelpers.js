"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findTables = exports.hasClass = exports.getBuildingShortName = exports.getBuildingAddress = exports.getBuildingLink = exports.getBuildingFullName = exports.extractBuildingDetails = exports.findBuildingData = exports.isValidRoom = exports.getRoomFurniture = exports.getRoomType = exports.getRoomSeats = exports.getRoomHref = exports.getRoomNumber = exports.findAnchorTag = exports.extractRoomDetails = exports.findRoomData = exports.processRooms = void 0;
const IInsightFacade_1 = require("./IInsightFacade");
const parse5 = require("parse5");
const Building_1 = require("./Building");
const Room_1 = require("./Room");
async function processRooms(zip) {
    let validRooms = [];
    const indexFile = zip.file("index.htm");
    if (!indexFile) {
        return Promise.reject(new IInsightFacade_1.InsightError("No index file"));
    }
    const indexContent = await indexFile.async("string");
    const indexFileContent = parse5.parse(indexContent);
    const buildingNodes = findTables(indexFileContent);
    if (buildingNodes.length !== 1) {
        return Promise.reject(new IInsightFacade_1.InsightError("Error! There should be exactly 1 valid building table"));
    }
    const buildingData = await findBuildingData(buildingNodes[0]);
    const roomPromises = [];
    for (const building of buildingData) {
        const fileName = building.href.replace("./", "");
        const buildingFile = zip.file(fileName);
        if (!buildingFile) {
            continue;
        }
        const roomPromise = buildingFile.async("string").then(async (roomContent) => {
            const roomFileContent = parse5.parse(roomContent);
            const roomNodes = findTables(roomFileContent);
            const roomDataPromises = roomNodes.map(async (room) => findRoomData(room, building));
            return Promise.all(roomDataPromises).then((roomDataArray) => {
                return roomDataArray.flat();
            });
        });
        roomPromises.push(roomPromise);
    }
    const resolvedRooms = await Promise.all(roomPromises);
    validRooms = resolvedRooms.flat();
    return validRooms;
}
exports.processRooms = processRooms;
async function findRoomData(roomNodes, building) {
    const validRooms = [];
    for (const row of roomNodes.childNodes) {
        if (row.nodeName === "tbody" && row.childNodes) {
            for (const body of row.childNodes) {
                if (body.nodeName === "tr" && body.childNodes) {
                    const roomDetails = extractRoomDetails(body);
                    if (isValidRoom(roomDetails)) {
                        validRooms.push((0, Room_1.createRoomObject)(roomDetails, building));
                    }
                }
            }
        }
    }
    return validRooms;
}
exports.findRoomData = findRoomData;
function extractRoomDetails(body) {
    const number = extractRoomNumber(body);
    const href = extractRoomHref(body);
    const seats = extractRoomSeats(body);
    const type = extractRoomType(body);
    const furniture = extractRoomFurniture(body);
    if (number !== null && seats !== null && type !== null && furniture !== null && href !== null) {
        return { number, seats, type, furniture, href };
    }
    throw new IInsightFacade_1.InsightError("Error while extracting room details");
}
exports.extractRoomDetails = extractRoomDetails;
function extractRoomNumber(body) {
    for (const cell of body.childNodes) {
        if (cell.nodeName === "td" && hasClass(cell, "views-field-field-room-number")) {
            const anchorTag = findAnchorTag(cell);
            if (anchorTag) {
                return getRoomNumber(anchorTag);
            }
        }
    }
    return null;
}
function extractRoomHref(body) {
    for (const cell of body.childNodes) {
        if (cell.nodeName === "td" && hasClass(cell, "views-field-field-room-number")) {
            const anchorTag = findAnchorTag(cell);
            if (anchorTag) {
                return getRoomHref(anchorTag);
            }
        }
    }
    return null;
}
function extractRoomSeats(body) {
    for (const cell of body.childNodes) {
        if (cell.nodeName === "td" && hasClass(cell, "views-field-field-room-capacity")) {
            return getRoomSeats(cell);
        }
    }
    return null;
}
function extractRoomType(body) {
    for (const cell of body.childNodes) {
        if (cell.nodeName === "td" && hasClass(cell, "views-field-field-room-type")) {
            return getRoomType(cell);
        }
    }
    return null;
}
function extractRoomFurniture(body) {
    for (const cell of body.childNodes) {
        if (cell.nodeName === "td" && hasClass(cell, "views-field-field-room-furniture")) {
            return getRoomFurniture(cell);
        }
    }
    return null;
}
function findAnchorTag(cell) {
    return cell.childNodes.find((n) => n.nodeName === "a");
}
exports.findAnchorTag = findAnchorTag;
function getRoomNumber(anchorTag) {
    return anchorTag.childNodes[0].value;
}
exports.getRoomNumber = getRoomNumber;
function getRoomHref(anchorTag) {
    return anchorTag.attrs.find((attr) => attr.name === "href")?.value;
}
exports.getRoomHref = getRoomHref;
function getRoomSeats(cell) {
    return Number(cell.childNodes[0].value.trim());
}
exports.getRoomSeats = getRoomSeats;
function getRoomType(cell) {
    return cell.childNodes[0].value.trim();
}
exports.getRoomType = getRoomType;
function getRoomFurniture(cell) {
    return cell.childNodes[0].value.trim();
}
exports.getRoomFurniture = getRoomFurniture;
function isValidRoom(roomDetails) {
    return (roomDetails.number !== null &&
        roomDetails.seats !== null &&
        roomDetails.type !== null &&
        roomDetails.furniture !== null &&
        roomDetails.href !== null);
}
exports.isValidRoom = isValidRoom;
async function findBuildingData(buildingNodes) {
    const validBuildings = [];
    const buildingDetailPromises = [];
    for (const row of buildingNodes.childNodes) {
        if (row.nodeName === "tbody" && row.childNodes) {
            for (const body of row.childNodes) {
                if (body.nodeName === "tr" && body.childNodes) {
                    buildingDetailPromises.push(extractBuildingDetails(body));
                }
            }
        }
    }
    const buildingDetailsArray = await Promise.all(buildingDetailPromises);
    for (const buildingDetails of buildingDetailsArray) {
        if ((0, Building_1.isValidBuilding)(buildingDetails)) {
            validBuildings.push((0, Building_1.createBuildingObject)(buildingDetails));
        }
    }
    if (validBuildings.length <= 0) {
        return Promise.reject(new IInsightFacade_1.InsightError("No valid buildings found"));
    }
    return validBuildings;
}
exports.findBuildingData = findBuildingData;
async function extractBuildingDetails(body) {
    const fullName = extractFullName(body);
    const buildingLink = extractBuildingLink(body);
    const buildingAddress = extractBuildingAddress(body);
    const shortName = extractShortName(body);
    const geoLocation = await extractGeoLocation(buildingAddress);
    if (fullName !== null &&
        shortName !== null &&
        buildingAddress !== null &&
        geoLocation !== null &&
        buildingLink !== null) {
        return { fullName, shortName, address: buildingAddress, geoLocation, buildingLink };
    }
    return Promise.reject(new IInsightFacade_1.InsightError("Error while extracting building details"));
}
exports.extractBuildingDetails = extractBuildingDetails;
function extractFullName(body) {
    for (const cell of body.childNodes) {
        if (cell.nodeName === "td" && hasClass(cell, "views-field-title")) {
            const anchorTag = findAnchorTag(cell);
            if (anchorTag) {
                return getBuildingFullName(anchorTag);
            }
        }
    }
    return null;
}
function extractBuildingLink(body) {
    for (const cell of body.childNodes) {
        if (cell.nodeName === "td" && hasClass(cell, "views-field-title")) {
            const anchorTag = findAnchorTag(cell);
            if (anchorTag) {
                return getBuildingLink(anchorTag);
            }
        }
    }
    return null;
}
function extractBuildingAddress(body) {
    for (const cell of body.childNodes) {
        if (cell.nodeName === "td" && hasClass(cell, "views-field-field-building-address")) {
            const address = getBuildingAddress(cell);
            if (address) {
                return address;
            }
            throw new IInsightFacade_1.InsightError("Building address not found");
        }
    }
    return null;
}
function extractShortName(body) {
    for (const cell of body.childNodes) {
        if (cell.nodeName === "td" && hasClass(cell, "views-field-field-building-code")) {
            return getBuildingShortName(cell);
        }
    }
    return null;
}
async function extractGeoLocation(buildingAddress) {
    if (buildingAddress) {
        const geoLocationPromises = [];
        geoLocationPromises.push((0, Building_1.getGeoLocation)(buildingAddress));
        const geoLocations = await Promise.all(geoLocationPromises);
        return geoLocations.length > 0 ? geoLocations[0] : null;
    }
    return null;
}
function getBuildingFullName(anchorTag) {
    return anchorTag.childNodes[0].value;
}
exports.getBuildingFullName = getBuildingFullName;
function getBuildingLink(anchorTag) {
    return anchorTag.attrs.find((attr) => attr.name === "href").value;
}
exports.getBuildingLink = getBuildingLink;
function getBuildingAddress(cell) {
    return cell.childNodes[0].value.trim();
}
exports.getBuildingAddress = getBuildingAddress;
function getBuildingShortName(cell) {
    return cell.childNodes[0].value.trim();
}
exports.getBuildingShortName = getBuildingShortName;
function hasClass(node, className) {
    return (node?.attrs?.some((attr) => attr.name === "class" && attr.value.includes(className)) ?? false);
}
exports.hasClass = hasClass;
function findTables(documentNode, tables = []) {
    if (documentNode.nodeName === "table") {
        tables.push(documentNode);
    }
    if (documentNode.childNodes && Array.isArray(documentNode.childNodes)) {
        for (const child of documentNode.childNodes) {
            findTables(child, tables);
        }
    }
    return tables;
}
exports.findTables = findTables;
//# sourceMappingURL=RoomsHelpers.js.map