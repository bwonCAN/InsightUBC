import { Building } from "./Building";

export class Room {
	public fullName: string;
	public shortName: string;
	public number: string;
	public name: string;
	public address: string;
	public lat: number | undefined;
	public lon: number | undefined;
	public seats: number;
	public type: string;
	public furniture: string;
	public href: string;

	constructor(
		fullName: string,
		shortName: string,
		number: string,
		name: string,
		address: string,
		lat: number,
		lon: number,
		seats: number,
		type: string,
		furniture: string,
		href: string
	) {
		this.fullName = fullName;
		this.shortName = shortName;
		this.number = number;
		this.name = name;
		this.address = address;
		this.lat = lat;
		this.lon = lon;
		this.seats = seats;
		this.type = type;
		this.furniture = furniture;
		this.href = href;
	}
}

export function createRoomObject(
	roomDetails: {
		number: string | null;
		seats: number | null;
		type: string | null;
		furniture: string | null;
		href: string | null;
	},
	building: Building
): Room {
	return {
		fullName: building.fullName,
		shortName: building.shortName,
		number: roomDetails.number!,
		name: `${building.shortName}_${roomDetails.number}`,
		address: building.address,
		lat: building.lat,
		lon: building.lon,
		seats: roomDetails.seats!,
		type: roomDetails.type!,
		furniture: roomDetails.furniture!,
		href: roomDetails.href!,
	};
}
