// src/components/Leaderboard.js
import React, { useState } from 'react';
import { Trophy, Medal, Award, ChevronDown, ChevronUp, User, Leaf, BarChart2, MessageSquare } from 'lucide-react';

const Leaderboard = ({ ranking, language = 'it', currentParticipantId = null }) => {
  const [expandedId, setExpandedId] = useState(null);
  const currentRef = React.useRef(null);

  // Auto-scroll to current participant after render
  React.useEffect(() => {
    if (currentRef.current) {
      setTimeout(() => {
        currentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [ranking, currentParticipantId]);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy size={20} color="#FFD700" />;
    if (rank === 2) return <Medal size={20} color="#C0C0C0" />;
    if (rank === 3) return <Medal size={20} color="#CD7F32" />;
    return <Award size={18} color="#9ca3af" />;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return '#9ca3af';
  };

  const getScoreBackground = (index) => {
    if (index === 0) return 'linear-gradient(135deg, #fcd34d, #f59e0b)';
    if (index === 1) return 'linear-gradient(135deg, #e5e7eb, #9ca3af)';
    if (index === 2) return 'linear-gradient(135deg, #fed7aa, #ea580c)';
    return 'linear-gradient(135deg, #c7d2fe, #6366f1)';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getParticipantData = (participant) => {
    const rawData = participant.participant?.data || participant.data || {};
    return rawData.data || rawData;
  };

  const getProfile = (participant) => {
    const data = getParticipantData(participant);
    if (typeof data.profile === 'string') {
      return JSON.parse(data.profile);
    }
    return data.profile || participant.profile || {};
  };

  const getDisplayName = (participant) => {
    const data = getParticipantData(participant);
    if (data.nickname && data.nickname.trim()) {
      return data.nickname.trim();
    }
    return `${language === 'it' ? 'Partecipante' : 'Participant'} N.${participant.id}`;
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const DetailSection = ({ icon, title, children }) => (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px', 
        marginBottom: '6px',
        color: '#667eea',
        fontWeight: '600',
        fontSize: '0.85rem'
      }}>
        {icon}
        <span>{title}</span>
      </div>
      <div style={{ 
        background: '#f9fafb', 
        borderRadius: '8px', 
        padding: '10px',
        fontSize: '0.85rem'
      }}>
        {children}
      </div>
    </div>
  );

  const DataRow = ({ label, value }) => (
    value ? (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '4px 0', 
        borderBottom: '1px solid #e5e7eb',
        fontSize: '0.75rem',
        gap: '8px'
      }}>
        <span style={{ color: '#6b7280', minWidth: '35%', flexShrink: 0 }}>{label}</span>
        <span style={{ 
          fontWeight: '500', 
          textAlign: 'right', 
          wordBreak: 'break-word', 
          lineHeight: '1.3',
          maxWidth: '65%'
        }}>{value}</span>
      </div>
    ) : null
  );

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '12px',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      {/* Pulse animation for current user highlight */}
      {currentParticipantId && (
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}</style>
      )}
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        flexWrap: 'wrap'
      }}>
        <Trophy size={20} color="#667eea" />
        <h2 style={{
          fontSize: '1.1rem',
          fontWeight: 'bold',
          color: '#667eea',
          margin: 0,
          lineHeight: '1.3'
        }}>
          {language === 'it' ? 'Classifica Generale' : 'Leaderboard'}
        </h2>
      </div>

      {ranking.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', padding: '24px' }}>
          {language === 'it' 
            ? 'Nessun partecipante ancora. Sii il primo!'
            : 'No participants yet. Be the first!'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ranking.map((participant, index) => {
            const profile = getProfile(participant);
            const displayName = getDisplayName(participant);
            const data = getParticipantData(participant);
            const isExpanded = expandedId === participant.id;
            const isCurrentUser = currentParticipantId && participant.id === currentParticipantId;
            
            return (
              <div key={participant.id} ref={isCurrentUser ? currentRef : null}>
                {/* "Tu sei qui" label for current user */}
                {isCurrentUser && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginBottom: '6px',
                    padding: '4px 12px',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    borderRadius: '20px',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                    animation: 'pulse 2s infinite'
                  }}>
                    📍 {language === 'it' ? 'SEI QUI' : 'YOU ARE HERE'}
                  </div>
                )}
                {/* Main Card */}
                <div
                  onClick={() => toggleExpand(participant.id)}
                  style={{
                    padding: '12px',
                    background: isCurrentUser
                      ? 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)'
                      : index < 3 
                        ? `linear-gradient(135deg, ${getRankColor(participant.rank)}20 0%, ${getRankColor(participant.rank)}08 100%)`
                        : '#fafafa',
                    border: isCurrentUser 
                      ? '3px solid #667eea' 
                      : index < 3 ? `2px solid ${getRankColor(participant.rank)}` : '1px solid #e5e7eb',
                    borderRadius: isExpanded ? '12px 12px 0 0' : '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isCurrentUser ? '0 4px 16px rgba(102, 126, 234, 0.3)' : 'none'
                  }}
                >
                  {/* Top row: Rank + Name + Score - Mobile optimized */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '6px',
                    flexWrap: 'wrap'
                  }}>
                    {/* Rank badge */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      minWidth: '45px'
                    }}>
                      {getRankIcon(participant.rank)}
                      <span style={{
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        color: getRankColor(participant.rank)
                      }}>
                        #{participant.rank}
                      </span>
                    </div>

                    {/* Name - takes remaining space, mobile friendly */}
                    <div style={{
                      flex: 1,
                      minWidth: '120px', // Minimum width for readability
                      fontSize: '0.9rem',
                      fontWeight: isCurrentUser ? '700' : '600',
                      color: isCurrentUser ? '#667eea' : '#1f2937',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: '1.3'
                    }}>
                      {displayName} {isCurrentUser && <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({language === 'it' ? 'Tu' : 'You'})</span>}
                    </div>

                    {/* Score badge - responsive */}
                    <div style={{
                      background: getScoreBackground(index),
                      color: 'white',
                      padding: '5px 10px',
                      borderRadius: '16px',
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '1px',
                      minWidth: '50px',
                      justifyContent: 'center'
                    }}>
                      {participant.totalScore}
                      <span style={{ fontSize: '0.65rem', fontWeight: '500' }}>pt</span>
                    </div>

                    {/* Expand arrow */}
                    <div style={{ 
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {isExpanded 
                        ? <ChevronUp size={18} color="#667eea" /> 
                        : <ChevronDown size={18} color="#9ca3af" />
                      }
                    </div>
                  </div>

                  {/* Bottom row: Details - Mobile responsive */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    fontSize: '0.7rem',
                    color: '#6b7280',
                    paddingLeft: '48px',
                    lineHeight: '1.3'
                  }}>
                    {profile.age && (
                      <span>{profile.age} {language === 'it' ? 'anni' : 'y/o'}</span>
                    )}
                    {profile.gender && (
                      <span>• {profile.gender}</span>
                    )}
                    {profile.profession && (
                      <span>• {profile.profession.length > 15 ? profile.profession.substring(0, 15) + '...' : profile.profession}</span>
                    )}
                    <span style={{ color: '#9ca3af' }}>
                      • {formatDate(participant.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{
                    padding: '12px',
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderTop: 'none',
                    borderRadius: '0 0 12px 12px'
                  }}>
                    {/* Profile */}
                    <DetailSection icon={<User size={16} />} title={language === 'it' ? 'Profilo' : 'Profile'}>
                      <DataRow label={language === 'it' ? 'Età' : 'Age'} value={profile.age} />
                      <DataRow label={language === 'it' ? 'Genere' : 'Gender'} value={profile.gender} />
                      <DataRow label={language === 'it' ? 'Professione' : 'Profession'} value={profile.profession} />
                      <DataRow label={language === 'it' ? 'Consumo F&V' : 'F&V Consumption'} value={profile.consumption} />
                      <DataRow label={language === 'it' ? 'Canale acquisto' : 'Purchase Channel'} value={profile.purchaseChannel} />
                      <DataRow label={language === 'it' ? 'Sostenibilità' : 'Sustainability'} value={profile.sustainability} />
                      <DataRow label={language === 'it' ? 'Lettura etichette' : 'Label Reading'} value={profile.labelReading} />
                    </DetailSection>

                    {/* Product */}
                    {data.product && (
                      <DetailSection icon={<Leaf size={16} />} title={language === 'it' ? 'Prodotto Analizzato' : 'Analyzed Product'}>
                        <DataRow label={language === 'it' ? 'Nome' : 'Name'} value={data.product.name} />
                        <DataRow label={language === 'it' ? 'Categoria' : 'Category'} value={data.product.category} />
                        <DataRow label="Emoji" value={data.product.emoji} />
                        <DataRow label={language === 'it' ? 'Confidenza' : 'Confidence'} value={data.product.confidence} />
                      </DetailSection>
                    )}

                    {/* SCIO Results */}
                    {data.scioResults && (
                      <DetailSection icon={<BarChart2 size={16} />} title={language === 'it' ? 'Risultati Spettrometro' : 'Spectrometer Results'}>
                        <DataRow label="Brix" value={data.scioResults.brix} />
                        <DataRow label={language === 'it' ? 'Calorie' : 'Calories'} value={data.scioResults.calories ? `${data.scioResults.calories} kcal per 100 g` : null} />
                        <DataRow label={language === 'it' ? 'Carboidrati' : 'Carbs'} value={data.scioResults.carbs ? `${data.scioResults.carbs}g` : null} />
                        <DataRow label={language === 'it' ? 'Zuccheri' : 'Sugar'} value={data.scioResults.sugar ? `${data.scioResults.sugar}g` : null} />
                        <DataRow label={language === 'it' ? 'Acqua' : 'Water'} value={data.scioResults.water ? `${data.scioResults.water}%` : null} />
                        <DataRow label={language === 'it' ? 'Proteine' : 'Protein'} value={data.scioResults.protein ? `${data.scioResults.protein}g` : null} />
                        <DataRow label={language === 'it' ? 'Fibre' : 'Fiber'} value={data.scioResults.fiber ? `${data.scioResults.fiber}g` : null} />
                        <DataRow label={language === 'it' ? 'Metodo' : 'Method'} value={data.scanMethod} />
                      </DetailSection>
                    )}

                    {/* Feedback */}
                    {data.feedback && (
                      <DetailSection icon={<MessageSquare size={16} />} title="Feedback">
                        <DataRow label={language === 'it' ? 'Differenze trovate' : 'Found Differences'} value={data.feedback.foundDifferences} />
                        <DataRow label={language === 'it' ? 'Spiegazione' : 'Explanation'} value={data.feedback.differenceExplanation} />
                        <DataRow label={language === 'it' ? 'Utilità spettrometro' : 'Spectrometer Useful'} value={data.feedback.spectrometerUseful ? `${data.feedback.spectrometerUseful}/5` : null} />
                        <DataRow label={language === 'it' ? 'Rating' : 'Rating'} value={data.feedback.overallRating ? `${'⭐'.repeat(data.feedback.overallRating)}` : null} />
                        {data.feedback.comments && (
                          <div style={{ marginTop: '6px', fontStyle: 'italic', color: '#4b5563', fontSize: '0.8rem' }}>
                            "{data.feedback.comments}"
                          </div>
                        )}
                      </DetailSection>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Footer - Mobile optimized */}
      {ranking.length > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '10px',
          background: '#f3f4f6',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-around',
          textAlign: 'center',
          gap: '8px'
        }}>
          <div style={{ flex: 1, minWidth: '70px' }}>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
              {language === 'it' ? 'Partecipanti' : 'Participants'}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#667eea' }}>
              {ranking.length}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '70px' }}>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
              {language === 'it' ? 'Punti medi' : 'Avg score'}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#667eea' }}>
              {(ranking.reduce((sum, p) => sum + p.totalScore, 0) / ranking.length).toFixed(0)}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '70px' }}>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
              {language === 'it' ? 'Punti max' : 'Top score'}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>
              {ranking[0].totalScore}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
