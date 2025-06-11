import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  Trophy, 
  Target,
  TrendingUp,
  BarChart3,
  Play,
  Pause,
  Award,
  Users,
  Timer,
  Activity,
  Zap,
  Star
} from 'lucide-react';
import { Match } from '../types';
import { UserService } from '../services/UserService';
import { StatisticsService } from '../services/StatisticsService';
import { useAuthStore } from '../stores/authStore';

interface MatchDetailsPageProps {
  match: Match;
  onBack: () => void;
}

interface MatchStatistics {
  possession: { user: number; opponent: number };
  shots: { user: number; opponent: number };
  aces: { user: number; opponent: number };
  doubleFaults: { user: number; opponent: number };
  breakPoints: { user: { won: number; total: number }; opponent: { won: number; total: number } };
  winners: { user: number; opponent: number };
  unforcedErrors: { user: number; opponent: number };
}

interface MatchTimeline {
  time: string;
  event: string;
  player: string;
  description: string;
  type: 'point' | 'game' | 'set' | 'break' | 'ace' | 'winner' | 'error';
}

interface MatchHighlight {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'ace' | 'winner' | 'break_point' | 'rally' | 'comeback';
  videoUrl?: string;
}

const MatchDetailsPage: React.FC<MatchDetailsPageProps> = ({ match, onBack }) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'statistics' | 'timeline' | 'highlights'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState<MatchStatistics | null>(null);
  const [timeline, setTimeline] = useState<MatchTimeline[]>([]);
  const [highlights, setHighlights] = useState<MatchHighlight[]>([]);

  const opponent = UserService.getPlayerById(
    match.challengerId === user?.id ? match.challengedId : match.challengerId
  );
  
  const isUserChallenger = match.challengerId === user?.id;
  const matchDate = new Date(match.date);
  const isCompleted = match.status === 'completed';

  useEffect(() => {
    loadMatchData();
  }, [match.id]);

  const loadMatchData = async () => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Try to load real statistics if available
      let detailedStats = null;
      
      if (match.detailedStatsId) {
        detailedStats = StatisticsService.getDetailedMatchStatistics(match.detailedStatsId);
      } else {
        // Fallback: try to find by match ID
        detailedStats = StatisticsService.getDetailedMatchStatisticsByMatchId(match.id);
      }

      if (detailedStats && user) {
        // Convert detailed statistics to the format expected by the UI
        const isPlayer1 = detailedStats.player1Id === user.id;
        
        const convertedStats: MatchStatistics = {
          possession: {
            user: isPlayer1 ? detailedStats.possession.player1 : detailedStats.possession.player2,
            opponent: isPlayer1 ? detailedStats.possession.player2 : detailedStats.possession.player1
          },
          shots: {
            user: isPlayer1 ? detailedStats.shots.player1 : detailedStats.shots.player2,
            opponent: isPlayer1 ? detailedStats.shots.player2 : detailedStats.shots.player1
          },
          aces: {
            user: isPlayer1 ? detailedStats.aces.player1 : detailedStats.aces.player2,
            opponent: isPlayer1 ? detailedStats.aces.player2 : detailedStats.aces.player1
          },
          doubleFaults: {
            user: isPlayer1 ? detailedStats.doubleFaults.player1 : detailedStats.doubleFaults.player2,
            opponent: isPlayer1 ? detailedStats.doubleFaults.player2 : detailedStats.doubleFaults.player1
          },
          breakPoints: {
            user: isPlayer1 ? detailedStats.breakPoints.player1 : detailedStats.breakPoints.player2,
            opponent: isPlayer1 ? detailedStats.breakPoints.player2 : detailedStats.breakPoints.player1
          },
          winners: {
            user: isPlayer1 ? detailedStats.winners.player1 : detailedStats.winners.player2,
            opponent: isPlayer1 ? detailedStats.winners.player2 : detailedStats.winners.player1
          },
          unforcedErrors: {
            user: isPlayer1 ? detailedStats.unforcedErrors.player1 : detailedStats.unforcedErrors.player2,
            opponent: isPlayer1 ? detailedStats.unforcedErrors.player2 : detailedStats.unforcedErrors.player1
          }
        };

        setStatistics(convertedStats);

        // Load timeline and highlights from real data
        const realTimeline = StatisticsService.generateMatchTimeline(match.id);
        const realHighlights = StatisticsService.generateMatchHighlights(match.id);
        
        setTimeline(realTimeline);
        setHighlights(realHighlights);
      } else {
        // Generate mock statistics as fallback
        const mockStats: MatchStatistics = {
          possession: { 
            user: Math.floor(Math.random() * 20) + 40, 
            opponent: 0 
          },
          shots: { 
            user: Math.floor(Math.random() * 50) + 80, 
            opponent: Math.floor(Math.random() * 50) + 80 
          },
          aces: { 
            user: Math.floor(Math.random() * 8) + 2, 
            opponent: Math.floor(Math.random() * 8) + 2 
          },
          doubleFaults: { 
            user: Math.floor(Math.random() * 4), 
            opponent: Math.floor(Math.random() * 4) 
          },
          breakPoints: {
            user: { won: Math.floor(Math.random() * 4) + 1, total: Math.floor(Math.random() * 3) + 3 },
            opponent: { won: Math.floor(Math.random() * 4) + 1, total: Math.floor(Math.random() * 3) + 3 }
          },
          winners: { 
            user: Math.floor(Math.random() * 20) + 15, 
            opponent: Math.floor(Math.random() * 20) + 15 
          },
          unforcedErrors: { 
            user: Math.floor(Math.random() * 15) + 10, 
            opponent: Math.floor(Math.random() * 15) + 10 
          }
        };
        
        // Calculate opponent possession
        mockStats.possession.opponent = 100 - mockStats.possession.user;
        
        // Generate mock timeline
        const mockTimeline: MatchTimeline[] = [
          { time: '0:05', event: 'Match Start', player: 'System', description: 'Match begins', type: 'game' },
          { time: '0:12', event: 'Ace', player: user?.name || 'You', description: 'Service ace down the T', type: 'ace' },
          { time: '0:28', event: 'Winner', player: opponent?.name || 'Opponent', description: 'Forehand winner cross-court', type: 'winner' },
          { time: '0:45', event: 'Break Point', player: user?.name || 'You', description: 'Break point converted', type: 'break' },
          { time: '1:15', event: 'Set Won', player: isUserChallenger && match.challengerScore ? (match.challengerScore > (match.challengedScore || 0) ? user?.name || 'You' : opponent?.name || 'Opponent') : 'Unknown', description: 'First set completed', type: 'set' },
        ];
        
        // Generate mock highlights
        const mockHighlights: MatchHighlight[] = [
          {
            id: '1',
            title: 'Amazing Rally',
            description: '32-shot rally ending with a spectacular winner',
            timestamp: '1:23:45',
            type: 'rally'
          },
          {
            id: '2',
            title: 'Service Ace',
            description: 'Powerful ace at 125 mph to save break point',
            timestamp: '0:45:12',
            type: 'ace'
          },
          {
            id: '3',
            title: 'Break Point Conversion',
            description: 'Crucial break in the deciding set',
            timestamp: '2:15:30',
            type: 'break_point'
          },
          {
            id: '4',
            title: 'Comeback Victory',
            description: 'Won from 2 sets down in thrilling fashion',
            timestamp: '2:45:00',
            type: 'comeback'
          }
        ];
        
        setStatistics(mockStats);
        setTimeline(mockTimeline);
        setHighlights(mockHighlights);
      }
    } catch (error) {
      console.error('Error loading match data:', error);
      // Set empty data on error
      setStatistics(null);
      setTimeline([]);
      setHighlights([]);
    }
    
    setIsLoading(false);
  };

  const getStatusColor = (status: Match['status']) => {
    switch (status) {
      case 'pending':
        return 'var(--warning-orange)';
      case 'confirmed':
        return 'var(--quantum-cyan)';
      case 'completed':
        return 'var(--success-green)';
      case 'declined':
        return 'var(--error-pink)';
      default:
        return 'var(--text-muted)';
    }
  };

  const getStatusText = (status: Match['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'completed':
        return 'Completed';
      case 'declined':
        return 'Declined';
      default:
        return status;
    }
  };

  const renderOverview = () => (
    <div className="match-details-overview">
      {/* Match Score */}
      {isCompleted && match.challengerScore !== undefined && match.challengedScore !== undefined && (
        <div className="match-score-section">
          <h3 className="match-details-section-title">Final Score</h3>
          <div className="match-score-display">
            <div className="match-score-player">
              <div className="match-score-name">{isUserChallenger ? user?.name : opponent?.name}</div>
              <div className="match-score-value">{isUserChallenger ? match.challengerScore : match.challengedScore}</div>
            </div>
            <div className="match-score-separator">-</div>
            <div className="match-score-player">
              <div className="match-score-name">{isUserChallenger ? opponent?.name : user?.name}</div>
              <div className="match-score-value">{isUserChallenger ? match.challengedScore : match.challengerScore}</div>
            </div>
          </div>
          
          {match.winner && (
            <div className="match-winner-display">
              <Trophy size={20} />
              <span>Winner: {match.winner === user?.id ? 'You' : opponent?.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Match Information */}
      <div className="match-info-grid">
        <div className="match-info-card">
          <div className="match-info-header">
            <Calendar size={20} />
            <span>Match Details</span>
          </div>
          <div className="match-info-content">
            <div className="match-info-item">
              <span className="match-info-label">Date:</span>
              <span className="match-info-value">{matchDate.toLocaleDateString()}</span>
            </div>
            <div className="match-info-item">
              <span className="match-info-label">Time:</span>
              <span className="match-info-value">{matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="match-info-item">
              <span className="match-info-label">Status:</span>
              <span 
                className="match-info-status"
                style={{ color: getStatusColor(match.status) }}
              >
                {getStatusText(match.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="match-info-card">
          <div className="match-info-header">
            <MapPin size={20} />
            <span>Venue</span>
          </div>
          <div className="match-info-content">
            <div className="match-info-item">
              <span className="match-info-label">Location:</span>
              <span className="match-info-value">{match.location}</span>
            </div>
            <div className="match-info-item">
              <span className="match-info-label">Surface:</span>
              <span className="match-info-value">Hard Court</span>
            </div>
            <div className="match-info-item">
              <span className="match-info-label">Duration:</span>
              <span className="match-info-value">2h 15m</span>
            </div>
          </div>
        </div>

        <div className="match-info-card">
          <div className="match-info-header">
            <Users size={20} />
            <span>Players</span>
          </div>
          <div className="match-info-content">
            <div className="match-players-display">
              <div className="match-player-info">
                <div className="player-avatar">
                  {user?.name.split(' ').map(n => n[0]).join('') || 'U'}
                </div>
                <div className="match-player-details">
                  <div className="match-player-name">{user?.name}</div>
                  <div className="match-player-rating">Rating: {user?.rating}</div>
                </div>
              </div>
              
              <div className="match-vs">VS</div>
              
              <div className="match-player-info">
                <div className="player-avatar">
                  {opponent?.name.split(' ').map(n => n[0]).join('') || 'O'}
                </div>
                <div className="match-player-details">
                  <div className="match-player-name">{opponent?.name}</div>
                  <div className="match-player-rating">Rating: {opponent?.rating}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post-Match Analysis */}
      {isCompleted && (
        <div className="match-analysis-section">
          <h3 className="match-details-section-title">Post-Match Analysis</h3>
          <div className="match-analysis-content">
            <div className="analysis-summary">
              <p>
                {match.winner === user?.id 
                  ? "Congratulations on your victory! You showed great composure and executed your game plan effectively."
                  : "A hard-fought match with valuable learning opportunities. Focus on the positives and areas for improvement."
                }
              </p>
            </div>
            
            <div className="analysis-highlights">
              <h4>Key Takeaways:</h4>
              <ul>
                <li>Strong serving performance with {statistics?.aces.user || 0} aces</li>
                <li>Effective net play and court positioning</li>
                <li>Good mental resilience in pressure situations</li>
                <li>Areas to work on: consistency on second serve</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStatistics = () => (
    <div className="match-statistics">
      {statistics && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <Activity size={20} />
                <span>Court Coverage</span>
              </div>
              <div className="stat-content">
                <div className="stat-bar">
                  <div className="stat-bar-label">You</div>
                  <div className="stat-bar-container">
                    <div 
                      className="stat-bar-fill user"
                      style={{ width: `${statistics.possession.user}%` }}
                    />
                    <span className="stat-bar-value">{statistics.possession.user}%</span>
                  </div>
                </div>
                <div className="stat-bar">
                  <div className="stat-bar-label">{opponent?.name}</div>
                  <div className="stat-bar-container">
                    <div 
                      className="stat-bar-fill opponent"
                      style={{ width: `${statistics.possession.opponent}%` }}
                    />
                    <span className="stat-bar-value">{statistics.possession.opponent}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <Target size={20} />
                <span>Total Shots</span>
              </div>
              <div className="stat-content">
                <div className="stat-comparison">
                  <div className="stat-player">
                    <span className="stat-value">{statistics.shots.user}</span>
                    <span className="stat-label">You</span>
                  </div>
                  <div className="stat-player">
                    <span className="stat-value">{statistics.shots.opponent}</span>
                    <span className="stat-label">{opponent?.name}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <Zap size={20} />
                <span>Aces</span>
              </div>
              <div className="stat-content">
                <div className="stat-comparison">
                  <div className="stat-player">
                    <span className="stat-value">{statistics.aces.user}</span>
                    <span className="stat-label">You</span>
                  </div>
                  <div className="stat-player">
                    <span className="stat-value">{statistics.aces.opponent}</span>
                    <span className="stat-label">{opponent?.name}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <Award size={20} />
                <span>Winners</span>
              </div>
              <div className="stat-content">
                <div className="stat-comparison">
                  <div className="stat-player">
                    <span className="stat-value">{statistics.winners.user}</span>
                    <span className="stat-label">You</span>
                  </div>
                  <div className="stat-player">
                    <span className="stat-value">{statistics.winners.opponent}</span>
                    <span className="stat-label">{opponent?.name}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <TrendingUp size={20} />
                <span>Break Points</span>
              </div>
              <div className="stat-content">
                <div className="stat-comparison">
                  <div className="stat-player">
                    <span className="stat-value">
                      {statistics.breakPoints.user.won}/{statistics.breakPoints.user.total}
                    </span>
                    <span className="stat-label">You</span>
                  </div>
                  <div className="stat-player">
                    <span className="stat-value">
                      {statistics.breakPoints.opponent.won}/{statistics.breakPoints.opponent.total}
                    </span>
                    <span className="stat-label">{opponent?.name}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <Activity size={20} />
                <span>Unforced Errors</span>
              </div>
              <div className="stat-content">
                <div className="stat-comparison">
                  <div className="stat-player">
                    <span className="stat-value">{statistics.unforcedErrors.user}</span>
                    <span className="stat-label">You</span>
                  </div>
                  <div className="stat-player">
                    <span className="stat-value">{statistics.unforcedErrors.opponent}</span>
                    <span className="stat-label">{opponent?.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderTimeline = () => (
    <div className="match-timeline">
      <div className="timeline-container">
        {timeline.map((event, index) => (
          <div key={index} className={`timeline-event ${event.type}`}>
            <div className="timeline-marker">
              {event.type === 'ace' && <Zap size={16} />}
              {event.type === 'winner' && <Star size={16} />}
              {event.type === 'break' && <Target size={16} />}
              {event.type === 'set' && <Trophy size={16} />}
              {event.type === 'game' && <Play size={16} />}
            </div>
            <div className="timeline-content">
              <div className="timeline-header">
                <span className="timeline-time">{event.time}</span>
                <span className="timeline-event-type">{event.event}</span>
              </div>
              <div className="timeline-details">
                <span className="timeline-player">{event.player}</span>
                <span className="timeline-description">{event.description}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderHighlights = () => (
    <div className="match-highlights">
      <div className="highlights-grid">
        {highlights.map((highlight) => (
          <div key={highlight.id} className="highlight-card">
            <div className="highlight-header">
              <div className="highlight-type">
                {highlight.type === 'ace' && <Zap size={20} />}
                {highlight.type === 'winner' && <Star size={20} />}
                {highlight.type === 'break_point' && <Target size={20} />}
                {highlight.type === 'rally' && <Activity size={20} />}
                {highlight.type === 'comeback' && <TrendingUp size={20} />}
              </div>
              <span className="highlight-timestamp">{highlight.timestamp}</span>
            </div>
            <div className="highlight-content">
              <h4 className="highlight-title">{highlight.title}</h4>
              <p className="highlight-description">{highlight.description}</p>
            </div>
            <div className="highlight-actions">
              <button className="highlight-play-btn">
                <Play size={16} />
                Watch Clip
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!opponent) return null;

  return (
    <div className="match-details-page">
      <div className="match-details-container">
        {/* Header */}
        <div className="match-details-header">
          <button onClick={onBack} className="match-details-back-btn">
            <ArrowLeft size={20} />
          </button>
          
          <div className="match-details-title-section">
            <h1 className="match-details-title">
              {user?.name} vs {opponent.name}
            </h1>
            <div 
              className="match-details-status"
              style={{ 
                backgroundColor: `${getStatusColor(match.status)}20`,
                color: getStatusColor(match.status)
              }}
            >
              {getStatusText(match.status)}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="match-details-tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`match-details-tab ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <Trophy size={16} />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`match-details-tab ${activeTab === 'statistics' ? 'active' : ''}`}
          >
            <BarChart3 size={16} />
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`match-details-tab ${activeTab === 'timeline' ? 'active' : ''}`}
          >
            <Clock size={16} />
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('highlights')}
            className={`match-details-tab ${activeTab === 'highlights' ? 'active' : ''}`}
          >
            <Star size={16} />
            Highlights
          </button>
        </div>

        {/* Tab Content */}
        <div className="match-details-content">
          {isLoading ? (
            <div className="match-details-loading">
              <div className="loading-spinner"></div>
              <p>Loading match data...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'statistics' && renderStatistics()}
              {activeTab === 'timeline' && renderTimeline()}
              {activeTab === 'highlights' && renderHighlights()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchDetailsPage;