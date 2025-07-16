"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoomObject = exports.Room = void 0;
class Room {
    fullName;
    shortName;
    number;
    name;
    address;
    lat;
    lon;
    seats;
    type;
    furniture;
    href;
    constructor(fullName, shortName, number, name, address, lat, lon, seats, type, furniture, href) {
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
exports.Room = Room;
function createRoomObject(roomDetails, building) {
    return {
        fullName: building.fullName,
        shortName: building.shortName,
        number: roomDetails.number,
        name: `${building.shortName}_${roomDetails.number}`,
        address: building.address,
        lat: building.lat,
        lon: building.lon,
        seats: roomDetails.seats,
        type: roomDetails.type,
        furniture: roomDetails.furniture,
        href: roomDetails.href,
    };
}
exports.createRoomObject = createRoomObject;
//# sourceMappingURL=Room.js.map