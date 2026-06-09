"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehiclesService = exports.VehiclesService = void 0;
const store_1 = require("../dubicolt/store");
class VehiclesService {
    create(userId, data) {
        return store_1.dubicoltStore.createVehicle(userId, data);
    }
    list(userId) {
        return store_1.dubicoltStore.listVehicles(userId);
    }
    update(userId, id, data) {
        return store_1.dubicoltStore.updateVehicle(userId, id, data);
    }
    delete(userId, id) {
        return store_1.dubicoltStore.deleteVehicle(userId, id);
    }
}
exports.VehiclesService = VehiclesService;
exports.vehiclesService = new VehiclesService();
