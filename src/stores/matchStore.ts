import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Match = Database['public']['Tables']['matches']['Row']
type MatchInsert = Database['public']['Tables']['matches']['Insert']
type MatchUpdate = Database['public']['Tables']['matches']['Update']

interface MatchState {
  matches: Match[]
  loading: boolean
  fetchMatches: (userId?: string) => Promise<void>
  createMatch: (match: MatchInsert) => Promise<Match>
  updateMatch: (id: string, updates: MatchUpdate) => Promise<void>
  subscribeToMatches: (userId: string) => () => void
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  loading: false,

  fetchMatches: async (userId?: string) => {
    set({ loading: true })
    try {
      let query = supabase
        .from('matches')
        .select(`
          *,
          player1:profiles!matches_player1_id_fkey(username, elo_rating),
          player2:profiles!matches_player2_id_fkey(username, elo_rating),
          winner:profiles!matches_winner_id_fkey(username)
        `)
        .order('date', { ascending: false })

      if (userId) {
        query = query.or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      }

      const { data, error } = await query

      if (error) throw error
      set({ matches: data || [], loading: false })
    } catch (error: any) {
      console.error('Error fetching matches:', error)
      set({ loading: false })
      throw new Error(error.message || 'Failed to fetch matches')
    }
  },

  createMatch: async (match: MatchInsert) => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .insert(match)
        .select()
        .single()

      if (error) throw error
      
      // Refresh matches
      await get().fetchMatches()
      
      return data
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create match')
    }
  },

  updateMatch: async (id: string, updates: MatchUpdate) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      
      // Refresh matches
      await get().fetchMatches()
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update match')
    }
  },

  subscribeToMatches: (userId: string) => {
    const subscription = supabase
      .channel('matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `or(player1_id.eq.${userId},player2_id.eq.${userId})`
        },
        () => {
          get().fetchMatches(userId)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }
}))