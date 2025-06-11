import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Clock, Trophy, Users, Save, X, Play, Pause } from 'lucide-react'
import { useMatchStore } from '../../stores/matchStore'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database'

type Match = Database['public']['Tables']['matches']['Row']

const scoreSchema = z.object({
  score: z.string().min(1, 'Score is required'),
  winnerId: z.string().min(1, 'Winner must be selected'),
  pgn: z.string().optional()
})

type ScoreFormData = z.infer<typeof scoreSchema>

interface MatchScoringProps {
  match: Match
  onClose: () => void
  onScoreSubmitted: () => void
}

export const MatchScoring: React.FC<MatchScoringProps> = ({
  match,
  onClose,
  onScoreSubmitted
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [matchStatus, setMatchStatus] = useState(match.status)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  
  const updateMatch = useMatchStore(state => state.updateMatch)
  const user = useAuthStore(state => state.user)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ScoreFormData>({
    resolver: zodResolver(scoreSchema)
  })

  const selectedWinner = watch('winnerId')

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartMatch = async () => {
    try {
      await updateMatch(match.id, { status: 'in_progress' })
      setMatchStatus('in_progress')
      setIsTimerRunning(true)
    } catch (error) {
      console.error('Error starting match:', error)
    }
  }

  const handlePauseMatch = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const onSubmit = async (data: ScoreFormData) => {
    if (!user) return

    setIsSubmitting(true)
    try {
      // Update match with result
      await updateMatch(match.id, {
        status: 'completed',
        winner_id: data.winnerId,
        score: data.score
      })

      // Record match event
      await supabase.from('match_events').insert({
        match_id: match.id,
        event_type: 'checkmate',
        player_id: data.winnerId,
        description: `Match completed. Final score: ${data.score}`,
        score_snapshot: {
          final_score: data.score,
          winner: data.winnerId,
          duration: elapsedTime
        },
        metadata: {
          pgn: data.pgn,
          duration_seconds: elapsedTime
        }
      })

      onScoreSubmitted()
      onClose()
    } catch (error: any) {
      console.error('Error submitting score:', error)
      alert('Failed to submit score: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get player profiles
  const [player1Profile, setPlayer1Profile] = useState<any>(null)
  const [player2Profile, setPlayer2Profile] = useState<any>(null)

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', [match.player1_id, match.player2_id])

      if (profiles) {
        setPlayer1Profile(profiles.find(p => p.user_id === match.player1_id))
        setPlayer2Profile(profiles.find(p => p.user_id === match.player2_id))
      }
    }

    fetchProfiles()
  }, [match.player1_id, match.player2_id])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Trophy className="mr-2 h-6 w-6 text-yellow-500" />
              Match Scoring
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Match Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-500 mr-2" />
                <span className="font-medium">
                  {player1Profile?.username} vs {player2Profile?.username}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-500 mr-2" />
                <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Status: <span className="font-medium capitalize">{matchStatus}</span>
              </div>
              <div className="flex space-x-2">
                {matchStatus === 'pending' && (
                  <button
                    onClick={handleStartMatch}
                    className="btn btn-primary btn-sm"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start Match
                  </button>
                )}
                {matchStatus === 'in_progress' && (
                  <button
                    onClick={handlePauseMatch}
                    className="btn btn-secondary btn-sm"
                  >
                    {isTimerRunning ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Score Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Winner Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Match Winner
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative">
                  <input
                    {...register('winnerId')}
                    type="radio"
                    value={match.player1_id}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedWinner === match.player1_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="text-center">
                      <div className="font-medium">{player1Profile?.username}</div>
                      <div className="text-sm text-gray-500">
                        Rating: {player1Profile?.elo_rating}
                      </div>
                    </div>
                  </div>
                </label>

                <label className="relative">
                  <input
                    {...register('winnerId')}
                    type="radio"
                    value={match.player2_id}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedWinner === match.player2_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="text-center">
                      <div className="font-medium">{player2Profile?.username}</div>
                      <div className="text-sm text-gray-500">
                        Rating: {player2Profile?.elo_rating}
                      </div>
                    </div>
                  </div>
                </label>
              </div>
              {errors.winnerId && (
                <p className="mt-1 text-sm text-red-600">{errors.winnerId.message}</p>
              )}
            </div>

            {/* Score Input */}
            <div>
              <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-2">
                Final Score
              </label>
              <input
                {...register('score')}
                type="text"
                id="score"
                className="form-input"
                placeholder="e.g., 1-0, 1/2-1/2"
              />
              {errors.score && (
                <p className="mt-1 text-sm text-red-600">{errors.score.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Standard notation: 1-0 (white wins), 0-1 (black wins), 1/2-1/2 (draw)
              </p>
            </div>

            {/* PGN Input */}
            <div>
              <label htmlFor="pgn" className="block text-sm font-medium text-gray-700 mb-2">
                PGN (Optional)
              </label>
              <textarea
                {...register('pgn')}
                id="pgn"
                rows={4}
                className="form-input"
                placeholder="Paste the PGN notation of the game here..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Portable Game Notation for game analysis and review
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || matchStatus !== 'in_progress'}
                className="flex-1 btn btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Submit Score
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}