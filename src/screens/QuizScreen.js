// src/screens/QuizScreen.js - Quiz standalone sulla conoscenza del prodotto
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brain, Droplets, Flame, Leaf, ChevronRight, Info } from 'lucide-react';
import SwitchLayout, { SWITCH_COLORS } from '../components/SwitchLayout';
import GlobalProgress from '../components/GlobalProgress';
import { fetchSwitchData } from '../utils/switchLookup';
import { getFlowMode, isSpectrometerFlow } from '../utils/flowMode';

// Traduzioni nomi prodotti
const productNames = {
  'pomodoro': { it: 'Pomodoro', en: 'Tomato' },
  'pomodoro ciliegino': { it: 'Pomodoro ciliegino', en: 'Cherry tomato' },
  'mela': { it: 'Mela', en: 'Apple' },
  'mela golden': { it: 'Mela Golden', en: 'Golden Apple' },
  'arancia': { it: 'Arancia', en: 'Orange' },
  'limone': { it: 'Limone', en: 'Lemon' },
  'banana': { it: 'Banana', en: 'Banana' },
  'fragola': { it: 'Fragola', en: 'Strawberry' },
  'uva': { it: 'Uva', en: 'Grape' },
  'pera': { it: 'Pera', en: 'Pear' },
  'pesca': { it: 'Pesca', en: 'Peach' },
  'anguria': { it: 'Anguria', en: 'Watermelon' },
  'melone': { it: 'Melone', en: 'Melon' },
  'kiwi': { it: 'Kiwi', en: 'Kiwi' },
  'avocado': { it: 'Avocado', en: 'Avocado' },
  'carota': { it: 'Carota', en: 'Carrot' },
  'zucchina': { it: 'Zucchina', en: 'Zucchini' },
  'peperone': { it: 'Peperone', en: 'Bell pepper' },
  'cetriolo': { it: 'Cetriolo', en: 'Cucumber' },
  'lattuga': { it: 'Lattuga', en: 'Lettuce' },
  'spinaci': { it: 'Spinaci', en: 'Spinach' },
  'broccoli': { it: 'Broccoli', en: 'Broccoli' },
  'cavolfiore': { it: 'Cavolfiore', en: 'Cauliflower' },
  'patata': { it: 'Patata', en: 'Potato' },
  'cipolla': { it: 'Cipolla', en: 'Onion' },
  'aglio': { it: 'Aglio', en: 'Garlic' },
};

// NESSUN FALLBACK - Tutti i dati DEVONO venire dall'API SWITCH
// Se l'API non trova il prodotto, mostriamo un messaggio invece di dati inventati

