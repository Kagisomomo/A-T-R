import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import MatchDetailsPage from '../components/MatchDetailsPage';
import type { Database } from '../types/database';
import { Match } from '../types';

const MatchDetailPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchMatchDetails = async () => {
      if (!matchId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .eq('id', matchId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          // Convert Supabase match to our app format
          const convertedMatch: Match = {
            id: data.id,
            challengerId: data.player1_id,
            challengedId: data.player2_id,
            date: data.date,
            location: data.location,
            status: data.status,
            challengerScore: data.score ? parseInt(data.score.split('-')[0]) : undefined,
            challengedScore: data.score ? parseInt(data.score.split('-')[1]) : undefined,
            winner: data.winner_id,
            createdAt: data.created_at
          };
          
          setMatch(convertedMatch);
        }
      } catch (err: any) {
        console.error('Error fetching match details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetails();
  }, [matchId]);

  const handleBack = () => {
    navigate('/matches');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-standard)' }}>Error Loading Match</h2>
          <p style={{ color: 'var(--text-subtle)' }}>{error}</p>
          <button 
            onClick={handleBack}
            className="mt-4 btn btn-primary"
          >
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-standard)' }}>Match Not Found</h2>
          <p style={{ color: 'var(--text-subtle)' }}>The match you're looking for doesn't exist or you don't have permission to view it.</p>
          <button 
            onClick={handleBack}
            className="mt-4 btn btn-primary"
          >
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  return <MatchDetailsPage match={match} onBack={handleBack} />;
};

export default MatchDetailPage;