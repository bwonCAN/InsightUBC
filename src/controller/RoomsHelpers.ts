import { InsightError } from "./IInsightFacade";
import JSZip from "jszip";
const parse5 = require("parse5");
import { Building, createBuildingObject, getGeoLocation, isValidBuilding } from "./Building";
import { createRoomObject, Room } from "./Room";

interface GeoResponse {
	lat?: number;
	lon?: number;
	error?: string;
}

interface Node {
	nodeName: string;
	tagName: string;
	attrs?: any[];
	namespaceURI?: string;
	childNodes?: Node[];
	parentNode?: Node;
}

export async function processRooms(zip: JSZip): Promise<Room[]> {
	let validRooms: Room[] = [];
	const indexFile = zip.file("index.htm");
	if (!indexFile) {
		return Promise.reject(new InsightError("No index file"));
	}
	const indexContent = await indexFile.async("string");
	const indexFileContent = parse5.parse(indexContent);

	const buildingNodes: Node[] = findTables(indexFileContent);
	if (buildingNodes.length !== 1) {
		return Promise.reject(new InsightError("Error! There should be exactly 1 valid building table"));
	}

	const buildingData = await findBuildingData(buildingNodes[0]);
	const roomPromises: Promise<Room[]>[] = [];

	for (const building of buildingData) {
		const fileName = building.href.replace("./", "");
		const buildingFile = zip.file(fileName);
		if (!buildingFile) {
			continue;
		}
		const roomPromise = buildingFile.async("string").then(async (roomContent) => {
			const roomFileContent = parse5.parse(roomContent);
			const roomNodes: Node[] = findTables(roomFileContent);
			const roomDataPromises = roomNodes.map(async (room) => findRoomData(room, building));

			return Promise.all(roomDataPromises).then((roomDataArray) => {
				return roomDataArray.flat();
			});
		});
		roomPromises.push(roomPromise);
	}

	const resolvedRooms = await Promise.all(roomPromises);
	validRooms = resolvedRooms.flat();
	// console.log(validRooms.length);
	// console.log(validRooms);

	return validRooms;
}

export async function findRoomData(roomNodes: any, building: Building): Promise<Room[]> {
	const validRooms: Room[] = [];

	for (const row of roomNodes.childNodes) {
		if (row.nodeName === "tbody" && row.childNodes) {
			for (const body of row.childNodes) {
				if (body.nodeName === "tr" && body.childNodes) {
					const roomDetails = extractRoomDetails(body);
					if (isValidRoom(roomDetails)) {
						validRooms.push(createRoomObject(roomDetails, building));
					}
				}
			}
		}
	}

	return validRooms;
}

export function extractRoomDetails(body: any): {
	number: string | null;
	seats: number | null;
	type: string | null;
	furniture: string | null;
	href: string | null;
} {
	const number = extractRoomNumber(body);
	const href = extractRoomHref(body);
	const seats = extractRoomSeats(body);
	const type = extractRoomType(body);
	const furniture = extractRoomFurniture(body);

	if (number !== null && seats !== null && type !== null && furniture !== null && href !== null) {
		return { number, seats, type, furniture, href };
	}

	throw new InsightError("Error while extracting room details");
}

