// src/components/ProductCard.js
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Traduzioni nomi prodotti
const productNameTranslations = {
  'pomodoro': { it: 'Pomodoro', en: 'Tomato' },
  'pomodoro ciliegino': { it: 'Pomodoro Ciliegino', en: 'Cherry Tomato' },
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
  'peperone': { it: 'Peperone', en: 'Bell Pepper' },
  'cetriolo': { it: 'Cetriolo', en: 'Cucumber' },
  'lattuga': { it: 'Lattuga', en: 'Lettuce' },
  'spinaci': { it: 'Spinaci', en: 'Spinach' },
  'broccoli': { it: 'Broccoli', en: 'Broccoli' },
  'cavolfiore': { it: 'Cavolfiore', en: 'Cauliflower' },
  'patata': { it: 'Patata', en: 'Potato' },
  'cipolla': { it: 'Cipolla', en: 'Onion' },
  'aglio': { it: 'Aglio', en: 'Garlic' },
};

// Traduzioni categorie
const categoryTranslations = {
  'frutta': { it: 'Frutta', en: 'Fruit' },
  'verdura': { it: 'Verdura', en: 'Vegetable' },
  'ortaggio': { it: 'Ortaggio', en: 'Vegetable' },
};

// Database prodotti locali (fallback) - con traduzioni IT/EN
const localProducts = {
  'pomodoro': {
    id: 'pomodoro',
    name: { it: 'Pomodoro', en: 'Tomato' },
    category: { it: 'Ortaggio', en: 'Vegetable' },
    emoji: '🍅',
    image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400',
    origin: { it: 'Sicilia, Italia', en: 'Sicily, Italy' },
    seasonality: [6, 7, 8, 9],
    nutrition: {
      calories: 18,
      sugar: { typical: 3.9, min: 3, max: 6 },
      water: 94,
      fiber: 1.2,
      vitaminC: 21,
    },
    tips: {
      it: [
        '🌡️ Conservare a temperatura ambiente per massimo sapore',
        '🚫 Evitare il frigorifero se possibile',
        '🥗 Ottimo crudo in insalate o come snack',
        '🍳 Perfetto per sughi veloci'
      ],
      en: [
        '🌡️ Store at room temperature for best flavor',
        '🚫 Avoid refrigerator if possible',
        '🥗 Great raw in salads or as a snack',
        '🍳 Perfect for quick sauces'
      ]
    },
    curiosity: {
      it: 'Il licopene, responsabile del colore rosso, è un potente antiossidante che aumenta con la cottura!',
      en: 'Lycopene, responsible for the red color, is a powerful antioxidant that increases with cooking!'
    }
  },
  'pomodoro ciliegino': {
    id: 'pomodoro-ciliegino',
    name: { it: 'Pomodoro Ciliegino', en: 'Cherry Tomato' },
    category: { it: 'Ortaggio', en: 'Vegetable' },
    emoji: '🍅',
    image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400',
    origin: { it: 'Sicilia, Italia', en: 'Sicily, Italy' },
    seasonality: [6, 7, 8, 9],
    nutrition: {
      calories: 18,
      sugar: { typical: 4.5, min: 3.5, max: 6.5 },
      water: 94,
      fiber: 1.2,
      vitaminC: 21,
    },
    tips: {
      it: [
        '🌡️ Conservare a temperatura ambiente per massimo sapore',
        '🚫 Evitare il frigorifero se possibile',
        '🥗 Ottimo crudo in insalate o come snack',
        '🍳 Perfetto per sughi veloci'
      ],
      en: [
        '🌡️ Store at room temperature for best flavor',
        '🚫 Avoid refrigerator if possible',
        '🥗 Great raw in salads or as a snack',
        '🍳 Perfect for quick sauces'
      ]
    },
    curiosity: {
      it: 'Il licopene, responsabile del colore rosso, è un potente antiossidante che aumenta con la cottura!',
      en: 'Lycopene, responsible for the red color, is a powerful antioxidant that increases with cooking!'
    }
  },
  'mela': {
    id: 'mela',
    name: { it: 'Mela', en: 'Apple' },
    category: { it: 'Frutta', en: 'Fruit' },
    emoji: '🍎',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
    origin: { it: 'Trentino Alto Adige', en: 'Trentino Alto Adige, Italy' },
    seasonality: [9, 10, 11, 12, 1, 2],
    nutrition: {
      calories: 52,
      sugar: { typical: 10.4, min: 9, max: 12 },
      water: 86,
      fiber: 2.4,
      vitaminC: 4.6,
    },
    tips: {
      it: [
        '❄️ Conservare in frigorifero per mantenerla croccante',
        '🍯 Ottima con miele e noci',
        '🥧 Perfetta per torte e dolci'
      ],
      en: [
        '❄️ Store in refrigerator to keep it crispy',
        '🍯 Great with honey and walnuts',
        '🥧 Perfect for pies and desserts'
      ]
    },
    curiosity: {
      it: 'Una mela al giorno toglie il medico di torno: contiene pectina che aiuta la digestione!',
      en: 'An apple a day keeps the doctor away: it contains pectin that aids digestion!'
    }
  }
};

