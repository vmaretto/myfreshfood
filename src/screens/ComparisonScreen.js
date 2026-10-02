// src/screens/ComparisonScreen.js - Confronto Stima vs Misurato vs DB SWITCH
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, TrendingUp, TrendingDown, Minus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import SwitchLayout, { SWITCH_COLORS } from '../components/SwitchLayout';
import { isSpectrometerFlow } from '../utils/flowMode';
import GlobalProgress from '../components/GlobalProgress';
import { getUnitLabels, getSwitchReference } from '../utils/units';

// Componente per riga di confronto a 3 colonne
const ComparisonRow = ({ label, icon, userEstimate, measured, dbSwitch, unit, language, hideMeasured, digits = 1, localeFormat = false }) => {
  // Calcola scarto percentuale
  const calculateDeviation = (estimate, reference) => {
    if (!reference || reference === 0 || estimate === null || estimate === undefined) return null;
    return ((estimate - reference) / reference * 100);
  };
  
  // Punteggio e icona basati SOLO su DB SWITCH (valuta la conoscenza)
  // SCIO è solo informativo
  const deviationFromDb = dbSwitch !== null && dbSwitch !== undefined 
    ? calculateDeviation(userEstimate, dbSwitch) 
    : null;
  
  const absDeviation = deviationFromDb !== null ? Math.abs(deviationFromDb) : null;
  
  // Per la visualizzazione della % usa il riferimento principale (misurato se c'è, altrimenti DB)
  const referenceValue = measured ?? dbSwitch;
  const deviation = referenceValue ? calculateDeviation(userEstimate, referenceValue) : null;
  
  // Determina stato (vicino/medio/lontano) - basato sul MIGLIORE dei due confronti
  const getStatus = () => {
    if (absDeviation === null) return 'unknown';
    if (absDeviation <= 15) return 'accurate';
    if (absDeviation <= 35) return 'medium';
    return 'far';
  };
  
  // Calcola punteggio per questa metrica (stessa logica del quiz)
  const getMetricScore = () => {
    if (absDeviation === null) return null;
    if (absDeviation <= 10) return 100;
    if (absDeviation <= 20) return 80;
    if (absDeviation <= 35) return 60;
    if (absDeviation <= 50) return 40;
    return 20;
  };
  
  const metricScore = getMetricScore();
  
  const status = getStatus();
  
  const statusConfig = {
    accurate: { icon: <CheckCircle size={20} />, color: '#10b981', bg: '#d1fae5' },
    medium: { icon: <AlertCircle size={20} />, color: '#f59e0b', bg: '#fef3c7' },
    far: { icon: <XCircle size={20} />, color: '#ef4444', bg: '#fee2e2' },
    unknown: { icon: <Minus size={20} />, color: '#9ca3af', bg: '#f3f4f6' }
  };
  
  const config = statusConfig[status];
  
  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      // Piatti: stesso formato della scheda piatto (separatore italiano delle migliaia)
      if (localeFormat) {
        return value.toLocaleString(language === 'en' ? 'en-US' : 'it-IT', { minimumFractionDigits: digits, maximumFractionDigits: digits });
      }
      return value.toFixed(digits);
    }
    return value;
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
      border: `2px solid ${config.color}20`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>{icon}</span>
          <span style={{ fontWeight: '600', color: SWITCH_COLORS.darkBlue }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {metricScore !== null && (
            <span style={{ 
              fontSize: '0.85rem', 
              fontWeight: 'bold',
              color: config.color,
              background: config.bg,
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              {metricScore} pt
            </span>
          )}
          <div style={{ color: config.color }}>{config.icon}</div>
        </div>
      </div>
      
      {/* 3 colonne */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: hideMeasured ? '1fr 1fr' : '1fr 1fr 1fr',
        gap: '8px',
        textAlign: 'center'
      }}>
        {/* Stima Utente */}
        <div style={{
          padding: '10px 6px',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '4px' }}>
            {language === 'it' ? 'Tua Stima' : 'Your Estimate'}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: SWITCH_COLORS.darkBlue }}>
            {formatValue(userEstimate)}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{unit}</div>
        </div>
        
        {/* Misurato (SCIO) */}
        {!hideMeasured && <div style={{
          padding: '10px 6px',
          background: measured !== null && measured !== undefined ? '#dbeafe' : '#f1f5f9',
          borderRadius: '8px',
          border: `1px solid ${measured !== null && measured !== undefined ? '#3b82f6' : '#e2e8f0'}`
        }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '4px' }}>
            {language === 'it' ? 'Misurato' : 'Measured'}
          </div>
          <div style={{ 
            fontSize: '1.1rem', 
            fontWeight: 'bold', 
            color: measured !== null && measured !== undefined ? '#1d4ed8' : '#9ca3af'
          }}>
            {formatValue(measured)}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{unit}</div>
        </div>}
        
        {/* DB SWITCH */}
        <div style={{
          padding: '10px 6px',
          background: dbSwitch !== null && dbSwitch !== undefined ? '#dcfce7' : '#f1f5f9',
          borderRadius: '8px',
          border: `1px solid ${dbSwitch !== null && dbSwitch !== undefined ? '#22c55e' : '#e2e8f0'}`
        }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '4px' }}>
            DB SWITCH
          </div>
          <div style={{ 
            fontSize: '1.1rem', 
            fontWeight: 'bold', 
            color: dbSwitch !== null && dbSwitch !== undefined ? '#15803d' : '#9ca3af'
          }}>
            {formatValue(dbSwitch)}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{unit}</div>
        </div>
      </div>
      
      {/* Scarto % */}
      {deviation !== null && (
        <div style={{
          marginTop: '10px',
          padding: '6px 12px',
          background: config.bg,
          borderRadius: '6px',
          textAlign: 'center',
          fontSize: '0.8rem',
          fontWeight: '500',
          color: config.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px'
        }}>
          {deviation > 5 ? <TrendingUp size={14} /> : deviation < -5 ? <TrendingDown size={14} /> : <Minus size={14} />}
          {deviation > 0 ? '+' : ''}{deviation.toFixed(0)}% {language === 'it' ? 'rispetto al riferimento' : 'vs reference'}
        </div>
      )}
    </div>
  );
};

