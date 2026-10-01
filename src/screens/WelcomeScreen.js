// src/screens/WelcomeScreen.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SwitchLayout, { SWITCH_COLORS } from '../components/SwitchLayout';

function WelcomeScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const language = i18n.language || 'it';

  const handleStart = () => {
    navigate('/profile');
  };

  // Nuovo flusso a 6 step
  const steps = language === 'it' ? [
    { icon: '👤', text: 'Compila il tuo profilo' },
    { icon: '📸', text: 'Fotografa un alimento o un piatto' },
    { icon: '🧠', text: 'Stima i valori nel quiz' },
    { icon: '🌍', text: 'Scopri impatto, ingredienti e storia' },
    { icon: '📊', text: 'Confronta percezione vs realtà' },
    { icon: '⭐', text: 'Dai il tuo feedback' }
  ] : [
    { icon: '👤', text: 'Complete your profile' },
    { icon: '📸', text: 'Take a photo of a food or a dish' },
    { icon: '🧠', text: 'Estimate values in quiz' },
    { icon: '🌍', text: 'Discover impact, ingredients and history' },
    { icon: '📊', text: 'Compare perception vs reality' },
    { icon: '⭐', text: 'Give your feedback' }
  ];

  return (
    <SwitchLayout 
      title={`🥬 ${t('welcome.title')}`}
      subtitle={t('welcome.subtitle')}
    >
      <h3 style={{ 
        marginBottom: '20px',
        color: SWITCH_COLORS.darkBlue,
        fontSize: '1.1rem'
      }}>
        {t('welcome.howItWorks')}
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {steps.map((step, idx) => (
          <div key={idx} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '14px',
            padding: '10px 12px',
            background: SWITCH_COLORS.lightBg,
            borderRadius: '12px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: SWITCH_COLORS.gold,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              flexShrink: 0
            }}>
              {step.icon}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ 
                color: '#999', 
                fontSize: '0.75rem',
                display: 'block',
                marginBottom: '2px'
              }}>
                {language === 'it' ? `Passo ${idx + 1}` : `Step ${idx + 1}`}
              </span>
              <span style={{ 
                color: SWITCH_COLORS.darkBlue,
                fontSize: '0.9rem'
              }}>
                {step.text}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p style={{ 
        fontSize: '0.8rem', 
        color: '#888', 
        marginTop: '20px',
        marginBottom: '20px',
        lineHeight: '1.5',
        textAlign: 'center'
      }}>
        {t('welcome.privacy')}
      </p>

      <button 
        onClick={handleStart}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '1.1rem',
          fontWeight: '600',
          color: 'white',
          background: SWITCH_COLORS.green,
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          boxShadow: `0 4px 12px ${SWITCH_COLORS.green}50`
        }}
      >
        {t('welcome.start')} →
      </button>
    </SwitchLayout>
  );
}

export default WelcomeScreen;
