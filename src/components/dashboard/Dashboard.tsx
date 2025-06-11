import React, { useState, useEffect } from 'react';
import { Target, Zap, Trophy, Calendar, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useMatchStore } from '../../stores/matchStore';
import { useTournamentStore } from '../../stores/tournamentStore';
import { Link } from 'react-router-dom';
import CreateMatchModal from '../matches/CreateMatchModal';

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuthStore();
  const { matches, fetchMatches } = useMatchStore();
  const { tournaments, fetchTournaments } = useTournamentStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchMatches(user.id);
      fetchTournaments();
    }
  }, [user, fetchMatches, fetchTournaments]);

  useEffect(() => {
    // Process matches for display
    const now = new Date();
    
    // Get recent matches
    const recent = matches
      .filter(match => 
        new Date(match.date) <= now || match.status === 'completed'
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
    
    setRecentMatches(recent);
    
    // Get upcoming tournaments
    const upcoming = tournaments
      .filter(tournament => 
        new Date(tournament.start_date) > now && 
        (tournament.status === 'registration_open' || tournament.status === 'registration_closed')
      )
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 3);
    
    setUpcomingTournaments(upcoming);
  }, [matches, tournaments]);

  const handleCreateMatch = () => {
    setShowCreateForm(true);
  };

  const handleMatchCreated = () => {
    if (user) {
      fetchMatches(user.id);
    }
  };

  const winRate = profile ? 
    (profile.matches_played > 0 ? 
      (profile.matches_won / profile.matches_played * 100).toFixed(1) : 
      '0.0') : 
    '0.0';

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Welcome Message */}
        <div className="dashboard-welcome">
          <div className="dashboard-welcome-content">
            <h1 className="dashboard-welcome-title">
              Welcome back, <span className="dashboard-welcome-name">{profile?.username || 'Player'}</span>
            </h1>
            <p className="dashboard-welcome-subtitle">
              Ready to dominate the court? Create matches with new opponents and climb the rankings.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="dashboard-stats">
          <div className="dashboard-stat-card stagger-1">
            <div className="dashboard-stat-value">{profile?.elo_rating || 1200}</div>
            <div className="dashboard-stat-label">Rating</div>
          </div>
          <div className="dashboard-stat-card stagger-2">
            <div className="dashboard-stat-value">{profile?.matches_played || 0}</div>
            <div className="dashboard-stat-label">Matches Played</div>
          </div>
          <div className="dashboard-stat-card stagger-3">
            <div className="dashboard-stat-value">{profile?.matches_won || 0}</div>
            <div className="dashboard-stat-label">Matches Won</div>
          </div>
          <div className="dashboard-stat-card stagger-4">
            <div className="dashboard-stat-value">{winRate}%</div>
            <div className="dashboard-stat-label">Win Rate</div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="dashboard-section stagger-1">
          <h2 className="dashboard-section-title">
            <Calendar size={24} className="mr-2" />
            Recent Activity
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Matches */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-standard)' }}>Recent Matches</h3>
                  <Link to="/matches" className="text-sm font-medium flex items-center" style={{ color: 'var(--quantum-cyan)' }}>
                    View All <ChevronRight size={16} />
                  </Link>
                </div>
                
                {recentMatches.length > 0 ? (
                  <div className="space-y-4">
                    {recentMatches.map(match => (
                      <div key={match.id} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium" style={{ color: 'var(--text-standard)' }}>
                            {match.player1?.username || 'Player 1'} vs {match.player2?.username || 'Player 2'}
                          </div>
                          <div className="text-xs px-2 py-1 rounded-full" style={{ 
                            backgroundColor: match.status === 'completed' ? 'rgba(0, 255, 170, 0.1)' : 'rgba(255, 149, 0, 0.1)',
                            color: match.status === 'completed' ? 'var(--success-green)' : 'var(--warning-orange)'
                          }}>
                            {match.status}
                          </div>
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-subtle)' }}>
                          {new Date(match.date).toLocaleDateString()}
                        </div>
                        {match.status === 'completed' && match.score && (
                          <div className="mt-2 font-medium" style={{ color: 'var(--quantum-cyan)' }}>
                            Score: {match.score}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Trophy size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--text-subtle)' }}>No recent matches found</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Upcoming Tournaments */}
            <div>
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-standard)' }}>Upcoming Tournaments</h3>
                  <Link to="/tournaments" className="text-sm font-medium flex items-center" style={{ color: 'var(--quantum-cyan)' }}>
                    View All <ChevronRight size={16} />
                  </Link>
                </div>
                
                {upcomingTournaments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingTournaments.map(tournament => (
                      <div key={tournament.id} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                        <div className="font-medium mb-2" style={{ color: 'var(--text-standard)' }}>
                          {tournament.name}
                        </div>
                        <div className="text-sm mb-1" style={{ color: 'var(--text-subtle)' }}>
                          <Calendar size={14} className="inline mr-1" />
                          {new Date(tournament.start_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs px-2 py-1 rounded-full inline-block" style={{ 
                          backgroundColor: 'rgba(0, 212, 255, 0.1)',
                          color: 'var(--quantum-cyan)'
                        }}>
                          {tournament.format.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Trophy size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--text-subtle)' }}>No upcoming tournaments</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Action Section */}
        <div className="dashboard-section stagger-2">
          <div className="dashboard-getting-started">
            <div className="dashboard-getting-started-content">
              <Zap size={64} className="dashboard-getting-started-icon" />
              <h3 className="dashboard-getting-started-title">
                Ready to Start Your Tennis Journey?
              </h3>
              <p className="dashboard-getting-started-description">
                Create matches with other players to build your match history, improve your ranking, and become part of the competitive tennis community!
              </p>
              <div className="dashboard-getting-started-actions">
                <button
                  onClick={handleCreateMatch}
                  className="btn btn-primary btn-glare"
                >
                  <Target size={16} />
                  Create a Match
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Match Creation Form */}
      {showCreateForm && (
        <CreateMatchModal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onMatchCreated={handleMatchCreated}
          mode="create"
        />
      )}
    </div>
  );
};