function extractRoomNumber(body: any): string | null {
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

function extractRoomHref(body: any): string | null {
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

function extractRoomSeats(body: any): number | null {
	for (const cell of body.childNodes) {
		if (cell.nodeName === "td" && hasClass(cell, "views-field-field-room-capacity")) {
			return getRoomSeats(cell);
		}
	}
	return null;
}

function extractRoomType(body: any): string | null {
	for (const cell of body.childNodes) {
		if (cell.nodeName === "td" && hasClass(cell, "views-field-field-room-type")) {
			return getRoomType(cell);
		}
	}
	return null;
}

function extractRoomFurniture(body: any): string | null {
	for (const cell of body.childNodes) {
		if (cell.nodeName === "td" && hasClass(cell, "views-field-field-room-furniture")) {
			return getRoomFurniture(cell);
		}
	}
	return null;
}

export function findAnchorTag(cell: any): any {
	return cell.childNodes.find((n: { nodeName: string }) => n.nodeName === "a");
}

export function getRoomNumber(anchorTag: any): string {
	return anchorTag.childNodes[0].value;
}

export function getRoomHref(anchorTag: any): string {
	return anchorTag.attrs.find((attr: { name: string }) => attr.name === "href")?.value;
}

export function getRoomSeats(cell: any): number {
	return Number(cell.childNodes[0].value.trim());
}

export function getRoomType(cell: any): string {
	return cell.childNodes[0].value.trim();
}

export function getRoomFurniture(cell: any): string {
	return cell.childNodes[0].value.trim();
}

export function isValidRoom(roomDetails: {
	number: string | null;
	seats: number | null;
	type: string | null;
	furniture: string | null;
	href: string | null;
}): boolean {
	return (
		roomDetails.number !== null &&
		roomDetails.seats !== null &&
		roomDetails.type !== null &&
		roomDetails.furniture !== null &&
		roomDetails.href !== null
	);
}

export async function findBuildingData(buildingNodes: any): Promise<Building[]> {
	const validBuildings: Building[] = [];
	const buildingDetailPromises: Promise<any>[] = [];
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
		if (isValidBuilding(buildingDetails)) {
			validBuildings.push(createBuildingObject(buildingDetails));
		}
	}
	if (validBuildings.length <= 0) {
		return Promise.reject(new InsightError("No valid buildings found"));
	}
	return validBuildings;
}

export async function extractBuildingDetails(body: any): Promise<{
	fullName: string | null;
	shortName: string | null;
	address: string | null;
	geoLocation: GeoResponse | null;
	buildingLink: string | null;
}> {
	const fullName = extractFullName(body);
	const buildingLink = extractBuildingLink(body);
	const buildingAddress = extractBuildingAddress(body);
	const shortName = extractShortName(body);
	const geoLocation = await extractGeoLocation(buildingAddress);

	if (
		fullName !== null &&
		shortName !== null &&
		buildingAddress !== null &&
		geoLocation !== null &&
		buildingLink !== null
	) {
		return { fullName, shortName, address: buildingAddress, geoLocation, buildingLink };
	}

	return Promise.reject(new InsightError("Error while extracting building details"));
}

function extractFullName(body: any): string | null {
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

function extractBuildingLink(body: any): string | null {
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

function extractBuildingAddress(body: any): string | null {
	for (const cell of body.childNodes) {
		if (cell.nodeName === "td" && hasClass(cell, "views-field-field-building-address")) {
			const address = getBuildingAddress(cell);
			if (address) {
				return address;
			}
			throw new InsightError("Building address not found");
		}
	}
	return null;
}

function extractShortName(body: any): string | null {
	for (const cell of body.childNodes) {
		if (cell.nodeName === "td" && hasClass(cell, "views-field-field-building-code")) {
			return getBuildingShortName(cell);
		}
	}
	return null;
}

async function extractGeoLocation(buildingAddress: string | null): Promise<GeoResponse | null> {
	if (buildingAddress) {
		const geoLocationPromises: Promise<GeoResponse | null>[] = [];
		geoLocationPromises.push(getGeoLocation(buildingAddress));
		const geoLocations = await Promise.all(geoLocationPromises);
		return geoLocations.length > 0 ? geoLocations[0] : null;
	}
	return null;
}

export function getBuildingFullName(anchorTag: any): string {
	return anchorTag.childNodes[0].value;
}

export function getBuildingLink(anchorTag: any): string {
	return anchorTag.attrs.find((attr: { name: string }) => attr.name === "href").value;
}

export function getBuildingAddress(cell: any): string {
	return cell.childNodes[0].value.trim();
}

export function getBuildingShortName(cell: any): string {
	return cell.childNodes[0].value.trim();
}

export function hasClass(node: any, className: string): boolean {
	return (
		node?.attrs?.some(
			(attr: { name: string; value: string | string[] }) => attr.name === "class" && attr.value.includes(className)
		) ?? false
	);
}

export function findTables(documentNode: Node, tables: Node[] = []): Node[] {
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