export default function ComparisonScreen() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const language = i18n.language || 'it';
  
  const [quizAnswers, setQuizAnswers] = useState(null);
  const [scioData, setScioData] = useState(null);
  const [switchData, setSwitchData] = useState(null);
  const [recognizedProduct, setRecognizedProduct] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Carica dati da sessionStorage
    const storedQuiz = sessionStorage.getItem('quizAnswers');
    const storedScio = sessionStorage.getItem('scioResults');
    const storedScioScan = sessionStorage.getItem('scioScanData');
    const storedSwitch = sessionStorage.getItem('switchData');
    const storedProduct = sessionStorage.getItem('recognizedProduct');
    
    if (storedQuiz) setQuizAnswers(JSON.parse(storedQuiz));
    if (!isSpectrometerFlow()) {
      // Percorso senza spettrometro: confronto solo con SWITCH
    } else if (storedScioScan) {
      const scanData = JSON.parse(storedScioScan);
      setScioData(scanData.nutrition || scanData);
    } else if (storedScio) {
      setScioData(JSON.parse(storedScio));
    }
    if (storedSwitch) setSwitchData(JSON.parse(storedSwitch));
    if (storedProduct) setRecognizedProduct(JSON.parse(storedProduct));
  }, []);

  // Calcola punteggio totale: stima vs DB SWITCH (valuta la conoscenza)
  // SCIO è solo informativo, non influenza il punteggio
  const calculateScore = () => {
    if (!quizAnswers?.answers) return null;
    
    const answers = quizAnswers.answers;
    let totalScore = 0;
    let count = 0;
    
    // Stessa base del quiz: porzione per i piatti, 100 g / 1 kg per i prodotti
    const metrics = ['calories', 'carbs', 'protein', 'co2', 'waterFootprint']
      .map((key) => ({ key, db: switchRef[key] }));
    
    const getScore = (deviation) => {
      if (deviation <= 10) return 100;
      if (deviation <= 20) return 80;
      if (deviation <= 35) return 60;
      if (deviation <= 50) return 40;
      return 20;
    };
    
    metrics.forEach(({ key, db }) => {
      const estimate = answers[key];
      if (estimate === undefined || db === null || db === undefined || db === 0) return;
      
      const deviation = Math.abs((estimate - db) / db * 100);
      totalScore += getScore(deviation);
      count++;
    });
    
    return count > 0 ? Math.round(totalScore / count) : null;
  };

  const isDish = !!(recognizedProduct?.isDish || switchData?.isDish);
  const switchRef = getSwitchReference(switchData, isDish);
  const units = getUnitLabels(language, isDish);
  const portionGrams = isDish ? switchData?.portion?.grams : null;
  const score = calculateScore();
  const hideMeasured = !isSpectrometerFlow();
  // Lo spettrometro misura 100 g di un singolo prodotto: per un piatto la colonna resta vuota
  const measuredData = isDish ? null : scioData;
  const rowFormat = isDish
    ? { calories: 0, carbs: 1, protein: 1, co2: 0, waterFootprint: 0 }
    : { calories: 1, carbs: 1, protein: 1, co2: 1, waterFootprint: 1 };

  const getBadge = (s) => {
    if (s >= 90) return { name: language === 'it' ? '🏆 Esperto Assoluto!' : '🏆 Absolute Expert!', color: SWITCH_COLORS.gold };
    if (s >= 70) return { name: language === 'it' ? '🥇 Grande Conoscitore' : '🥇 Great Connoisseur', color: '#C0C0C0' };
    if (s >= 50) return { name: language === 'it' ? '🥈 Buon Osservatore' : '🥈 Good Observer', color: '#CD7F32' };
    if (s >= 30) return { name: language === 'it' ? '🌱 In Crescita' : '🌱 Growing', color: SWITCH_COLORS.green };
    return { name: language === 'it' ? '🔍 Curioso' : '🔍 Curious', color: SWITCH_COLORS.darkBlue };
  };

  if (!quizAnswers) {
    return (
      <SwitchLayout 
        title={language === 'it' ? 'Nessun dato' : 'No data'}
        subtitle={language === 'it' ? 'Completa prima il quiz' : 'Complete the quiz first'}
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📊</div>
          <button 
            onClick={() => navigate('/quiz')}
            style={{
              padding: '16px 32px',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'white',
              background: SWITCH_COLORS.green,
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            {language === 'it' ? 'Vai al Quiz' : 'Go to Quiz'}
          </button>
        </div>
      </SwitchLayout>
    );
  }

  const answers = quizAnswers.answers || {};

  return (
    <SwitchLayout 
      title={`📊 ${language === 'it' ? 'Confronto Risultati' : 'Results Comparison'}`}
      subtitle={recognizedProduct?.name || ''}
      compact={true}
    >
      <GlobalProgress currentStep="comparison" language={language} />

      {/* Participant Number */}
      {(() => {
        const pid = sessionStorage.getItem('participantId');
        return pid ? (
          <div style={{ textAlign: 'center', marginBottom: '12px', fontSize: '0.85rem', color: SWITCH_COLORS.darkBlue, fontWeight: '600' }}>
            {language === 'it' ? 'Partecipante' : 'Participant'} #{pid}
          </div>
        ) : null;
      })()}

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

      {/* Punteggio */}
      {score !== null && (
        <div style={{
          background: `linear-gradient(135deg, ${SWITCH_COLORS.darkBlue} 0%, #2d4a6f 100%)`,
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '24px',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
        }}>
          <Trophy size={36} color={SWITCH_COLORS.gold} style={{ marginBottom: '8px' }} />
          <div style={{
            fontSize: '3.5rem',
            fontWeight: 'bold',
            lineHeight: 1,
            marginBottom: '6px'
          }}>
            {score}
          </div>
          <div style={{ opacity: 0.9, marginBottom: '8px', fontSize: '0.9rem' }}>
            {language === 'it' ? 'punti su 100' : 'points out of 100'}
          </div>
          <div style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            color: getBadge(score).color
          }}>
            {getBadge(score).name}
          </div>
        </div>
      )}

      {/* Legenda */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '20px',
        fontSize: '0.75rem',
        color: '#64748b'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '6px', color: SWITCH_COLORS.darkBlue }}>
          {language === 'it' ? '📋 Legenda:' : '📋 Legend:'}
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span><strong style={{ color: SWITCH_COLORS.darkBlue }}>{language === 'it' ? 'Tua Stima' : 'Your Estimate'}</strong> = {language === 'it' ? 'quello che hai indicato' : 'what you estimated'}</span>
          {!hideMeasured && <span><strong style={{ color: '#1d4ed8' }}>{language === 'it' ? 'Misurato' : 'Measured'}</strong> = {language === 'it' ? 'dallo spettrometro' : 'from spectrometer'}</span>}
          <span><strong style={{ color: '#15803d' }}>DB SWITCH</strong> = {isDish ? (language === 'it' ? 'somma degli ingredienti del piatto' : 'sum of the dish ingredients') : (language === 'it' ? 'valore medio' : 'average value')}</span>
        </div>
        <div style={{ marginTop: '8px', fontWeight: '600', color: SWITCH_COLORS.darkBlue }}>
          {isDish
            ? (language === 'it'
              ? `Valori riferiti alla porzione${portionGrams ? ` di ${portionGrams} g` : ''}`
              : `Values refer to the${portionGrams ? ` ${portionGrams} g` : ''} portion`)
            : (language === 'it'
              ? 'Calorie, carboidrati e proteine per 100 g; CO₂e e acqua per 1 kg di prodotto'
              : 'Calories, carbohydrates and protein per 100 g; CO₂e and water per 1 kg of product')}
        </div>
      </div>

      {/* Tabella Confronti */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ 
          color: SWITCH_COLORS.darkBlue, 
          marginBottom: '16px',
          fontSize: '1.1rem'
        }}>
          🎯 {language === 'it' ? 'Le tue stime vs Realtà' : 'Your estimates vs Reality'}
        </h3>
        
        <ComparisonRow
          label={language === 'it' ? 'Calorie' : 'Calories'}
          icon="🔥"
          userEstimate={answers.calories}
          measured={measuredData?.calories}
          dbSwitch={switchRef.calories}
          unit={units.calories}
          digits={rowFormat.calories}
          localeFormat={isDish}
          language={language}
          hideMeasured={hideMeasured}
        />
        
        <ComparisonRow
          label={language === 'it' ? 'Carboidrati' : 'Carbohydrates'}
          icon="🍞"
          userEstimate={answers.carbs}
          measured={measuredData?.carbs}
          dbSwitch={switchRef.carbs}
          unit={units.carbs}
          digits={rowFormat.carbs}
          localeFormat={isDish}
          language={language}
          hideMeasured={hideMeasured}
        />
        
        <ComparisonRow
          label={language === 'it' ? 'Proteine' : 'Protein'}
          icon="💪"
          userEstimate={answers.protein}
          measured={measuredData?.protein}
          dbSwitch={switchRef.protein}
          unit={units.protein}
          digits={rowFormat.protein}
          localeFormat={isDish}
          language={language}
          hideMeasured={hideMeasured}
        />
        
        <ComparisonRow
          label={language === 'it' ? 'Impronta CO₂' : 'CO₂ Footprint'}
          icon="🌱"
          userEstimate={answers.co2}
          measured={null}
          dbSwitch={switchRef.co2}
          unit={units.co2}
          digits={rowFormat.co2}
          localeFormat={isDish}
          language={language}
          hideMeasured={hideMeasured}
        />
        
        <ComparisonRow
          label={language === 'it' ? 'Impronta Idrica' : 'Water Footprint'}
          icon="🚿"
          userEstimate={answers.waterFootprint}
          measured={null}
          dbSwitch={switchRef.waterFootprint}
          unit={units.waterFootprint}
          digits={rowFormat.waterFootprint}
          localeFormat={isDish}
          language={language}
          hideMeasured={hideMeasured}
        />
      </div>

      {/* Fonte dati */}
      {switchData?.matchedItem && (
        <div style={{
          background: '#e0f2fe',
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '20px',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#0369a1'
        }}>
          📊 {language === 'it' ? 'Dati DB SWITCH per:' : 'DB SWITCH data for:'} <strong>{switchData.matchedItem}</strong>
        </div>
      )}

      {/* Bottoni */}
      <button 
        onClick={() => navigate('/feedback')}
        style={{ 
          marginBottom: '10px',
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
        ⭐ {language === 'it' ? 'Continua al Feedback' : 'Continue to Feedback'}
      </button>

      <button 
        onClick={() => navigate('/results')}
        style={{ 
          marginBottom: '10px',
          width: '100%',
          padding: '14px',
          fontSize: '1rem',
          fontWeight: '600',
          background: '#fff',
          border: `2px solid ${SWITCH_COLORS.darkBlue}`,
          color: SWITCH_COLORS.darkBlue,
          borderRadius: '12px',
          cursor: 'pointer'
        }}
      >
        ← {isDish ? (language === 'it' ? 'Torna alla Scheda Piatto' : 'Back to Dish Card') : (language === 'it' ? 'Torna alla Scheda Prodotto' : 'Back to Product Card')}
      </button>

      <button 
        onClick={() => {
          sessionStorage.clear();
          navigate('/');
        }}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          color: '#666',
          cursor: 'pointer',
          fontSize: '0.9rem',
          padding: '10px'
        }}
      >
        {language === 'it' ? 'Ricomincia da capo' : 'Start over'}
      </button>
    </SwitchLayout>
  );
}
