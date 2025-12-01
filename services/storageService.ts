import { AidRequest, RequestStatus } from "../types";

const STORAGE_KEY = 'aid_connect_requests';

export const getRequests = (): AidRequest[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveRequest = (request: AidRequest): void => {
  const requests = getRequests();
  const existingIndex = requests.findIndex(r => r.id === request.id);
  
  if (existingIndex >= 0) {
    requests[existingIndex] = request;
  } else {
    requests.push(request);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
};

export const getRequestByNic = (nic: string): AidRequest[] => {
  const requests = getRequests();
  return requests.filter(r => r.nic.toLowerCase() === nic.toLowerCase());
};

export const getRequestById = (id: string): AidRequest | undefined => {
  const requests = getRequests();
  return requests.find(r => r.id === id);
};

export const calculateStatus = (request: AidRequest): RequestStatus => {
  const totalNeeded = request.items.reduce((sum, item) => sum + item.quantityNeeded, 0);
  const totalReceived = request.items.reduce((sum, item) => sum + item.quantityReceived, 0);

  if (totalReceived >= totalNeeded && totalNeeded > 0) return RequestStatus.FULFILLED;
  if (totalReceived > 0) return RequestStatus.PARTIALLY_FULFILLED;
  return RequestStatus.PENDING;
};

// Seed some data if empty for demo purposes
const seedData = () => {
  if (getRequests().length === 0) {
    const mockData: AidRequest[] = [
      {
        id: 'req_123',
        nic: '90001V',
        fullName: 'Sarah Connor',
        contactNumber: '555-0101',
        location: 'Colombo - Dehiwala',
        items: [
          { 
            id: 'i1', 
            name: 'Water Bottles', 
            category: 'Water' as any, 
            quantityNeeded: 20, 
            quantityReceived: 5, 
            unit: 'liters',
            keywords: ['Drinking Water', 'Bottled', 'Hydration'] 
          },
          { 
            id: 'i2', 
            name: 'Rice', 
            category: 'Food' as any, 
            quantityNeeded: 10, 
            quantityReceived: 0, 
            unit: 'kg',
            keywords: ['Dry Rations', 'Carbohydrates', 'Staple Food']
          }
        ],
        status: RequestStatus.PARTIALLY_FULFILLED,
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now()
      },
      {
        id: 'req_124',
        nic: '90002V',
        fullName: 'John Smith',
        contactNumber: '555-0102',
        location: 'Kandy - Peradeniya',
        items: [
          { 
            id: 'i3', 
            name: 'Bandages', 
            category: 'Medical Supplies' as any, 
            quantityNeeded: 5, 
            quantityReceived: 0, 
            unit: 'packs',
            keywords: ['First Aid', 'Sterile', 'Wound Care', 'Medical'] 
          }
        ],
        status: RequestStatus.PENDING,
        createdAt: Date.now() - 172800000,
        updatedAt: Date.now()
      },
      {
        id: 'req_125',
        nic: '90003V',
        fullName: 'Kamal Perera',
        contactNumber: '077-1234567',
        location: 'Gampaha - Negombo',
        items: [
          { 
            id: 'i4', 
            name: 'Milk Powder', 
            category: 'Food' as any, 
            quantityNeeded: 5, 
            quantityReceived: 1, 
            unit: 'packs',
            keywords: ['Infant', 'Dairy', 'Nutrition', 'Dry Rations'] 
          },
          { 
            id: 'i5', 
            name: 'Baby Soap', 
            category: 'Hygiene' as any, 
            quantityNeeded: 2, 
            quantityReceived: 0, 
            unit: 'units',
            keywords: ['Infant Care', 'Sanitation', 'Cleaning'] 
          }
        ],
        status: RequestStatus.PENDING,
        createdAt: Date.now() - 43200000,
        updatedAt: Date.now()
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData));
  }
};

seedData(); // Initialize on load