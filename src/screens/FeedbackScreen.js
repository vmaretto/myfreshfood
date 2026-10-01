// src/screens/FeedbackScreen.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { trackEvent } from '../utils/analytics';
import SwitchLayout, { SWITCH_COLORS } from '../components/SwitchLayout';
import { getFlowMode, isSpectrometerFlow } from '../utils/flowMode';
import GlobalProgress from '../components/GlobalProgress';
import { generateRanking, findParticipantRank } from '../utils/rankingUtils';

function FeedbackScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const language = i18n.language || 'it';
  
  const [feedback, setFeedback] = useState({
    foundDifferences: null,
    differenceExplanation: '',
    spectrometerUseful: null,
    discoveredNew: null,
    overallRating: 0,
    comments: ''
  });
  
  const spectrometerFlow = isSpectrometerFlow();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ranking, setRanking] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleStarClick = (rating) => {
    setFeedback(prev => ({ ...prev, overallRating: rating }));
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called, rating:', feedback.overallRating);
    
    if (feedback.overallRating === 0) {
      alert(language === 'it' ? 'Per favore dai una valutazione' : 'Please rate your experience');
      return;
    }

    setSubmitting(true);
    
    try {
      trackEvent('feedback_submitted', {
        found_differences: feedback.foundDifferences,
        spectrometer_useful: feedback.spectrometerUseful,
        overall_rating: feedback.overallRating
      });

      const results = JSON.parse(sessionStorage.getItem('scioResults') || '{}');
      const recognizedProduct = JSON.parse(sessionStorage.getItem('recognizedProduct') || '{}');
      const scanMethod = sessionStorage.getItem('scanMethod') || 'unknown';
      const profileData = JSON.parse(sessionStorage.getItem('profileData') || '{}');
      const quizResults = JSON.parse(sessionStorage.getItem('quizAnswers') || 'null');

      // Timeout di 10 secondi per l'invio
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const existingId = sessionStorage.getItem('participantId');
      const fullData = {
        type: 'complete_session',
        language: localStorage.getItem('language') || 'it',
        data: {
          profile: profileData,
          product: recognizedProduct,
          scioResults: spectrometerFlow ? results : null,
          scanMethod: spectrometerFlow ? scanMethod : null,
          feedback: feedback,
          flowMode: getFlowMode(),
          quizResults: quizResults
        }
      };
      
      // If participant already created (from quiz), UPDATE it; otherwise CREATE
      const url = existingId ? `/api/participants?id=${existingId}` : '/api/participants';
      const method = existingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(fullData)
      });
      
      clearTimeout(timeoutId);

      console.log('API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('API result:', result);
        
        // Save participant ID for display in ResultsScreen
        if (result.id) {
          sessionStorage.setItem('participantId', result.id.toString());
        }
        
        try {
          const rankingResponse = await fetch('/api/participants');
          if (rankingResponse.ok) {
            const allParticipants = await rankingResponse.json();
            // Use the same ranking algorithm as Dashboard/Leaderboard
            const rankedData = generateRanking(allParticipants);
            const position = findParticipantRank(result.id, rankedData);
            const myEntry = rankedData.find(p => p.id === result.id);
            setRanking({ 
              position: position || 0, 
              total: allParticipants.length, 
              score: myEntry?.totalScore || 0 
            });
          }
        } catch (e) {
          console.error('Error fetching ranking:', e);
        }
        
        setSubmitted(true);
        // No auto-redirect - let user click "Vedi Classifica Completa"
      } else {
        // Response not OK - still show success to not block user
        console.error('API response not OK:', response.status);
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Anche in caso di errore, mostra il messaggio di successo
      // per non bloccare l'utente
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SwitchLayout 
        title={language === 'it' ? 'Grazie!' : 'Thank You!'} 
        subtitle={language === 'it' ? 'Il tuo feedback è stato registrato' : 'Your feedback has been recorded'}
      >
        <GlobalProgress currentStep="feedback" language={language} />
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
          <h2 style={{ color: SWITCH_COLORS.green, marginBottom: '16px' }}>
            {t('feedback.thankYou')}
          </h2>
          
          {/* Participant ID */}
          {sessionStorage.getItem('participantId') && (
            <div style={{
              background: '#f0f4ff',
              borderRadius: '12px',
              padding: '14px 20px',
              margin: '16px 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: `2px solid ${SWITCH_COLORS.darkBlue}30`
            }}>
              <span style={{ fontSize: '1rem' }}>📋</span>
              <span style={{ fontSize: '0.9rem', color: '#555' }}>
                {language === 'it' ? 'Il tuo identificativo:' : 'Your ID:'}
              </span>
              <span style={{ 
                fontSize: '1.2rem', 
                fontWeight: 'bold', 
                color: SWITCH_COLORS.darkBlue 
              }}>
                N. {sessionStorage.getItem('participantId')}
              </span>
            </div>
          )}

          {/* Leaderboard Position */}
          {ranking && ranking.position > 0 && (
            <div style={{
              background: `linear-gradient(135deg, ${SWITCH_COLORS.darkBlue} 0%, #2d4a6f 100%)`,
              borderRadius: '16px',
              padding: '20px',
              margin: '8px 0 20px 0',
              color: 'white'
            }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>
                {language === 'it' ? '🏆 La tua posizione in classifica' : '🏆 Your leaderboard position'}
              </div>
              <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
                {ranking.position}°
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                {language === 'it' 
                  ? `su ${ranking.total} partecipanti` 
                  : `out of ${ranking.total} participants`}
              </div>
              {ranking.score > 0 && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '20px',
                  display: 'inline-block'
                }}>
                  {ranking.score} {language === 'it' ? 'punti' : 'points'}
                </div>
              )}
            </div>
          )}
          
          <p style={{ color: '#666' }}>
            {t('feedback.thankYouMessage')}
          </p>
          
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              marginTop: '20px',
              padding: '14px 28px',
              background: SWITCH_COLORS.darkBlue,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            {language === 'it' ? '📊 Vedi Classifica Completa' : '📊 View Full Leaderboard'}
          </button>
        </div>
      </SwitchLayout>
    );
  }

  return (
    <SwitchLayout 
      title={`📝 ${t('feedback.title')}`}
      subtitle={language === 'it' ? 'Aiutaci a migliorare' : 'Help us improve'}
      compact={true}
    >
      <GlobalProgress currentStep="feedback" language={language} />

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'transparent',
          border: `1px solid ${SWITCH_COLORS.darkBlue}`,
          color: SWITCH_COLORS.darkBlue,
          cursor: 'pointer',
          padding: '8px 12px',
          fontSize: '0.9rem',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          alignSelf: 'flex-start',
          marginBottom: '16px',
          minHeight: '36px',
          fontWeight: '500'
        }}
      >
        ← {language === 'it' ? 'Indietro' : 'Back'}
      </button>
      
      {/* Percorso senza spettrometro: domanda sulla scoperta al posto di quelle sullo spettrometro */}
      {!spectrometerFlow && (
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: SWITCH_COLORS.darkBlue }}>
            {language === 'it' ? 'Hai scoperto qualcosa di nuovo su questo piatto?' : 'Did you discover something new about this dish?'}
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['yes', 'somewhat', 'no'].map(option => (
              <button
                key={option}
                onClick={() => setFeedback(prev => ({ ...prev, discoveredNew: option }))}
                style={{
                  flex: 1,
                  minWidth: '80px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: feedback.discoveredNew === option ? `2px solid ${SWITCH_COLORS.green}` : '2px solid #ddd',
                  background: feedback.discoveredNew === option ? '#e8f5e9' : '#fff',
                  color: feedback.discoveredNew === option ? SWITCH_COLORS.green : '#666',
                  cursor: 'pointer',
                  fontWeight: feedback.discoveredNew === option ? 'bold' : 'normal'
                }}
              >
                {t(`feedback.option_${option}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Question 1: Found differences? */}
      {spectrometerFlow && <div style={{ marginBottom: '24px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '12px', 
          fontWeight: 'bold',
          color: SWITCH_COLORS.darkBlue
        }}>
          {t('feedback.q1_differences')}
        </label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['yes', 'somewhat', 'no'].map(option => (
            <button
              key={option}
              onClick={() => setFeedback(prev => ({ ...prev, foundDifferences: option }))}
              style={{
                flex: 1,
                minWidth: '80px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: feedback.foundDifferences === option ? `2px solid ${SWITCH_COLORS.green}` : '2px solid #ddd',
                background: feedback.foundDifferences === option ? '#e8f5e9' : '#fff',
                color: feedback.foundDifferences === option ? SWITCH_COLORS.green : '#666',
                cursor: 'pointer',
                fontWeight: feedback.foundDifferences === option ? 'bold' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              {t(`feedback.option_${option}`)}
            </button>
          ))}
        </div>
      </div>}

      {/* Question 2: How do you explain differences? (conditional) */}
      {spectrometerFlow && feedback.foundDifferences && feedback.foundDifferences !== 'no' && (
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '12px', 
            fontWeight: 'bold',
            color: SWITCH_COLORS.darkBlue
          }}>
            {t('feedback.q2_explanation')}
          </label>
          <textarea
            value={feedback.differenceExplanation}
            onChange={(e) => setFeedback(prev => ({ ...prev, differenceExplanation: e.target.value }))}
            placeholder={t('feedback.explanation_placeholder')}
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #ddd',
              fontSize: '1rem',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>
      )}

      {/* Question 3: Spectrometer useful? */}
      {spectrometerFlow && <div style={{ marginBottom: '24px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '12px', 
          fontWeight: 'bold',
          color: SWITCH_COLORS.darkBlue
        }}>
          {t('feedback.q3_spectrometer')}
        </label>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
          {[1, 2, 3, 4, 5].map(value => (
            <button
              key={value}
              onClick={() => setFeedback(prev => ({ ...prev, spectrometerUseful: value }))}
              style={{
                flex: 1,
                padding: '16px 8px',
                borderRadius: '8px',
                border: feedback.spectrometerUseful === value ? `2px solid ${SWITCH_COLORS.green}` : '2px solid #ddd',
                background: feedback.spectrometerUseful === value ? '#e8f5e9' : '#fff',
                color: feedback.spectrometerUseful === value ? SWITCH_COLORS.green : '#666',
                cursor: 'pointer',
                fontWeight: feedback.spectrometerUseful === value ? 'bold' : 'normal',
                fontSize: '1.1rem',
                transition: 'all 0.2s'
              }}
            >
              {value}
            </button>
          ))}
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '0.75rem', 
          color: '#999',
          marginTop: '8px',
          padding: '0 4px'
        }}>
          <span>{t('feedback.not_useful')}</span>
          <span>{t('feedback.very_useful')}</span>
        </div>
      </div>}

      {/* Question 4: Overall rating with stars */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '12px', 
          fontWeight: 'bold',
          color: SWITCH_COLORS.darkBlue
        }}>
          {t('feedback.q4_rating')}
        </label>
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          justifyContent: 'center',
          padding: '16px 0'
        }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => handleStarClick(star)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '2.5rem',
                padding: '4px',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              {star <= feedback.overallRating ? '⭐' : '☆'}
            </button>
          ))}
        </div>
      </div>

      {/* Question 5: Additional comments */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '12px', 
          fontWeight: 'bold',
          color: SWITCH_COLORS.darkBlue
        }}>
          {t('feedback.q5_comments')}
        </label>
        <textarea
          value={feedback.comments}
          onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
          placeholder={t('feedback.comments_placeholder')}
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '12px',
            borderRadius: '8px',
            border: '2px solid #ddd',
            fontSize: '1rem',
            resize: 'vertical',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '1.1rem',
          fontWeight: '600',
          color: 'white',
          background: SWITCH_COLORS.green,
          border: 'none',
          borderRadius: '12px',
          cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.7 : 1,
          boxShadow: `0 4px 12px ${SWITCH_COLORS.green}50`
        }}
      >
        {submitting ? t('feedback.submitting') : t('feedback.submit')}
      </button>

      {/* Skip button */}
      <button
        onClick={() => {
          sessionStorage.clear();
          navigate('/');
        }}
        style={{
          background: 'none',
          border: 'none',
          color: '#999',
          cursor: 'pointer',
          fontSize: '0.9rem',
          marginTop: '16px',
          width: '100%'
        }}
      >
        {t('feedback.skip')}
      </button>
    </SwitchLayout>
  );
}

export default FeedbackScreen;
