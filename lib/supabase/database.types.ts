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
          username: string
          user_class: string
          level: number
          current_xp: number
          max_xp: number
          current_mp: number
          max_mp: number
          onboarding_completed: boolean
          created_at: string
        }
        Insert: {
          id: string
          username: string
          user_class: string
          level?: number
          current_xp?: number
          max_xp?: number
          current_mp?: number
          max_mp?: number
          onboarding_completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          user_class?: string
          level?: number
          current_xp?: number
          max_xp?: number
          current_mp?: number
          max_mp?: number
          onboarding_completed?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      tracked_keywords: {
        Row: {
          id: string
          user_id: string
          keyword: string
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          keyword: string
          category: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          keyword?: string
          category?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tracked_keywords_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
