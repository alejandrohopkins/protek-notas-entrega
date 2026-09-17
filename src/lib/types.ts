export interface Company {
  id: number;
  name: string;
  rif: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  logo_data_url: string | null;
  updated_at: string;
}

export interface Client {
  id: number;
  name: string;
  rif: string;
  address: string;
  phone: string;
  email: string;
  active: number;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string | null;
  model: string;
  color: string;
  size: string;
  unit: string;
  description: string;
  photo_data_url: string | null;
  price: number;
  stock: number;
  active: number;
  created_at: string;
}

export type MovementType = "ENTRADA" | "SALIDA" | "AJUSTE";

export interface InventoryMovement {
  id: number;
  product_id: number;
  date: string;
  type: MovementType;
  quantity: number;
  balance_after: number;
  reference: string;
  note: string;
  created_at: string;
}

export type DeliveryNoteStatus = "EMITIDA" | "ANULADA";

export interface DeliveryNote {
  id: number;
  client_id: number;
  date: string;
  status: DeliveryNoteStatus;
  notes: string;
  total: number;
  created_at: string;
}

export interface DeliveryNoteItem {
  id: number;
  delivery_note_id: number;
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface ActionState {
  error?: string;
  success?: string;
}
