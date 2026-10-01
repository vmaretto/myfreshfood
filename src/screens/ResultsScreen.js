// src/screens/ResultsScreen.js - Confronto percezione vs realtà
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { Flame, Droplets, Leaf, TrendingUp, TrendingDown, Minus, Trophy, Target } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import DishCard from '../components/DishCard';
import { fetchSwitchData } from '../utils/switchLookup';
import { isSpectrometerFlow } from '../utils/flowMode';
// EnvironmentalCard now integrated in ProductCard
import SwitchLayout, { SWITCH_COLORS } from '../components/SwitchLayout';
import GlobalProgress from '../components/GlobalProgress';

// Componente per singola riga di confronto con animazione
const ComparisonRow = ({ icon, label, userValue, realValue, unit, color, language }) => {
  const [animated, setAnimated] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);
  
  // Calcola scarto percentuale
  const deviation = realValue > 0 ? ((userValue - realValue) / realValue * 100) : 0;
  const absDeviation = Math.abs(deviation);
  
  // Determina se è "vicino" (entro 20%) o "lontano"
  const isClose = absDeviation <= 20;
  const isMedium = absDeviation > 20 && absDeviation <= 50;
  
  // Colori e icone basati sullo scarto
  const getStatusColor = () => {
    if (isClose) return '#4CAF50'; // verde
    if (isMedium) return '#FF9800'; // arancione
    return '#f44336'; // rosso
  };
  
  const getStatusIcon = () => {
    if (deviation > 10) return <TrendingUp size={16} color={getStatusColor()} />;
    if (deviation < -10) return <TrendingDown size={16} color={getStatusColor()} />;
    return <Minus size={16} color={getStatusColor()} />;
  };
  
  const getStatusEmoji = () => {
    if (isClose) return '✅';
    if (isMedium) return '⚠️';
    return '❌';
  };
  
  return (
    <div style={{
      padding: '16px',
      background: SWITCH_COLORS.lightBg,
      borderRadius: '12px',
      marginBottom: '12px',
      borderLeft: `4px solid ${color}`,
      opacity: animated ? 1 : 0,
      transform: animated ? 'translateX(0)' : 'translateX(-20px)',
      transition: 'all 0.5s ease-out'
    }}>
      {/* Header con icona e label */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        marginBottom: '12px'
      }}>
        {icon}
        <span style={{ fontWeight: '600', color: SWITCH_COLORS.darkBlue, flex: 1 }}>
          {label}
        </span>
        <span style={{ fontSize: '1.2rem' }}>{getStatusEmoji()}</span>
      </div>
      
      {/* Valori affiancati */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '8px'
      }}>
        <div style={{
          padding: '10px',
          background: 'white',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>
            {language === 'it' ? 'Tua stima' : 'Your estimate'}
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: SWITCH_COLORS.darkBlue }}>
            {typeof userValue === 'number' ? userValue.toFixed(1) : userValue} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>{unit}</span>
          </div>
        </div>
        <div style={{
          padding: '10px',
          background: `${color}20`,
          borderRadius: '8px',
          textAlign: 'center',
          border: `2px solid ${color}`
        }}>
          <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>
            {language === 'it' ? 'Valore reale' : 'Real value'}
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color }}>
            {typeof realValue === 'number' ? realValue.toFixed(1) : realValue} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>{unit}</span>
          </div>
        </div>
      </div>
      
      {/* Scarto % */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '8px',
        background: `${getStatusColor()}15`,
        borderRadius: '8px',
        color: getStatusColor(),
        fontSize: '0.9rem',
        fontWeight: '500'
      }}>
        {getStatusIcon()}
        <span>
          {deviation > 0 ? '+' : ''}{deviation.toFixed(0)}% {language === 'it' ? 'rispetto al reale' : 'vs real'}
        </span>
      </div>
    </div>
  );
};

function ResultsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [results, setResults] = useState(null);
  const [image, setImage] = useState(null);
  const [recognizedProduct, setRecognizedProduct] = useState(null);
  const [productImage, setProductImage] = useState(null);
  const [switchData, setSwitchData] = useState(null);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState(null);
  const [showFullResults, setShowFullResults] = useState(false);
  const [scanMethod, setScanMethod] = useState(null);
  const [participantNumber, setParticipantNumber] = useState(null);
  const language = i18n?.language || 'it';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    // Carica tutti i dati da sessionStorage
    const storedResults = sessionStorage.getItem('scioResults');
    const storedImage = sessionStorage.getItem('scioImage');
    const storedProduct = sessionStorage.getItem('recognizedProduct');
    const storedProductImage = sessionStorage.getItem('productImage');
    const storedQuiz = sessionStorage.getItem('quizAnswers');
    
    const directScanData = sessionStorage.getItem('scioScanData');
    const storedScanMethod = sessionStorage.getItem('scanMethod');
    const spectrometerFlow = isSpectrometerFlow();
    setScanMethod(spectrometerFlow ? storedScanMethod : null);
    
    if (!spectrometerFlow) {
      // Percorso senza spettrometro: nessun valore misurato
    } else if (directScanData && storedScanMethod === 'direct') {
      const scanData = JSON.parse(directScanData);
      setResults({
        value: scanData.value,
        units: scanData.units,
        confidence: scanData.confidence,
        modelName: scanData.modelName,
        modelType: scanData.modelType,
        source: 'direct-scio',
        scanDate: scanData.scanDate || new Date().toISOString(),
        ...scanData.nutrition
      });
    } else if (directScanData && storedScanMethod === 'demo') {
      // Demo spectrometer data — nutrition fields are at top level
      const scanData = JSON.parse(directScanData);
      setResults({
        brix: scanData.brix,
        calories: scanData.calories,
        carbs: scanData.carbs,
        sugar: scanData.sugar,
        water: scanData.water,
        protein: scanData.protein,
        fiber: scanData.fiber,
        source: 'demo-scio',
        isDemoData: true,
        demoProductName: scanData.demoProductName,
        scanDate: new Date().toISOString()
      });
    } else if (directScanData && storedScanMethod === 'manual') {
      // Manual spectrometer data entry
      const scanData = JSON.parse(directScanData);
      setResults({
        brix: scanData.brix,
        calories: scanData.calories,
        carbs: scanData.carbs,
        sugar: scanData.sugar,
        water: scanData.water,
        protein: scanData.protein,
        fiber: scanData.fiber,
        source: 'manual-scio',
        isManualData: true,
        scanDate: new Date().toISOString()
      });
    } else if (storedResults) {
      setResults(JSON.parse(storedResults));
    }
    
    if (storedImage) setImage(storedImage);
    if (storedProduct) setRecognizedProduct(JSON.parse(storedProduct));
    if (storedProductImage) setProductImage(storedProductImage);
    if (storedQuiz) setQuizAnswers(JSON.parse(storedQuiz));
  }, []);

  useEffect(() => {
    const loadSwitchData = async () => {
      if (!recognizedProduct) return;
      
      if (!recognizedProduct.isDish && !(recognizedProduct.nameEn || recognizedProduct.name)) return;

      // Reuse the lookup done by the quiz for the same dish
      const cached = sessionStorage.getItem('switchData');
      if (cached && recognizedProduct.isDish) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.isDish && parsed.dishName === recognizedProduct.name) {
            setSwitchData(parsed);
            return;
          }
        } catch (e) {}
      }
      
      setSwitchLoading(true);
      try {
        const data = await fetchSwitchData(recognizedProduct);
        setSwitchData(data);
      } catch (error) {
        console.error('Error fetching SWITCH data:', error);
      } finally {
        setSwitchLoading(false);
      }
    };
    
    loadSwitchData();
  }, [recognizedProduct]);

  const handleNewScan = () => {
    sessionStorage.clear();
    navigate('/recognize');
  };

  const handleStartOver = () => {
    sessionStorage.clear();
    navigate('/');
  };

  // Calcola punteggio totale dal confronto
  const calculateTotalScore = () => {
    if (!quizAnswers?.answers || !quizAnswers?.realValues) return null;
    
    const { answers, realValues } = quizAnswers;
    let totalScore = 0;
    let count = 0;
    
    const metrics = ['calories', 'water', 'co2', 'waterFootprint'];
    metrics.forEach(key => {
      if (answers[key] !== undefined && realValues[key]) {
        const deviation = Math.abs((answers[key] - realValues[key]) / realValues[key] * 100);
        if (deviation <= 10) totalScore += 100;
        else if (deviation <= 20) totalScore += 80;
        else if (deviation <= 35) totalScore += 60;
        else if (deviation <= 50) totalScore += 40;
        else totalScore += 20;
        count++;
      }
    });
    
    return count > 0 ? Math.round(totalScore / count) : null;
  };

  const score = calculateTotalScore();

  const getBadge = (s) => {
    if (s >= 90) return { name: language === 'it' ? '🏆 Esperto Assoluto!' : '🏆 Absolute Expert!', color: SWITCH_COLORS.gold };
    if (s >= 70) return { name: language === 'it' ? '🥇 Grande Conoscitore' : '🥇 Great Connoisseur', color: '#C0C0C0' };
    if (s >= 50) return { name: language === 'it' ? '🥈 Buon Osservatore' : '🥈 Good Observer', color: '#CD7F32' };
    if (s >= 30) return { name: language === 'it' ? '🌱 In Crescita' : '🌱 Growing', color: SWITCH_COLORS.green };
    return { name: language === 'it' ? '🔍 Curioso' : '🔍 Curious', color: SWITCH_COLORS.darkBlue };
  };

  const NutrientRow = ({ label, value, unit }) => {
    if (value === null || value === undefined) return null;
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid #eee'
      }}>
        <span style={{ color: '#666' }}>{label}</span>
        <span style={{ fontWeight: 'bold', color: SWITCH_COLORS.darkBlue }}>{value} {unit}</span>
      </div>
    );
  };

  // Salva switchData in sessionStorage per ComparisonScreen
  useEffect(() => {
    if (switchData) {
      sessionStorage.setItem('switchData', JSON.stringify(switchData));
    }
  }, [switchData]);

  // Get participant number from sessionStorage (assigned at quiz completion)
  useEffect(() => {
    const savedId = sessionStorage.getItem('participantId');
    if (savedId) {
      setParticipantNumber(parseInt(savedId));
    }
  }, []);

  if (!results && !quizAnswers) {
    return (
      <SwitchLayout 
        title={t('results.noData')}
        subtitle={language === 'it' ? 'Nessun dato disponibile' : 'No data available'}
      >
        <GlobalProgress currentStep="results" language={language} />
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📊</div>
          <button 
            onClick={() => navigate('/recognize')}
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
            {t('results.goToScan')}
          </button>
        </div>
      </SwitchLayout>
    );
  }

  return (
    <SwitchLayout 
      title={`🍽️ ${recognizedProduct?.isDish ? (language === 'it' ? 'Scheda Piatto' : 'Dish Card') : (language === 'it' ? 'Scheda Prodotto' : 'Product Card')}`}
      subtitle={recognizedProduct?.name || ''}
      compact={true}
    >
      <GlobalProgress currentStep="results" language={language} />

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

      {/* PARTICIPANT NUMBER - Show prominently */}
      {participantNumber && (
        <div style={{
          background: `linear-gradient(135deg, ${SWITCH_COLORS.darkBlue} 0%, #2d4a6f 100%)`,
          borderRadius: '16px',
          padding: '20px',
          margin: '0 0 20px 0',
          color: 'white',
          textAlign: 'center',
          border: '3px solid #FFD700',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
        }}>
          <div style={{ 
            fontSize: '0.9rem', 
            opacity: 0.9, 
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {language === 'it' ? '📋 Il tuo numero partecipante' : '📋 Your participant number'}
          </div>
          <div style={{ 
            fontSize: '3.5rem', 
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            color: '#FFD700'
          }}>
            #{participantNumber}
          </div>
          <div style={{ 
            fontSize: '0.8rem', 
            opacity: 0.8,
            marginTop: '8px'
          }}>
            {language === 'it' 
              ? '💡 Annota questo numero per la classifica fisica!'
              : '💡 Note this number for the physical leaderboard!'}
          </div>
        </div>
      )}

      {/* SCHEDA PRODOTTO - Prima di tutto */}
      {recognizedProduct && (
        <div style={{ marginBottom: '20px' }}>
          {recognizedProduct.isDish ? (
            <DishCard
              dish={recognizedProduct}
              productImage={productImage}
              switchData={switchData}
              loading={switchLoading}
            />
          ) : (
          <ProductCard 
            productName={recognizedProduct.name}
            measuredValue={results?.value}
            measuredData={results}
            productImage={productImage}
            switchData={switchData}
            scanMethod={scanMethod}
          />
          )}
        </div>
      )}

      {/* Bottone per vedere il Confronto */}
      {quizAnswers && !quizAnswers.skipped && (
        <button 
          onClick={() => navigate('/comparison')}
          style={{ 
            marginBottom: '10px',
            width: '100%',
            padding: '16px',
            fontSize: '1.1rem',
            fontWeight: '600',
            color: 'white',
            background: SWITCH_COLORS.darkBlue,
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: `0 4px 12px ${SWITCH_COLORS.darkBlue}50`
          }}
        >
          📊 {language === 'it' ? 'Vedi Confronto Stime vs Realtà' : 'See Estimates vs Reality'}
        </button>
      )}

      {/* Messaggio se quiz saltato */}
      {quizAnswers?.skipped && (
        <div style={{
          background: '#fff3cd',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, color: '#856404' }}>
            {language === 'it' 
              ? '⚠️ Hai saltato il quiz. La prossima volta prova a stimare i valori!'
              : '⚠️ You skipped the quiz. Next time try to estimate the values!'}
          </p>
        </div>
      )}

      {/* Continue to Feedback */}
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
        ⭐ {t('results.continueToFeedback', 'Continua al Feedback')}
      </button>

      <button 
        onClick={handleNewScan}
        style={{ 
          marginBottom: '10px',
          width: '100%',
          padding: '14px',
          fontSize: '1rem',
          fontWeight: '600',
          background: '#fff',
          border: `2px solid ${SWITCH_COLORS.green}`,
          color: SWITCH_COLORS.green,
          borderRadius: '12px',
          cursor: 'pointer'
        }}
      >
        📸 {t('results.newScan')}
      </button>

      <button 
        onClick={handleStartOver}
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
        {t('results.startOver')}
      </button>
    </SwitchLayout>
  );
}

export default ResultsScreen;
