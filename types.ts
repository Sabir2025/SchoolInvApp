
export enum ItemStatus {
  EXCELLENT = 'Отличное',
  GOOD = 'Хорошее',
  USED = 'Б/У',
  REPAIR_NEEDED = 'Требует ремонта',
  WRITE_OFF = 'Списание'
}

export interface CatalogItem {
  category: string;
  name: string;
}

export interface InventoryRecord {
  id: string;
  category: string;
  name: string;
  quantity: number;
  unit: string;
  inventoryNumber: string;
  model: string;
  serialNumber: string;
  responsible: string;
  roomNumber: string;
  status: ItemStatus;
  date: string;
  note: string;
  photoUrl: string;
  isSynced: boolean;
}

export interface User {
  email: string;
  fullName: string;
  organization: string;
  jobTitle: string;
  isAdmin: boolean;
  isVerified: boolean;
  notificationsEnabled: boolean;
  password?: string;
}