function NutrientBox({ label, value, unit, icon }) {
  if (value === null || value === undefined) return null;
  return (
    <div style={{
      background: '#f8f9fa',
      borderRadius: '12px',
      padding: '15px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>{icon}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
        {typeof value === 'number' ? value.toFixed(1) : value}
      </div>
      <div style={{ fontSize: '0.75rem', color: '#666' }}>{unit}</div>
      <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

// Componente per riga di confronto SCIO vs SWITCH
function ComparisonRow({ label, icon, scioValue, switchValue, unit }) {
  if (scioValue === null || scioValue === undefined || !scioValue) return null;
  
  const hasBoth = switchValue !== null && switchValue !== undefined && switchValue > 0;
  const diff = hasBoth ? ((scioValue - switchValue) / switchValue * 100) : null;
  
  const getDiffColor = () => {
    if (diff === null) return '#888';
    const absDiff = Math.abs(diff);
    if (absDiff <= 15) return '#4CAF50'; // green — close
    if (absDiff <= 35) return '#FF9800'; // orange — moderate
    return '#f44336'; // red — far
  };
  
  const getDiffIcon = () => {
    if (diff === null) return '—';
    if (diff > 5) return '▲';
    if (diff < -5) return '▼';
    return '≈';
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: hasBoth ? '2fr 1fr 1fr 1.2fr' : '2fr 1fr',
      gap: '8px',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid rgba(218, 165, 32, 0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#444' }}>
        <span>{icon}</span> {label}
      </div>
      <div style={{ 
        textAlign: 'center', 
        fontWeight: 'bold', 
        color: '#1565c0',
        fontSize: '0.95rem'
      }}>
        {typeof scioValue === 'number' ? scioValue.toFixed(1) : scioValue}
        <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#888' }}> {unit}</span>
      </div>
      {hasBoth && (
        <>
          <div style={{ 
            textAlign: 'center', 
            color: '#666',
            fontSize: '0.85rem'
          }}>
            {typeof switchValue === 'number' ? switchValue.toFixed(1) : switchValue}
            <span style={{ fontSize: '0.7rem', color: '#999' }}> {unit}</span>
          </div>
          <div style={{
            textAlign: 'center',
            fontSize: '0.8rem',
            fontWeight: '600',
            color: getDiffColor(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px'
          }}>
            <span>{getDiffIcon()}</span>
            <span>{diff > 0 ? '+' : ''}{diff.toFixed(0)}%</span>
          </div>
        </>
      )}
    </div>
  );
}

function ProductCard({ productName, measuredValue, measuredData, productImage, switchData, scanMethod }) {
  const { t, i18n } = useTranslation();
  const [aiProductInfo, setAiProductInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const language = i18n.language || 'it';
  
  // Funzione per tradurre nomi prodotti
  const translateProductName = (name) => {
    if (!name) return '';
    const key = name.toLowerCase().trim();
    const translation = productNameTranslations[key];
    if (translation) {
      return language === 'en' ? translation.en : translation.it;
    }
    return name;
  };
  
  // Funzione per tradurre categorie
  const translateCategory = (cat) => {
    if (!cat) return '';
    const key = cat.toLowerCase().trim();
    const translation = categoryTranslations[key];
    if (translation) {
      return language === 'en' ? translation.en : translation.it;
    }
    return cat;
  };
  
  // Normalize product name for lookup
  const normalizedName = (productName || '').toLowerCase().trim();
  
  // Check if we have local data
  const localProduct = localProducts[normalizedName];
  
  // Fetch AI-generated info if not in local database
  useEffect(() => {
    const fetchAiInfo = async () => {
      if (localProduct || !productName) return;
      
      setLoading(true);
      try {
        const response = await fetch('/api/generate-product-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            productName,
            language: i18n.language 
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setAiProductInfo(data);
        }
      } catch (error) {
        console.error('Error fetching AI product info:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAiInfo();
  }, [productName, localProduct, i18n.language]);
  
  // Helper per estrarre testo localizzato
  const getLocalizedText = (field) => {
    if (!field) return null;
    if (typeof field === 'string') return field;
    return field[language] || field.it || field;
  };
  
  // Merge data sources: local > AI > SWITCH > defaults
  const product = {
    name: getLocalizedText(localProduct?.name) || translateProductName(productName) || aiProductInfo?.name || t('products.unknown.name', 'Product'),
    emoji: localProduct?.emoji || aiProductInfo?.emoji || '🥬',
    category: getLocalizedText(localProduct?.category) || translateCategory(switchData?.category?.group) || aiProductInfo?.category || t('products.category.other', 'Other'),
    origin: getLocalizedText(localProduct?.origin) || aiProductInfo?.origin || null,
    seasonality: localProduct?.seasonality || aiProductInfo?.seasonality || [],
    tips: getLocalizedText(localProduct?.tips) || aiProductInfo?.tips || [],
    curiosity: getLocalizedText(localProduct?.curiosity) || aiProductInfo?.curiosity || null,
    pairings: aiProductInfo?.pairings || [],
  };
  
  // Nutrition: SOLO dati DB SWITCH - niente dati inventati/AI
  const nutrition = {
    calories: switchData?.nutrition?.energy || null,
    protein: switchData?.nutrition?.proteins || null,
    carbs: switchData?.nutrition?.carbohydrates || null,
    fat: switchData?.nutrition?.fat || null,
    saturatedFat: switchData?.nutrition?.saturatedFat || null,
    fiber: switchData?.nutrition?.fiber || null,
    sugar: switchData?.nutrition?.soluble || null, // "soluble" = zuccheri nel DB SWITCH
  };
  
  // Use custom image if provided
  const displayImage = productImage || localProduct?.image || null;
  
  // Quality indicator removed - no longer using sugar min/max ranges
  const quality = null;
  
  // Month names
  const monthNames = i18n.language === 'en' 
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

  // Show loading state while fetching AI data
  if (loading && !localProduct) {
    return (
      <div style={{
        background: 'linear-gradient(180deg, #f8fdf8 0%, #ffffff 100%)',
        borderRadius: '20px',
        padding: '40px 20px',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔄</div>
        <p style={{ color: '#666' }}>{t('productCard.loading', 'Generazione scheda prodotto...')}</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(180deg, #f8fdf8 0%, #ffffff 100%)',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      {/* Header with image */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {displayImage ? (
          <img 
            src={displayImage} 
            alt={product.name}
            style={{
              width: '100%',
              height: '180px',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '120px',
            background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '4rem' }}>{product.emoji}</span>
          </div>
        )}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          padding: '40px 20px 20px',
          color: 'white'
        }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{product.category}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {product.emoji} {product.name}
          </div>
          {product.origin && (
            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>📍 {product.origin}</div>
          )}
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {/* MISURAZIONI SPETTROMETRO — Gold bordered card with comparison */}
        {measuredData && (measuredData.calories || measuredData.water || measuredData.protein || measuredData.fat || measuredData.carbs || measuredData.sugar || measuredData.fiber || measuredData.brix) && (() => {
          const isDemo = scanMethod === 'demo' || measuredData?.isDemoData;
          const hasSwitch = switchData?.found && switchData?.nutrition;
          
          return (
            <div style={{
              background: 'linear-gradient(135deg, #fffdf5 0%, #fff8e1 100%)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              border: '2px solid #DAA520',
              boxShadow: '0 4px 16px rgba(218, 165, 32, 0.2)'
            }}>
              {/* Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '1.1rem', 
                  color: '#5D4037',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px' 
                }}>
                  🔬 {t('productCard.scioMeasurements', 'Misurazioni Spettrometro')}
                </h3>
                {isDemo && (
                  <span style={{
                    background: 'linear-gradient(135deg, #DAA520 0%, #B8860B 100%)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap'
                  }}>
                    📊 {language === 'en' ? 'Spectrometer demo data' : 'Dati demo Spettrometro'}
                  </span>
                )}
              </div>
              
              {/* Brix in evidenza se presente */}
              {measuredData.brix > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #DAA520 0%, #B8860B 100%)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '4px' }}>
                    🍯 {language === 'en' ? 'Brix Index (sugar content)' : 'Indice Brix (contenuto zuccherino)'}
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 'bold' }}>
                    {parseFloat(measuredData.brix).toFixed(1)}
                    <span style={{ fontSize: '1rem', fontWeight: 'normal' }}> °Brix</span>
                  </div>
                </div>
              )}
              
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: hasSwitch ? '2fr 1fr 1fr 1.2fr' : '2fr 1fr',
                gap: '8px',
                padding: '8px 0',
                borderBottom: '2px solid rgba(218, 165, 32, 0.3)',
                marginBottom: '4px'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#888', textTransform: 'uppercase' }}>
                  {language === 'en' ? 'Nutrient (per 100 g)' : 'Nutriente (per 100 g)'}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#1565c0', textAlign: 'center', textTransform: 'uppercase' }}>
                  🔬 {language === 'en' ? 'Measured' : 'Misurato'}
                </div>
                {hasSwitch && (
                  <>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#888', textAlign: 'center', textTransform: 'uppercase' }}>
                      📊 {language === 'en' ? 'Average' : 'Media'}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#888', textAlign: 'center', textTransform: 'uppercase' }}>
                      {language === 'en' ? 'Diff' : 'Diff.'}
                    </div>
                  </>
                )}
              </div>
              
              {/* Comparison rows */}
              <ComparisonRow 
                label={language === 'en' ? 'Calories' : 'Calorie'} 
                icon="🔥" 
                scioValue={measuredData.calories} 
                switchValue={hasSwitch ? switchData.nutrition.energy : null} 
                unit="kcal" 
              />
              <ComparisonRow 
                label={language === 'en' ? 'Carbs' : 'Carboidrati'} 
                icon="🍞" 
                scioValue={measuredData.carbs} 
                switchValue={hasSwitch ? switchData.nutrition.carbohydrates : null} 
                unit="g" 
              />
              <ComparisonRow 
                label={language === 'en' ? 'Sugar' : 'Zuccheri'} 
                icon="🍬" 
                scioValue={measuredData.sugar} 
                switchValue={hasSwitch ? switchData.nutrition.soluble : null} 
                unit="g" 
              />
              <ComparisonRow 
                label={language === 'en' ? 'Protein' : 'Proteine'} 
                icon="💪" 
                scioValue={measuredData.protein} 
                switchValue={hasSwitch ? switchData.nutrition.proteins : null} 
                unit="g" 
              />
              <ComparisonRow 
                label={language === 'en' ? 'Fiber' : 'Fibre'} 
                icon="🌾" 
                scioValue={measuredData.fiber} 
                switchValue={hasSwitch ? switchData.nutrition.fiber : null} 
                unit="g" 
              />
              <ComparisonRow 
                label={language === 'en' ? 'Water' : 'Acqua'} 
                icon="💧" 
                scioValue={measuredData.water} 
                switchValue={null} 
                unit="%" 
              />
              
              {/* Legend */}
              {hasSwitch && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '10px', 
                  background: 'rgba(218, 165, 32, 0.08)', 
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  color: '#888',
                  textAlign: 'center'
                }}>
                  <span style={{ color: '#4CAF50' }}>●</span> {language === 'en' ? '≤15% close' : '≤15% vicino'} &nbsp;
                  <span style={{ color: '#FF9800' }}>●</span> {language === 'en' ? '15-35% moderate' : '15-35% moderato'} &nbsp;
                  <span style={{ color: '#f44336' }}>●</span> {language === 'en' ? '>35% far' : '>35% distante'}
                  <div style={{ marginTop: '4px' }}>
                    {language === 'en' 
                      ? `Average data: ${switchData.matchedItem} (SWITCH Database)` 
                      : `Dati medi: ${switchData.matchedItem} (Database SWITCH)`}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Vecchia sezione spettrometro singolo valore - manteniamo per °Brix se presente */}
        {measuredValue && !measuredData?.calories && (
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '5px' }}>
              🔬 {t('productCard.scioMeasurement', 'Misurazione Spettrometro')}
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
              {parseFloat(measuredValue).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              {t('productCard.sugarContent', 'Contenuto zuccherino')}
            </div>
            
            {quality && (
              <div style={{
                marginTop: '15px',
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '10px',
                display: 'inline-block'
              }}>
                {quality.icon} {quality.label}
              </div>
            )}
          </div>
        )}

        {/* Nutritional Values */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid #eee'
        }}>
          <h3 style={{ margin: '0 0 15px', color: '#333', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            📊 {t('productCard.nutritionalValues', 'Valori Nutrizionali')}
            <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'normal' }}>
              ({t('productCard.averageValues', 'valori medi')})
            </span>
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {nutrition.calories && <NutrientBox label={t('productCard.calories', 'Calorie')} value={nutrition.calories} unit="kcal per 100 g" icon="🔥" />}
            {nutrition.protein && <NutrientBox label={t('productCard.protein', 'Proteine')} value={nutrition.protein} unit="g per 100 g" icon="💪" />}
            {nutrition.carbs && <NutrientBox label={t('productCard.carbs', 'Carboidrati')} value={nutrition.carbs} unit="g per 100 g" icon="🍞" />}
            {nutrition.fat && <NutrientBox label={t('productCard.fat', 'Grassi')} value={nutrition.fat} unit="g per 100 g" icon="🧈" />}
            {nutrition.fiber && <NutrientBox label={t('productCard.fiber', 'Fibre')} value={nutrition.fiber} unit="g per 100 g" icon="🌾" />}
            {nutrition.sugar && <NutrientBox label={t('productCard.sugar', 'Zuccheri')} value={nutrition.sugar} unit="g per 100 g" icon="🍬" />}
          </div>
          
          {/* Source indicator with matched item */}
          {switchData?.found && (
            <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
              📊 {t('productCard.dataFor', 'Dati per:')} <strong style={{ color: '#1565c0' }}>{switchData.matchedItem}</strong>
              <div style={{ marginTop: '2px' }}>{t('productCard.source', 'Fonte: SWITCH Food Explorer Database')}</div>
            </div>
          )}
        </div>

        {/* Environmental Impact - inside Product Card */}
        {switchData?.found && switchData?.environmental && (
          <div style={{
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#1565c0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🌍 {t('productCard.environmentalImpact', 'Impatto Ambientale')}
            </h3>

            {/* Environmental Score Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                background: switchData.environmental.environmentalScore === 'A' ? '#1b5e20' : 
                           switchData.environmental.environmentalScore === 'B' ? '#4caf50' :
                           switchData.environmental.environmentalScore === 'C' ? '#ffc107' :
                           switchData.environmental.environmentalScore === 'D' ? '#ff9800' : '#f44336',
                color: ['A', 'B', 'D', 'E'].includes(switchData.environmental.environmentalScore) ? '#fff' : '#000',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                {switchData.environmental.environmentalScore}
              </div>
              <div style={{ marginLeft: '12px', textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold', color: '#333', fontSize: '0.9rem' }}>
                  {t('productCard.envScore', 'Punteggio Ambientale')}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#1565c0', fontWeight: '600' }}>
                  {switchData.matchedItem}
                </div>
              </div>
            </div>

            {/* Carbon and Water Footprint */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>🏭</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
                  {switchData.environmental.carbonFootprint?.toFixed(2) || '—'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#666' }}>kg CO₂e per 1 kg</div>
                <div style={{
                  display: 'inline-block',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  marginTop: '6px',
                  background: switchData.environmental.carbonFootprintBanding?.includes('green') ? '#4caf50' : '#ffc107',
                  color: '#fff'
                }}>
                  {switchData.environmental.carbonFootprintImpact || 'N/A'}
                </div>
              </div>

              <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>💧</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
                  {switchData.environmental.waterFootprint?.toFixed(0) || '—'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#666' }}>{language === 'en' ? 'liters per 1 kg' : 'litri per 1 kg'}</div>
                <div style={{
                  display: 'inline-block',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  marginTop: '6px',
                  background: switchData.environmental.waterFootprintBanding?.includes('green') ? '#4caf50' : '#ffc107',
                  color: '#fff'
                }}>
                  {switchData.environmental.waterFootprintImpact || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seasonality */}
        {product.seasonality.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid #eee'
          }}>
            <h3 style={{ margin: '0 0 15px', color: '#333', fontSize: '1.1rem' }}>
              📅 {t('productCard.seasonality', 'Stagionalità')}
            </h3>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {monthNames.map((month, index) => (
                <div 
                  key={month}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    background: product.seasonality.includes(index + 1) ? '#4CAF50' : '#f0f0f0',
                    color: product.seasonality.includes(index + 1) ? 'white' : '#999'
                  }}
                >
                  {month}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {product.tips.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid #eee'
          }}>
            <h3 style={{ margin: '0 0 15px', color: '#333', fontSize: '1.1rem' }}>
              💡 {t('productCard.tips', 'Consigli')}
            </h3>
            {product.tips.map((tip, i) => (
              <div key={i} style={{ 
                padding: '10px 0', 
                borderBottom: i < product.tips.length - 1 ? '1px solid #f0f0f0' : 'none',
                fontSize: '0.9rem',
                color: '#555'
              }}>
                {tip}
              </div>
            ))}
          </div>
        )}

        {/* Pairings */}
        {product.pairings.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid #eee'
          }}>
            <h3 style={{ margin: '0 0 15px', color: '#333', fontSize: '1.1rem' }}>
              🍽️ {t('productCard.pairings', 'Abbinamenti')}
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {product.pairings.map((pairing, i) => (
                <span key={i} style={{
                  padding: '6px 12px',
                  background: '#e3f2fd',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  color: '#1976d2'
                }}>
                  {pairing}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Curiosity */}
        {product.curiosity && (
          <div style={{
            background: 'linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)',
            borderRadius: '16px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 10px', color: '#f57f17', fontSize: '1rem' }}>
              🤓 {t('productCard.didYouKnow', 'Lo sapevi?')}
            </h3>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem', lineHeight: 1.5 }}>
              {product.curiosity}
            </p>
          </div>
        )}
        
        {/* AI Generated indicator */}
        {aiProductInfo?.generated && (
          <div style={{ 
            marginTop: '16px', 
            fontSize: '0.75rem', 
            color: '#999', 
            textAlign: 'center',
            fontStyle: 'italic'
          }}>
            ✨ {t('productCard.aiGenerated', 'Contenuti generati da AI')}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
