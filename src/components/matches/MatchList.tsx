import React, { useEffect, useState } from 'react';
import { Search, Filter, Trophy, Calendar, Clock, Target, Plus, Swords } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useMatchStore } from '../../stores/matchStore';
import MatchCard from '../MatchCard';
import CreateMatchModal from './CreateMatchModal';
import ScoreModal from '../ScoreModal';
import MatchDetailsPage from '../MatchDetailsPage';
import type { Database } from '../../types/database';

type Match = Database['public']['Tables']['matches']['Row'];

export const MatchList: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Match['status']>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'recent'>('all');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<Match | null>(null);
  
  const { user, profile } = useAuthStore();
  const { fetchMatches, matches: storeMatches, loading } = useMatchStore();

  useEffect(() => {
    if (user) {
      fetchMatches(user.id);
    }
  }, [user, fetchMatches]);

  useEffect(() => {
    if (storeMatches.length > 0) {
      // Convert Supabase matches to our app format
      const convertedMatches = storeMatches.map(match => ({
        id: match.id,
        challengerId: match.player1_id,
        challengedId: match.player2_id,
        date: match.date,
        location: match.location,
        status: match.status,
        challengerScore: match.score ? parseInt(match.score.split('-')[0]) : undefined,
        challengedScore: match.score ? parseInt(match.score.split('-')[1]) : undefined,
        winner: match.winner_id,
        createdAt: match.created_at
      }));
      
      setMatches(convertedMatches);
      
      // Separate upcoming and recent matches
      const now = new Date();
      
      const upcoming = convertedMatches
        .filter(match => {
          const matchDate = new Date(match.date);
          return matchDate > now && (match.status === 'pending' || match.status === 'in_progress');
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const recent = convertedMatches
        .filter(match => {
          const matchDate = new Date(match.date);
          return matchDate <= now || match.status === 'completed';
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setUpcomingMatches(upcoming);
      setRecentMatches(recent);
    }
  }, [storeMatches]);

  useEffect(() => {
    filterMatches();
  }, [matches, searchQuery, statusFilter, timeFilter]);

  const filterMatches = () => {
    let filtered = matches;
    const now = new Date();

    // Apply time filter
    if (timeFilter === 'upcoming') {
      filtered = filtered.filter(match => {
        const matchDate = new Date(match.date);
        return matchDate > now && (match.status === 'pending' || match.status === 'in_progress');
      });
    } else if (timeFilter === 'recent') {
      filtered = filtered.filter(match => {
        const matchDate = new Date(match.date);
        return matchDate <= now || match.status === 'completed';
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(match => match.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(match => {
        // This is a simplification - in a real app, you'd need to fetch opponent names
        return match.location.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    setFilteredMatches(filtered);
  };

  const handleReportScore = (match: Match) => {
    setSelectedMatch(match);
    setShowScoreModal(true);
  };

  const handleScoreSubmit = async (challengerScore: number, challengedScore: number) => {
    if (selectedMatch && user) {
      try {
        // Determine winner
        const winnerId = challengerScore > challengedScore 
          ? selectedMatch.challengerId 
          : selectedMatch.challengedId;
        
        // Update match in Supabase
        await supabase
          .from('matches')
          .update({
            score: `${challengerScore}-${challengedScore}`,
            winner_id: winnerId,
            status: 'completed'
          })
          .eq('id', selectedMatch.id);
        
        // Refresh matches
        fetchMatches(user.id);
        
        setShowScoreModal(false);
        setSelectedMatch(null);
      } catch (error) {
        console.error('Error submitting score:', error);
      }
    }
  };

  const handleCreateNewMatch = () => {
    setShowCreateForm(true);
  };

  const handleMatchCreated = () => {
    if (user) {
      fetchMatches(user.id);
    }
  };

  const handleViewMatchDetails = (match: Match) => {
    setSelectedMatchForDetails(match);
    setShowMatchDetails(true);
  };

  const handleBackFromDetails = () => {
    setShowMatchDetails(false);
    setSelectedMatchForDetails(null);
  };

  const getFilterCount = (status: Match['status']) => {
    return matches.filter(m => m.status === status).length;
  };

  const getTimeFilterCount = (timeType: 'upcoming' | 'recent') => {
    const now = new Date();
    if (timeType === 'upcoming') {
      return matches.filter(match => {
        const matchDate = new Date(match.date);
        return matchDate > now && (match.status === 'pending' || match.status === 'in_progress');
      }).length;
    } else {
      return matches.filter(match => {
        const matchDate = new Date(match.date);
        return matchDate <= now || match.status === 'completed';
      }).length;
    }
  };

  // Show match details page if selected
  if (showMatchDetails && selectedMatchForDetails) {
    return (
      <MatchDetailsPage
        match={selectedMatchForDetails}
        onBack={handleBackFromDetails}
      />
    );
  }

  if (loading) {
    return (
      <div className="matches-page">
        <div className="matches-container">
          <div className="flex items-center justify-center h-64">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="matches-page">
      <div className="matches-container">
        {/* Header */}
        <div className="matches-header">
          <div className="matches-title-section">
            <h1 className="matches-title">
              <Swords size={32} />
              My Matches
            </h1>
            <p className="matches-subtitle">
              Manage your scheduled matches, view results, and track your tennis journey
            </p>
          </div>
          
          <div className="matches-header-actions">
            <button
              onClick={handleCreateNewMatch}
              className="matches-new-btn"
            >
              <Plus size={16} />
              Create New Match
            </button>
          </div>
        </div>

        {/* Upcoming Matches Section */}
        {upcomingMatches.length > 0 && (
          <div className="matches-section">
            <h2 className="matches-section-title">
              <Clock size={24} />
              Upcoming Matches ({upcomingMatches.length})
            </h2>
            <div className="matches-grid">
              {upcomingMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  currentUserId={user?.id || ''}
                  onReportScore={() => handleReportScore(match)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Matches Section */}
        {recentMatches.length > 0 && (
          <div className="matches-section">
            <h2 className="matches-section-title">
              <Calendar size={24} />
              Recent Matches ({recentMatches.length})
            </h2>
            <div className="matches-grid">
              {recentMatches.map((match) => (
                <div key={match.id} className="match-card-with-details">
                  <MatchCard
                    match={match}
                    currentUserId={user?.id || ''}
                    onReportScore={() => handleReportScore(match)}
                  />
                  
                  <button
                    onClick={() => handleViewMatchDetails(match)}
                    className="match-details-btn"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Search - Only show if there are matches */}
        {matches.length > 0 && (
          <div className="matches-filters">
            <div className="matches-filters-header">
              <h2 className="matches-section-title">
                <Filter size={24} />
                All Matches ({matches.length})
              </h2>
            </div>
            
            <div className="matches-filters-content">
              {/* Search Bar */}
              <div className="matches-search">
                <div className="matches-search-container">
                  <Search size={20} className="matches-search-icon" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="matches-search-input"
                    placeholder="Search by opponent or location..."
                  />
                </div>
              </div>

              {/* Filter Controls */}
              <div className="matches-filter-controls">
                <div className="matches-filter-group">
                  <label className="matches-filter-label">Time Period</label>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as typeof timeFilter)}
                    className="form-select matches-filter-select"
                  >
                    <option value="all">All Matches ({matches.length})</option>
                    <option value="upcoming">Upcoming ({getTimeFilterCount('upcoming')})</option>
                    <option value="recent">Recent ({getTimeFilterCount('recent')})</option>
                  </select>
                </div>

                <div className="matches-filter-group">
                  <label className="matches-filter-label">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="form-select matches-filter-select"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending ({getFilterCount('pending')})</option>
                    <option value="in_progress">In Progress ({getFilterCount('in_progress')})</option>
                    <option value="completed">Completed ({getFilterCount('completed')})</option>
                    <option value="cancelled">Cancelled ({getFilterCount('cancelled')})</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Filtered Results */}
            <div className="matches-grid">
              {filteredMatches.length > 0 ? (
                filteredMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    currentUserId={user?.id || ''}
                    onReportScore={() => handleReportScore(match)}
                  />
                ))
              ) : (
                <div className="matches-empty">
                  <Search size={48} className="matches-empty-icon" />
                  <h3 className="matches-empty-title">No matches found</h3>
                  <p className="matches-empty-description">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Matches State */}
        {matches.length === 0 && (
          <div className="matches-empty-state">
            <div className="matches-empty-content">
              <Swords size={64} className="matches-empty-icon" />
              <h3 className="matches-empty-title">
                No Matches Scheduled
              </h3>
              <p className="matches-empty-description">
                Create matches with other players to start building your match history and climb the rankings!
              </p>
              <div className="matches-empty-actions">
                <button
                  onClick={handleCreateNewMatch}
                  className="matches-empty-btn"
                >
                  <Target size={16} />
                  Create a Match
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Score Modal */}
      {showScoreModal && selectedMatch && (
        <ScoreModal
          match={selectedMatch}
          onSubmit={handleScoreSubmit}
          onClose={() => {
            setShowScoreModal(false);
            setSelectedMatch(null);
          }}
        />
      )}

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