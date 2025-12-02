import { AidRequest, RequestStatus } from "../types";
import { supabase } from "./supabaseClient";

// Helper to map DB snake_case to TS camelCase
const mapFromDb = (row: any): AidRequest => ({
  id: row.id,
  nic: row.nic,
  fullName: row.full_name,
  contactNumber: row.contact_number,
  extraContactNumber: row.extra_contact_number,
  location: row.location,
  items: row.items, // JSONB structure matches AidItem[]
  status: row.status as RequestStatus,
  createdAt: Number(row.created_at),
  updatedAt: Number(row.updated_at),
  notes: row.notes
});

// Helper to map TS camelCase to DB snake_case
const mapToDb = (req: AidRequest) => ({
  id: req.id,
  nic: req.nic,
  full_name: req.fullName,
  contact_number: req.contactNumber,
  extra_contact_number: req.extraContactNumber,
  location: req.location,
  items: req.items,
  status: req.status,
  created_at: req.createdAt,
  updated_at: req.updatedAt,
  notes: req.notes
});

export const getRequests = async (): Promise<AidRequest[]> => {
  const { data, error } = await supabase
    .from('aid_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching requests:', error);
    return [];
  }
  return data.map(mapFromDb);
};

export const saveRequest = async (request: AidRequest): Promise<void> => {
  const dbPayload = mapToDb(request);
  const { error } = await supabase
    .from('aid_requests')
    .upsert(dbPayload);

  if (error) {
    console.error('Error saving request:', error);
    throw error;
  }
};

export const getRequestByNic = async (nic: string): Promise<AidRequest[]> => {
  const { data, error } = await supabase
    .from('aid_requests')
    .select('*')
    .ilike('nic', nic); // Case-insensitive search

  if (error) {
    console.error('Error fetching by NIC:', error);
    return [];
  }
  return data.map(mapFromDb);
};

export const getRequestById = async (id: string): Promise<AidRequest | undefined> => {
  const { data, error } = await supabase
    .from('aid_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return undefined;
  }
  return mapFromDb(data);
};

export const deleteRequest = async (requestId: string): Promise<void> => {
  const { error } = await supabase
    .from('aid_requests')
    .delete()
    .eq('id', requestId);

  if (error) {
    console.error('Error deleting request:', error);
    throw error;
  }
};

export const calculateStatus = (request: AidRequest): RequestStatus => {
  const totalNeeded = request.items.reduce((sum, item) => sum + item.quantityNeeded, 0);
  const totalReceived = request.items.reduce((sum, item) => sum + item.quantityReceived, 0);

  if (totalReceived >= totalNeeded && totalNeeded > 0) return RequestStatus.FULFILLED;
  if (totalReceived > 0) return RequestStatus.PARTIALLY_FULFILLED;
  return RequestStatus.PENDING;
};