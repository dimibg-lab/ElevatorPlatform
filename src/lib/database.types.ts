export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'company' | 'technician' | 'building_manager'
          created_at: string
          updated_at: string
          company_name: string | null
          company_address: string | null
          full_name: string | null
          professional_info: string | null
          building_address: string | null
        }
        Insert: {
          id: string
          role: 'company' | 'technician' | 'building_manager'
          created_at?: string
          updated_at?: string
          company_name?: string | null
          company_address?: string | null
          full_name?: string | null
          professional_info?: string | null
          building_address?: string | null
        }
        Update: {
          id?: string
          role?: 'company' | 'technician' | 'building_manager'
          created_at?: string
          updated_at?: string
          company_name?: string | null
          company_address?: string | null
          full_name?: string | null
          professional_info?: string | null
          building_address?: string | null
        }
      }
      elevators: {
        Row: {
          id: string
          name: string
          address: string
          status: 'working' | 'maintenance' | 'disabled'
          last_inspection_date: string | null
          notes: string | null
          company_id: string
          technician_id: string | null
          building_manager_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          status?: 'working' | 'maintenance' | 'disabled'
          last_inspection_date?: string | null
          notes?: string | null
          company_id: string
          technician_id?: string | null
          building_manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          status?: 'working' | 'maintenance' | 'disabled'
          last_inspection_date?: string | null
          notes?: string | null
          company_id?: string
          technician_id?: string | null
          building_manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      connection_requests: {
        Row: {
          id: string
          technician_id: string
          company_id: string
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          technician_id: string
          company_id: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          technician_id?: string
          company_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      maintenance_records: {
        Row: {
          id: string
          elevator_id: string
          technician_id: string
          maintenance_date: string
          description: string
          status: 'completed' | 'pending' | 'in_progress'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          elevator_id: string
          technician_id: string
          maintenance_date: string
          description: string
          status?: 'completed' | 'pending' | 'in_progress'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          elevator_id?: string
          technician_id?: string
          maintenance_date?: string
          description?: string
          status?: 'completed' | 'pending' | 'in_progress'
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          elevator_id: string
          building_manager_id: string
          amount: number
          due_date: string
          status: 'paid' | 'pending' | 'overdue'
          payment_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          elevator_id: string
          building_manager_id: string
          amount: number
          due_date: string
          status?: 'paid' | 'pending' | 'overdue'
          payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          elevator_id?: string
          building_manager_id?: string
          amount?: number
          due_date?: string
          status?: 'paid' | 'pending' | 'overdue'
          payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}