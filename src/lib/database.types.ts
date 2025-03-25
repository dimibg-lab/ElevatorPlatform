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
      buildings: {
        Row: {
          id: string
          name: string
          address: string
          floors: number
          entrances: number
          created_at: string
          updated_at: string
          company_id: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          floors: number
          entrances: number
          created_at?: string
          updated_at?: string
          company_id: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          floors?: number
          entrances?: number
          created_at?: string
          updated_at?: string
          company_id?: string
        }
      }
      elevators: {
        Row: {
          id: string
          building_id: string
          company_id: string
          serial_number: string
          model: string
          capacity: number
          installation_date: string | null
          last_inspection_date: string | null
          next_inspection_date: string | null
          status: 'operational' | 'maintenance' | 'out_of_order'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          building_id: string
          company_id: string
          serial_number: string
          model: string
          capacity: number
          installation_date?: string | null
          last_inspection_date?: string | null
          next_inspection_date?: string | null
          status?: 'operational' | 'maintenance' | 'out_of_order'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          building_id?: string
          company_id?: string
          serial_number?: string
          model?: string
          capacity?: number
          installation_date?: string | null
          last_inspection_date?: string | null
          next_inspection_date?: string | null
          status?: 'operational' | 'maintenance' | 'out_of_order'
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
      elevator_parts: {
        Row: {
          id: string
          elevator_id: string
          name: string
          part_number: string | null
          manufacturer: string | null
          installation_date: string | null
          last_maintenance_date: string | null
          next_maintenance_date: string | null
          status: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          elevator_id: string
          name: string
          part_number?: string | null
          manufacturer?: string | null
          installation_date?: string | null
          last_maintenance_date?: string | null
          next_maintenance_date?: string | null
          status?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          elevator_id?: string
          name?: string
          part_number?: string | null
          manufacturer?: string | null
          installation_date?: string | null
          last_maintenance_date?: string | null
          next_maintenance_date?: string | null
          status?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}