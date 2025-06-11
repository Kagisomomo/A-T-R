import React from 'react';
import { Calendar, MapPin, Trophy, Clock, Target } from 'lucide-react';
import { Match } from '../types';
import { UserService } from '../services/UserService';

interface MatchCardProps {
  match: Match;
  currentUserId: string;
  onReportScore: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, currentUserId, onReportScore }) => {
  const opponent = UserService.getPlayerById(
    match.challengerId === currentUserId ? match.challengedId : match.challengerId
  );
  
  const isChallenger = match.challengerId === currentUserId;
  const matchDate = new Date(match.date);
  const isCompleted = match.status === 'completed';
  
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

  if (!opponent) return null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="player-avatar text-sm">
            {opponent.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-standard)' }}>
              vs {opponent.name}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>
              {isChallenger ? 'You challenged' : 'Challenged you'}
            </p>
          </div>
        </div>
        <div 
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ 
            backgroundColor: `${getStatusColor(match.status)}20`,
            color: getStatusColor(match.status)
          }}
        >
          {getStatusText(match.status)}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-subtle)' }}>
          <Calendar size={14} />
          <span>{matchDate.toLocaleDateString()} at {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-subtle)' }}>
          <MapPin size={14} />
          <span>{match.location}</span>
        </div>
      </div>

      {isCompleted && match.challengerScore !== undefined && match.challengedScore !== undefined && (
        <div className="border-t pt-4 mb-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <div className="text-sm" style={{ color: 'var(--text-subtle)' }}>Final Score:</div>
            <div className="font-mono font-bold" style={{ color: 'var(--text-standard)' }}>
              {isChallenger 
                ? `${match.challengerScore} - ${match.challengedScore}`
                : `${match.challengedScore} - ${match.challengerScore}`
              }
            </div>
          </div>
          {match.winner && (
            <div className="text-center mt-2">
              <span 
                className="inline-flex items-center gap-1 text-sm font-medium"
                style={{ color: match.winner === currentUserId ? 'var(--success-green)' : 'var(--error-pink)' }}
              >
                <Trophy size={14} />
                {match.winner === currentUserId ? 'You Won!' : 'You Lost'}
              </span>
            </div>
          )}
        </div>
      )}

      {match.status === 'pending' && (
        <button
          onClick={onReportScore}
          className="btn btn-secondary btn-glare w-full"
        >
          <Target size={16} />
          Report Score
        </button>
      )}
    </div>
  );
};

export default MatchCard;