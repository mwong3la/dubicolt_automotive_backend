export const DEFAULT_PASSWORD = 'Dubicolt123!';

export const SEED_USERS = [
  {
    id: 'a0000001-0000-4000-8000-000000000001',
    email: 'admin@dubicolt.com',
    name: 'Admin',
    company: 'Dubicolt',
    role: 'admin' as const,
  },
  {
    id: 'a0000002-0000-4000-8000-000000000002',
    email: 'buyer@test.com',
    name: 'Test Buyer',
    company: '',
    role: 'buyer' as const,
  },
];

export const SEED_PRODUCTS = [
  {
    sku: 'BP001',
    title: 'Front Brake Pad',
    description: 'OEM Front Brake Pad for Toyota Hilux',
    category: 'Brakes',
    brand: 'Toyota',
    oemNumber: '04465-0K240',
    sellingPrice: 4500,
    imageUrl: 'https://placehold.co/400x400?text=Brake+Pad+1',
    images: [
      'https://placehold.co/400x400?text=Brake+Pad+1',
      'https://placehold.co/400x400?text=Brake+Pad+2',
      'https://placehold.co/400x400?text=Brake+Pad+3',
      'https://placehold.co/400x400?text=Brake+Pad+4',
    ],
    compatibleVehicles: [{ make: 'Toyota', model: 'Hilux', yearFrom: 2016, yearTo: 2020, engine: '2.8L Diesel' }],
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
    imageUrl: 'https://placehold.co/400x400?text=Oil+Filter+1',
    images: [
      'https://placehold.co/400x400?text=Oil+Filter+1',
      'https://placehold.co/400x400?text=Oil+Filter+2',
      'https://placehold.co/400x400?text=Oil+Filter+3',
    ],
    compatibleVehicles: [{ make: 'Toyota', model: 'Hilux', yearFrom: 2015, yearTo: 2022, engine: '2.4L Petrol' }],
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
    imageUrl: 'https://placehold.co/400x400?text=ABS+Sensor+1',
    images: [
      'https://placehold.co/400x400?text=ABS+Sensor+1',
      'https://placehold.co/400x400?text=ABS+Sensor+2',
    ],
    compatibleVehicles: [{ make: 'Toyota', model: 'Prado', yearFrom: 2010, yearTo: 2019, engine: '4.0L Petrol' }],
    stock: 8,
  },
];

export const SEED_SUPPLIERS = [
  { name: 'ABC Motors', phone: '+254700000001', email: 'abc@motors.co.ke' },
  { name: 'Nairobi Auto Parts', phone: '+254700000002', email: 'parts@nairobiauto.co.ke' },
];
