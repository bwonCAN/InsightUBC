import * as http from "http";

export class Building {
	public fullName: string;
	public shortName: string;
	public address: string;
	public lat: number | undefined;
	public lon: number | undefined;
	public href: string;

	constructor(fullName: string, shortName: string, address: string, lat: number, lon: number, href: string) {
		this.fullName = fullName;
		this.shortName = shortName;
		this.address = address;
		this.lat = lat;
		this.lon = lon;
		this.href = href;
	}
}

interface GeoResponse {
	lat?: number;
	lon?: number;
	error?: string;
}

export function createBuildingObject(buildingDetails: {
	fullName: string | null;
	shortName: string | null;
	address: string | null;
	geoLocation: GeoResponse | null;
	buildingLink: string | null;
}): Building {
	return {
		fullName: buildingDetails.fullName!,
		shortName: buildingDetails.shortName!,
		address: buildingDetails.address!,
		lat: buildingDetails.geoLocation!.lat,
		lon: buildingDetails.geoLocation!.lon,
		href: buildingDetails.buildingLink!,
	};
}

export function isValidBuilding(buildingDetails: {
	fullName: string | null;
	shortName: string | null;
	address: string | null;
	geoLocation: GeoResponse | null;
	buildingLink: string | null;
}): boolean {
	return (
		buildingDetails.fullName !== null &&
		buildingDetails.shortName !== null &&
		buildingDetails.address !== null &&
		buildingDetails.geoLocation !== null &&
		buildingDetails.buildingLink !== null
	);
}

export async function getGeoLocation(address: string): Promise<GeoResponse> {
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
						const geoResponse: GeoResponse = JSON.parse(data);
						resolve(geoResponse);
					} catch (_error) {
						reject({ error: "Error parsing JSON response." });
					}
				});
			})
			.on("error", (err) => {
				reject({ error: err.message });
			});
	});
}