export default function QuizScreen() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const language = i18n.language || 'it';
  
  // Funzione per tradurre i nomi dei prodotti
  const translateProductName = (name) => {
    if (!name) return '';
    const key = name.toLowerCase().trim();
    const translation = productNames[key];
    if (translation) {
      return language === 'en' ? translation.en : translation.it;
    }
    return name;
  };
  
  const [product, setProduct] = useState(null);
  const [switchData, setSwitchData] = useState(null);
  const [scioData, setScioData] = useState(null); // Dati misurati dallo spettrometro
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(() => {
    // Restore quiz progress when navigating back
    const savedProgress = sessionStorage.getItem('quizProgress');
    if (savedProgress) {
      try { return JSON.parse(savedProgress).currentQuestion || -1; } catch(e) {}
    }
    return -1;
  });
  const [answers, setAnswers] = useState(() => {
    const savedProgress = sessionStorage.getItem('quizProgress');
    if (savedProgress) {
      try { return JSON.parse(savedProgress).answers || {}; } catch(e) {}
    }
    return {};
  });

  // Carica prodotto, dati SWITCH e dati spettrometro
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const storedProduct = sessionStorage.getItem('recognizedProduct');
    if (!storedProduct) {
      navigate('/recognize');
      return;
    }
    
    const productData = JSON.parse(storedProduct);
    setProduct(productData);
    
    // Carica dati spettrometro se disponibili (valori misurati realmente)
    const storedScioResults = sessionStorage.getItem('scioResults');
    const storedScioScanData = sessionStorage.getItem('scioScanData');
    
    if (!isSpectrometerFlow()) {
      // Percorso senza spettrometro: valori solo da SWITCH
    } else if (storedScioScanData) {
      const scanData = JSON.parse(storedScioScanData);
      setScioData(scanData.nutrition || scanData);
    } else if (storedScioResults) {
      setScioData(JSON.parse(storedScioResults));
    }
    
    // Fetch SWITCH data
    const loadSwitchData = async () => {
      try {
        const data = await fetchSwitchData(productData);
        setSwitchData(data);
        // ResultsScreen/ComparisonScreen reuse it (same recipe, no second lookup)
        sessionStorage.setItem('switchData', JSON.stringify(data));
      } catch (error) {
        console.error('Error fetching SWITCH data:', error);
        // Nessun fallback - segnala che non ha trovato dati
        setSwitchData({ found: false, error: error.message });
      } finally {
        setLoading(false);
      }
    };
    
    loadSwitchData();
  }, [navigate]);

  // Save quiz progress for back navigation
  useEffect(() => {
    sessionStorage.setItem('quizProgress', JSON.stringify({ currentQuestion, answers }));
  }, [currentQuestion, answers]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentQuestion]);

  if (loading || !product) {
    return (
      <SwitchLayout 
        title={language === 'it' ? 'Preparando il quiz...' : 'Preparing quiz...'}
        subtitle={language === 'it' ? 'Caricamento dati prodotto' : 'Loading product data'}
      >
        <GlobalProgress currentStep="quiz" language={language} />
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🧠</div>
          <div style={{
            width: '50px',
            height: '50px',
            margin: '0 auto',
            border: '4px solid #e0e0e0',
            borderTopColor: SWITCH_COLORS.gold,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </SwitchLayout>
    );
  }

  // Valori reali: SCIO per nutrienti (se disponibili), SWITCH per impatto ambientale
  // NESSUN FALLBACK - se non ci sono dati, restituisce null
  const getRealValues = () => {
    const switchNutrition = switchData?.nutrition || {};
    const environmental = switchData?.environmental || {};
    const hasSwitchData = switchData?.found !== false;
    
    // PRIORITÀ per nutrienti: SCIO > SWITCH (no fallback)
    // I dati spettrometro sono misurati sul prodotto specifico, quindi sono i "veri" valori reali
    const getCalories = () => {
      if (scioData?.calories) return scioData.calories;
      if (hasSwitchData && (switchNutrition.calories || switchNutrition.energy)) {
        return switchNutrition.calories || switchNutrition.energy;
      }
      return null; // Nessun dato disponibile
    };
    
    const getWater = () => {
      if (scioData?.water) return scioData.water;
      if (hasSwitchData && switchNutrition.water) {
        return switchNutrition.water;
      }
      return null; // Nessun dato disponibile
    };
    
    // Impatto ambientale: solo da SWITCH (SCIO non lo misura) - NO FALLBACK
    const getCO2 = () => {
      if (hasSwitchData && (environmental.carbonFootprint || environmental.co2)) {
        return parseFloat(environmental.carbonFootprint || environmental.co2);
      }
      return null;
    };
    
    const getWaterFootprint = () => {
      if (hasSwitchData && (environmental.waterFootprint || environmental.water)) {
        return parseFloat(environmental.waterFootprint || environmental.water);
      }
      return null;
    };
    
    // Carboidrati e Proteine da SWITCH
    const getCarbs = () => {
      if (hasSwitchData && switchNutrition.carbohydrates) {
        return parseFloat(switchNutrition.carbohydrates);
      }
      return null;
    };
    
    const getProtein = () => {
      if (hasSwitchData && switchNutrition.proteins) {
        return parseFloat(switchNutrition.proteins);
      }
      return null;
    };
    
    return {
      calories: getCalories(),
      carbs: getCarbs(),
      protein: getProtein(),
      co2: getCO2(),
      waterFootprint: getWaterFootprint(),
      hasSwitchData
    };
  };

  const realValues = getRealValues();

  const isDish = !!product.isDish;
  const questions = [
    {
      id: 'calories',
      icon: <Flame size={32} color="#FF6B6B" />,
      question: language === 'it' 
        ? `Quante calorie pensi che contenga 100g di ${translateProductName(product.name)}?`
        : `How many calories do you think 100g of ${translateProductName(product.name)} contains?`,
      unit: 'kcal/100g',
      min: 5,
      max: isDish ? 600 : 200,
      step: 5,
      default: 50,
      realValue: realValues.calories,
      color: '#FF6B6B'
    },
    {
      id: 'carbs',
      icon: <Brain size={32} color="#FFA726" />,
      question: language === 'it'
        ? `Quanti grammi di carboidrati pensi che contenga 100g di ${translateProductName(product.name)}?`
        : `How many grams of carbohydrates do you think 100g of ${translateProductName(product.name)} contains?`,
      unit: 'g/100g',
      min: 0,
      max: isDish ? 80 : 50,
      step: 1,
      default: 10,
      realValue: realValues.carbs,
      color: '#FFA726'
    },
    {
      id: 'protein',
      icon: <Droplets size={32} color="#7E57C2" />,
      question: language === 'it'
        ? `Quanti grammi di proteine pensi che contenga 100g di ${translateProductName(product.name)}?`
        : `How many grams of protein do you think 100g of ${translateProductName(product.name)} contains?`,
      unit: 'g/100g',
      min: 0,
      max: isDish ? 40 : 30,
      step: 0.1,
      default: 1,
      realValue: realValues.protein,
      color: '#7E57C2'
    },
    {
      id: 'co2',
      icon: <Leaf size={32} color="#95E1A3" />,
      question: language === 'it'
        ? `Quanta CO₂ viene emessa per produrre 1kg di ${translateProductName(product.name)}?`
        : `How much CO₂ is emitted to produce 1kg of ${translateProductName(product.name)}?`,
      unit: 'kg CO₂/kg',
      min: 0.1,
      max: isDish ? 15.0 : 5.0,
      step: 0.1,
      default: 1.0,
      realValue: realValues.co2,
      color: '#95E1A3'
    },
    {
      id: 'waterFootprint',
      icon: <Droplets size={32} color={SWITCH_COLORS.darkBlue} />,
      question: language === 'it'
        ? `Quanti litri d'acqua servono per produrre 1kg di ${translateProductName(product.name)}?`
        : `How many liters of water are needed to produce 1kg of ${translateProductName(product.name)}?`,
      unit: 'L/kg',
      min: 50,
      max: isDish ? 8000 : 2000,
      step: isDish ? 100 : 50,
      default: 500,
      realValue: realValues.waterFootprint,
      color: SWITCH_COLORS.darkBlue
    }
  ];

  const currentQ = currentQuestion >= 0 ? questions[currentQuestion] : null;

  const handleAnswer = (value) => {
    if (!currentQ) return;
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: parseFloat(value)
    }));
  };

  const handleNext = async () => {
    // Salva sempre il valore corrente (modificato o default)
    const currentValue = answers[currentQ.id] !== undefined ? answers[currentQ.id] : currentQ.default;
    const updatedAnswers = { ...answers, [currentQ.id]: currentValue };
    setAnswers(updatedAnswers);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Quiz completato - calcola punteggio e salva
      // Calcola punteggio: stima vs DB SWITCH (valuta la conoscenza dei valori tipici)
      // SCIO è solo informativo, non influenza il punteggio
      const calculateScore = (ans) => {
        let totalScore = 0;
        let count = 0;
        
        const switchNutrition = switchData?.nutrition || {};
        const environmental = switchData?.environmental || {};
        
        const getScore = (deviation) => {
          if (deviation <= 10) return 100;
          if (deviation <= 20) return 80;
          if (deviation <= 35) return 60;
          if (deviation <= 50) return 40;
          return 20;
        };
        
        const metrics = [
          { key: 'calories', db: switchNutrition.calories || switchNutrition.energy },
          { key: 'carbs', db: switchNutrition.carbohydrates },
          { key: 'protein', db: switchNutrition.proteins },
          { key: 'co2', db: environmental.carbonFootprint || environmental.co2 },
          { key: 'waterFootprint', db: environmental.waterFootprint || environmental.water }
        ];
        
        metrics.forEach(({ key, db }) => {
          const estimate = ans[key];
          if (estimate === undefined || db === null || db === undefined || db === 0) return;
          
          const deviation = Math.abs((estimate - db) / db * 100);
          totalScore += getScore(deviation);
          count++;
        });
        
        return count > 0 ? Math.round(totalScore / count) : 0;
      };
      
      const score = calculateScore(updatedAnswers);
      
      const quizData = {
        answers: updatedAnswers,
        realValues,
        productName: product.name,
        timestamp: new Date().toISOString(),
        score: {
          total: score,
          details: { answers: updatedAnswers, realValues }
        }
      };
      sessionStorage.setItem('quizAnswers', JSON.stringify(quizData));
      
      // Create participant in DB immediately to get a unique ID
      try {
        const profileData = JSON.parse(sessionStorage.getItem('profileData') || '{}');
        const res = await fetch('/api/participants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'quiz_completed',
            language: language,
            data: { profile: profileData, product: { name: product.name, isDish: !!product.isDish }, flowMode: getFlowMode(), quizResults: quizData }
          })
        });
        if (res.ok) {
          const result = await res.json();
          sessionStorage.setItem('participantId', result.id.toString());
        }
      } catch (err) {
        console.error('Error creating participant:', err);
      }
      
      navigate(isSpectrometerFlow() ? '/scan-flow' : '/results');
    }
  };

  const handleSkip = () => {
    const skipData = {
      answers: {},
      skipped: true,
      realValues,
      productName: product.name,
      timestamp: new Date().toISOString()
    };
    sessionStorage.setItem('quizAnswers', JSON.stringify(skipData));
    
    // Create participant even when skipping quiz
    (async () => {
      try {
        const profileData = JSON.parse(sessionStorage.getItem('profileData') || '{}');
        const res = await fetch('/api/participants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'quiz_skipped',
            language: language,
            data: { profile: profileData, product: { name: product.name, isDish: !!product.isDish }, flowMode: getFlowMode(), quizResults: skipData }
          })
        });
        if (res.ok) {
          const result = await res.json();
          sessionStorage.setItem('participantId', result.id.toString());
        }
      } catch (err) {
        console.error('Error creating participant:', err);
      }
    })();
    
    navigate(isSpectrometerFlow() ? '/scan-flow' : '/results');
  };

  // Intro screen
  if (currentQuestion === -1) {
    return (
      <SwitchLayout
        title={language === 'it' ? '🧠 Quiz Conoscenza' : '🧠 Knowledge Quiz'}
        subtitle={`${product.emoji || '🥬'} ${translateProductName(product.name)}`}
      >
        <GlobalProgress currentStep="quiz" language={language} />

        <div style={{
          background: `linear-gradient(135deg, ${SWITCH_COLORS.gold}20 0%, ${SWITCH_COLORS.gold}10 100%)`,
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '10px' }}>{product.emoji || '🥬'}</div>
          <p style={{ color: '#666', margin: 0 }}>
            {isSpectrometerFlow()
              ? (language === 'it' ? 'Prima di scansionare, metti alla prova le tue conoscenze!' : 'Before scanning, test your knowledge!')
              : (language === 'it' ? 'Prima di scoprire i dati, metti alla prova le tue conoscenze!' : 'Before discovering the data, test your knowledge!')}
          </p>
        </div>

        <h3 style={{ color: SWITCH_COLORS.darkBlue, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={20} />
          {language === 'it' ? 'Come funziona' : 'How it works'}
        </h3>

        <div style={{ 
          padding: '16px', 
          background: SWITCH_COLORS.lightBg, 
          borderRadius: '12px',
          marginBottom: '24px',
          fontSize: '0.9rem',
          color: '#666'
        }}>
          <p style={{ margin: '0 0 12px 0' }}>
            {language === 'it' 
              ? 'Ti chiederemo di stimare 4 valori per questo prodotto:'
              : 'We\'ll ask you to estimate 4 values for this product:'}
          </p>
          <ul style={{ margin: '0', paddingLeft: '20px', lineHeight: '2' }}>
            <li>🔥 {language === 'it' ? 'Calorie' : 'Calories'}</li>
            <li>💧 {language === 'it' ? 'Contenuto acqua' : 'Water content'}</li>
            <li>🌱 {language === 'it' ? 'Impronta CO₂' : 'CO₂ footprint'}</li>
            <li>💦 {language === 'it' ? 'Impronta idrica' : 'Water footprint'}</li>
          </ul>
          <p style={{ margin: '12px 0 0 0', fontWeight: '500', color: SWITCH_COLORS.darkBlue }}>
            {isSpectrometerFlow()
              ? (language === 'it'
                ? '→ Dopo lo scan spettrometro confronteremo le tue stime con i dati reali!'
                : '→ After spectrometer scan we\'ll compare your estimates with real data!')
              : (language === 'it'
                ? '→ Poi confronteremo le tue stime con i dati del database SWITCH!'
                : '→ Then we\'ll compare your estimates with the SWITCH database!')}
          </p>
        </div>

        <button
          onClick={() => setCurrentQuestion(0)}
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: `0 4px 15px ${SWITCH_COLORS.green}50`
          }}
        >
          {language === 'it' ? 'Inizia il Quiz' : 'Start Quiz'}
          <ChevronRight size={20} />
        </button>

        <button
          onClick={handleSkip}
          style={{
            width: '100%',
            marginTop: '12px',
            padding: '12px',
            background: 'transparent',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          {language === 'it' ? 'Salta il quiz' : 'Skip quiz'}
        </button>
      </SwitchLayout>
    );
  }

  // Quiz questions screen
  return (
    <SwitchLayout
      title={`${language === 'it' ? 'Domanda' : 'Question'} ${currentQuestion + 1}/${questions.length}`}
      subtitle={`${product.emoji || '🥬'} ${translateProductName(product.name)}`}
      compact={true}
    >
      <GlobalProgress currentStep="quiz" language={language} />

      {/* Back Button - goes to previous question, or previous screen if on intro */}
      <button
        onClick={() => {
          if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
          } else {
            navigate(-1);
          }
        }}
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

      {/* Progress */}
      <div style={{
        height: '6px',
        background: '#e0e0e0',
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
        <div style={{
          height: '100%',
          width: `${((currentQuestion + 1) / questions.length) * 100}%`,
          background: SWITCH_COLORS.gold,
          borderRadius: '3px',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Icon */}
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: `${currentQ.color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px'
      }}>
        {currentQ.icon}
      </div>

      {/* Question */}
      <h2 style={{
        fontSize: '1.2rem',
        color: SWITCH_COLORS.darkBlue,
        marginBottom: '32px',
        lineHeight: 1.4,
        textAlign: 'center'
      }}>
        {currentQ.question}
      </h2>

      {/* Slider */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          color: currentQ.color,
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          {answers[currentQ.id] !== undefined ? answers[currentQ.id] : currentQ.default}
          <span style={{ fontSize: '1.2rem', fontWeight: 'normal', color: '#666' }}>
            {' '}{currentQ.unit}
          </span>
        </div>
        
        <input
          type="range"
          min={currentQ.min}
          max={currentQ.max}
          step={currentQ.step}
          value={answers[currentQ.id] !== undefined ? answers[currentQ.id] : currentQ.default}
          onChange={(e) => handleAnswer(e.target.value)}
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '4px',
            background: `linear-gradient(to right, ${currentQ.color} 0%, ${currentQ.color}40 100%)`,
            outline: 'none',
            cursor: 'pointer',
            WebkitAppearance: 'none'
          }}
        />
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          color: '#999',
          fontSize: '0.85rem',
          marginTop: '8px'
        }}>
          <span>{currentQ.min}</span>
          <span>{currentQ.max}</span>
        </div>
      </div>

      {/* Hint */}
      <p style={{
        color: '#888',
        fontSize: '0.9rem',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <Brain size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
        {language === 'it' 
          ? 'Usa la tua intuizione! Non preoccuparti se non sei sicuro.'
          : "Use your intuition! Don't worry if you're not sure."}
      </p>

      {/* Next Button */}
      <button
        onClick={handleNext}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '1.1rem',
          fontWeight: '600',
          color: 'white',
          background: currentQ.color,
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        {currentQuestion < questions.length - 1 
          ? (language === 'it' ? 'Prossima domanda' : 'Next question')
          : isSpectrometerFlow()
            ? (language === 'it' ? 'Vai alla scansione' : 'Go to scan')
            : (language === 'it' ? 'Scopri i risultati' : 'See the results')
        }
        <ChevronRight size={20} />
      </button>

      {/* Skip option */}
      <button
        onClick={handleSkip}
        style={{
          marginTop: '16px',
          width: '100%',
          background: 'transparent',
          border: 'none',
          color: '#888',
          cursor: 'pointer',
          fontSize: '0.9rem',
          textDecoration: 'underline'
        }}
      >
        {language === 'it' ? 'Salta il quiz' : 'Skip quiz'}
      </button>
    </SwitchLayout>
  );
}
