export type JsonLike =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonLike | undefined }
  | JsonLike[]

type GenericTable = {
  Row: Record<string, JsonLike>
  Insert: Record<string, JsonLike>
  Update: Record<string, JsonLike>
  Relationships: []
}

export type SupabaseDatabase = {
  public: {
    Tables: Record<string, GenericTable>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
