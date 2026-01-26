export interface ClientData {
  id: string;
  name: string;
  email?: string;
  referral_code?: string | null;
  has_allergies?: boolean;
  allergies_notes?: string | null;
  has_pets?: boolean;
  has_children?: boolean;
  special_instructions?: string | null;
}

export interface Booking {
  id: string;
  service_type: string;
  scheduled_date: string;
  status: string;
  address: string;
  booking_details: any;
  team_member_ids: string[];
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  invoice_id: string | null;
  skip_invoice: boolean;
  client_viewed_at: string | null;
  team_members?: {
    name: string;
    user_id: string;
    bio?: string | null;
    profile?: {
      avatar_url: string | null;
      full_name: string | null;
    } | null;
  }[];
  client?: {
    has_allergies: boolean;
    allergies_notes: string | null;
    has_pets: boolean;
    has_children: boolean;
    special_instructions: string | null;
    company_id?: string | null;
    dic?: string | null;
  } | null;
  checklist?: {
    id: string;
    street: string;
    city: string | null;
    postal_code: string | null;
    rooms: Array<{
      id: string;
      room_name: string;
      is_completed: boolean;
      completed_at: string | null;
    }>;
  };
  invoice?: {
    id: string;
    invoice_number: string;
    total: number;
    status: string;
    pdf_path: string | null;
    variable_symbol: string | null;
    date_due: string | null;
    client_name?: string | null;
    client_vat?: string | null;
    client_dic?: string | null;
    client_address?: string | null;
    client_email?: string | null;
    client_phone?: string | null;
    date_created?: string | null;
    date_performance?: string | null;
    notes?: string | null;
    subtotal?: number | null;
    vat_amount?: number | null;
    payment_method?: string | null;
    date_paid?: string | null;
  } | null;
  company_info?: {
    bank_account: string | null;
    bank_code: string | null;
    bank_name: string | null;
    iban: string | null;
  } | null;
  feedback?: {
    id: string;
    rating: number;
    comment: string | null;
    declined: boolean;
  } | null;
  checklist_id?: string | null;
}

export interface LoyaltyCredits {
  current_credits: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}
