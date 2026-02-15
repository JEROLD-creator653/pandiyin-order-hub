// Type augmentation for custom RPC functions
// This file extends the Supabase types to include our custom database functions

declare module '@supabase/supabase-js' {
  interface Database {
    public: {
      Functions: {
        has_role: {
          Args: { _user_id: string; _role: 'admin' | 'user' }
          Returns: boolean
        }
        validate_coupon: {
          Args: {
            _coupon_code: string
            _user_id: string
            _order_total: number
          }
          Returns: Array<{
            is_valid: boolean
            error_message: string
            discount_value: number
            discount_type: string
            coupon_id: string | null
          }>
        }
        redeem_coupon: {
          Args: {
            _coupon_code: string
            _user_id: string
            _order_id: string
          }
          Returns: boolean
        }
      }
    }
  }
}

export {};
