"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEED_SUPPLIERS = exports.SEED_PRODUCTS = exports.SEED_USERS = exports.DEFAULT_PASSWORD = void 0;
exports.DEFAULT_PASSWORD = 'Dubicolt123!';
exports.SEED_USERS = [
    { id: 'usr_admin', email: 'admin@dubicolt.com', name: 'Admin', company: 'Dubicolt', role: 'admin' },
    { id: 'usr_buyer', email: 'buyer@test.com', name: 'Test Buyer', company: '', role: 'buyer' },
];
exports.SEED_PRODUCTS = [
    {
        sku: 'BP001',
        title: 'Front Brake Pad',
        description: 'OEM Front Brake Pad for Toyota Hilux',
        category: 'Brakes',
        brand: 'Toyota',
        oemNumber: '04465-0K240',
        sellingPrice: 4500,
        imageUrl: 'https://placehold.co/400x400?text=Brake+Pad',
        compatibleVehicles: [{ make: 'Toyota', model: 'Hilux', yearFrom: 2016, yearTo: 2020 }],
        stock: 50,
    },
    {
        sku: 'OF002',
        title: 'Oil Filter',
        description: 'Genuine Oil Filter',
        category: 'Filters',
        brand: 'Toyota',
        oemNumber: '90915-YZZD1',
        sellingPrice: 1200,
        imageUrl: 'https://placehold.co/400x400?text=Oil+Filter',
        compatibleVehicles: [{ make: 'Toyota', model: 'Hilux', yearFrom: 2015, yearTo: 2022 }],
        stock: 100,
    },
    {
        sku: 'AB003',
        title: 'ABS Sensor',
        description: 'Front Right ABS Sensor',
        category: 'Electrical',
        brand: 'Toyota',
        oemNumber: '89542-0K010',
        sellingPrice: 8500,
        imageUrl: 'https://placehold.co/400x400?text=ABS+Sensor',
        compatibleVehicles: [{ make: 'Toyota', model: 'Prado', yearFrom: 2010, yearTo: 2019 }],
        stock: 8,
    },
];
exports.SEED_SUPPLIERS = [
    { name: 'ABC Motors', phone: '+254700000001', email: 'abc@motors.co.ke' },
    { name: 'Nairobi Auto Parts', phone: '+254700000002', email: 'parts@nairobiauto.co.ke' },
];
