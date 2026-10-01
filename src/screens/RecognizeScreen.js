// src/screens/RecognizeScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SwitchLayout, { SWITCH_COLORS } from '../components/SwitchLayout';
import GlobalProgress from '../components/GlobalProgress';
import { setFlowMode } from '../utils/flowMode';

// Product name translations
const productNames = {
  'pomodoro': { it: 'Pomodoro', en: 'Tomato' },
  'pomodoro ciliegino': { it: 'Pomodoro ciliegino', en: 'Cherry tomato' },
  'mela': { it: 'Mela', en: 'Apple' },
  'mela fuji': { it: 'Mela Fuji', en: 'Fuji Apple' },
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
  'broccolo': { it: 'Broccolo', en: 'Broccoli' },
  'cavolfiore': { it: 'Cavolfiore', en: 'Cauliflower' },
  'patata': { it: 'Patata', en: 'Potato' },
  'cipolla': { it: 'Cipolla', en: 'Onion' },
  'aglio': { it: 'Aglio', en: 'Garlic' },
};

const categoryNames = {
  'frutta': { it: 'frutta', en: 'fruit' },
  'verdura': { it: 'verdura', en: 'vegetable' },
  'ortaggio': { it: 'ortaggio', en: 'vegetable' },
  'fruit': { it: 'frutta', en: 'fruit' },
  'vegetable': { it: 'verdura', en: 'vegetable' },
};

function RecognizeScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const language = i18n.language || 'it';
  
  const translateProductName = (name) => {
    if (!name) return '';
    const key = name.toLowerCase().trim();
    const translation = productNames[key];
    if (translation) {
      return i18n.language === 'en' ? translation.en : translation.it;
    }
    return name;
  };
  
  const translateCategory = (category) => {
    if (!category) return '';
    const key = category.toLowerCase().trim();
    const translation = categoryNames[key];
    if (translation) {
      return i18n.language === 'en' ? translation.en : translation.it;
    }
    return category;
  };
  
  const translateConfidence = (confidence) => {
    if (!confidence) return '';
    const key = confidence.toLowerCase().trim();
    if (key === 'alta' || key === 'high') return t('recognize.confidence.high');
    if (key === 'media' || key === 'medium') return t('recognize.confidence.medium');
    if (key === 'bassa' || key === 'low') return t('recognize.confidence.low');
    return confidence;
  };
  
  const fileInputRef = useRef(null);
  
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recognized, setRecognized] = useState(null);
  
  // Demo products gallery state
  const [demoProducts, setDemoProducts] = useState([]);
  const [loadingDemoProducts, setLoadingDemoProducts] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Fetch demo products on mount
    fetchDemoProducts();
  }, []);
  
  const fetchDemoProducts = async () => {
    try {
      setLoadingDemoProducts(true);
      const response = await fetch('/api/demo-products');
      if (response.ok) {
        const data = await response.json();
        setDemoProducts(data);
      }
    } catch (err) {
      console.error('Error fetching demo products:', err);
    } finally {
      setLoadingDemoProducts(false);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setError(null);
      setRecognized(null);
      
      // Usa Object URL per l'anteprima (più efficiente e compatibile con Safari)
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current.click();
  };

  const compressImage = (file, maxWidth = 800) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
      };
    });
  };

  const handleRecognize = async () => {
    if (!image) {
      setError(t('recognize.noImage'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const base64Image = await compressImage(image, 800);
        
      const response = await fetch('/api/recognize-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Recognition failed');
      }

      const data = await response.json();
      setRecognized(data);
      
      sessionStorage.setItem('recognizedProduct', JSON.stringify(data));
      sessionStorage.setItem('productImage', base64Image);
      
      setLoading(false);
    } catch (err) {
      console.error('Error recognizing product:', err);
      setError(t('recognize.error') + ': ' + err.message);
      setLoading(false);
    }
  };
  
  // Handle demo product selection
  // Map Italian demo product names to English for SWITCH DB lookup
  // No manual IT→EN map needed — switch-lookup API handles translation automatically
  // via the comprehensive food-translations.js dictionary

  const handleSelectDemoProduct = (product) => {
    // Create recognized product object from demo product
    const recognizedData = {
      name: product.name,
      nameEn: product.name, // Backend translates IT→EN automatically
      category: product.category,
      emoji: product.emoji,
      confidence: 'alta',
      isDemoProduct: true,
      demoProductId: product.id,
      scioData: {
        brix: product.scio_brix,
        calories: product.scio_calories,
        carbs: product.scio_carbs,
        sugar: product.scio_sugar,
        water: product.scio_water,
        protein: product.scio_protein,
        fiber: product.scio_fiber
      }
    };
    
    setRecognized(recognizedData);
    sessionStorage.setItem('recognizedProduct', JSON.stringify(recognizedData));
    
    // If demo product has an image, use it
    if (product.image_base64) {
      sessionStorage.setItem('productImage', product.image_base64);
      setImagePreview(product.image_base64);
    } else {
      // Clear product image for demo products without image
      sessionStorage.removeItem('productImage');
      setImagePreview(null);
    }
  };

  // Piatti: l'utente può correggere ingredienti e grammi prima del quiz
  const updateIngredients = (ingredients) => {
    const updated = { ...recognized, ingredients };
    setRecognized(updated);
    sessionStorage.setItem('recognizedProduct', JSON.stringify(updated));
    sessionStorage.removeItem('switchData');
  };

  const changeIngredient = (index, field, value) => {
    const ingredients = recognized.ingredients.map((ing, i) => {
      if (i !== index) return ing;
      // Renaming means a different food: let the server match it again
      if (field === 'name') return { ...ing, name: value, switchItem: null };
      return { ...ing, [field]: value };
    });
    updateIngredients(ingredients);
  };

  const removeIngredient = (index) => {
    updateIngredients(recognized.ingredients.filter((_, i) => i !== index));
  };

  const addIngredient = () => {
    updateIngredients([...(recognized.ingredients || []), { name: '', switchItem: null, grams: 50 }]);
  };

  // Nuovo flusso: dopo riconoscimento → quiz
  // Piatti → senza spettrometro; prodotti singoli (demo o foto) → con spettrometro
  const suggestedMode = recognized && !recognized.isDish ? 'spectrometer' : 'switch';

  const handleChooseFlow = (mode) => {
    setFlowMode(mode);
    sessionStorage.removeItem('quizProgress');
    navigate('/quiz');
  };

  return (
    <SwitchLayout 
      title={`📸 ${t('recognize.title')}`}
      subtitle={language === 'it' ? 'Fotografa un prodotto o un piatto' : 'Take a photo of a product or a dish'}
      compact={true}
    >
      <GlobalProgress currentStep="recognize" language={language} />

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

      <p style={{ color: '#666', marginBottom: '20px', textAlign: 'center' }}>
        {t('recognize.instructions')}
      </p>

      {/* Loading state while gallery loads */}
      {!recognized && !loading && loadingDemoProducts && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: SWITCH_COLORS.darkBlue
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔄</div>
          <p style={{ fontSize: '1rem', fontWeight: '500' }}>
            {language === 'it' ? 'Caricamento prodotti...' : 'Loading products...'}
          </p>
        </div>
      )}

      {/* Demo Products Gallery - SHOW FIRST, PROMINENTLY */}
      {!recognized && !loading && !loadingDemoProducts && demoProducts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '16px',
            padding: '12px 16px',
            background: `linear-gradient(135deg, ${SWITCH_COLORS.darkBlue} 0%, #2d5a8f 100%)`,
            borderRadius: '12px',
            color: 'white'
          }}>
            <span style={{ fontSize: '1rem', fontWeight: '700' }}>
              🌟 {language === 'it' ? 'Prodotti dimostrativi' : 'Demo products'}
            </span>
          </div>
          
          {/* Horizontal scrollable gallery - enhanced */}
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '16px',
            padding: '12px 8px 16px 8px',
            marginBottom: '16px',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none'
          }}>
            {demoProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleSelectDemoProduct(product)}
                style={{
                  flex: '0 0 auto',
                  width: '130px',
                  minHeight: '160px',
                  padding: '16px 12px',
                  background: 'white',
                  border: `3px solid ${SWITCH_COLORS.gold}`,
                  borderRadius: '18px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: `0 6px 20px ${SWITCH_COLORS.gold}25`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 25px ${SWITCH_COLORS.gold}40`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = `0 6px 20px ${SWITCH_COLORS.gold}25`;
                }}
              >
                {/* Premium badge */}
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: SWITCH_COLORS.green,
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  border: '2px solid white'
                }}>
                  ✓
                </div>
                
                {product.image_base64 ? (
                  <img 
                    src={product.image_base64} 
                    alt={product.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      marginBottom: '8px'
                    }}
                  />
                ) : (
                  <div style={{ 
                    fontSize: '2.5rem', 
                    marginBottom: '10px',
                    lineHeight: 1
                  }}>
                    {product.emoji || '🥬'}
                  </div>
                )}
                <div style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: '700',
                  color: SWITCH_COLORS.darkBlue,
                  marginBottom: '8px',
                  lineHeight: '1.2',
                  minHeight: '35px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {translateProductName(product.name)}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'white',
                  fontWeight: '700',
                  background: SWITCH_COLORS.green,
                  padding: '4px 10px',
                  borderRadius: '15px',
                  display: 'inline-block',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}>
                  ✓ Demo
                </div>
              </div>
            ))}
          </div>
          
          <p style={{ 
            fontSize: '0.85rem', 
            color: SWITCH_COLORS.darkBlue, 
            textAlign: 'center',
            margin: '0 0 20px 0',
            fontWeight: '600',
            background: `${SWITCH_COLORS.green}15`,
            padding: '8px 16px',
            borderRadius: '20px',
            border: `1px solid ${SWITCH_COLORS.green}30`
          }}>
            👆 {language === 'it' 
              ? 'Tocca un prodotto per iniziare subito!' 
              : 'Tap a product to start right away!'}
          </p>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '24px 0',
            color: '#999',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            <hr style={{ 
              flex: 1, 
              border: 'none', 
              borderTop: `2px solid ${SWITCH_COLORS.gold}30`
            }} />
            <span style={{ 
              padding: '0 20px',
              background: 'white'
            }}>
              {language === 'it' ? 'oppure scatta una foto' : 'or take a photo'}
            </span>
            <hr style={{ 
              flex: 1, 
              border: 'none', 
              borderTop: `2px solid ${SWITCH_COLORS.gold}30`
            }} />
          </div>
        </div>
      )}

      {/* Camera/Upload Area - NOW SECONDARY, hidden while gallery loads */}
      {loadingDemoProducts ? null : <div 
        onClick={handleCameraClick}
        style={{
          border: `3px dashed ${SWITCH_COLORS.gold}`,
          borderRadius: '16px',
          padding: '40px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: imagePreview ? '10px' : '20px',
          backgroundColor: imagePreview ? 'transparent' : SWITCH_COLORS.lightBg,
          transition: 'all 0.3s ease'
        }}
      >
        {imagePreview ? (
          <img 
            src={imagePreview} 
            alt="Product" 
            style={{
              maxWidth: '100%',
              maxHeight: '250px',
              borderRadius: '8px'
            }}
          />
        ) : (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📷</div>
            <p style={{ color: SWITCH_COLORS.darkBlue, margin: 0, fontWeight: '500' }}>
              {t('recognize.tapToPhoto')}
            </p>
          </>
        )}
      </div>}

      {/* Change Photo Button */}
      {imagePreview && !recognized && (
        <button
          onClick={handleCameraClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '10px',
            marginBottom: '20px',
            background: '#fff',
            border: `2px solid ${SWITCH_COLORS.gold}`,
            borderRadius: '8px',
            color: SWITCH_COLORS.darkBlue,
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '500'
          }}
        >
          🔄 {t('recognize.changePhoto')}
        </button>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {error && (
        <div style={{
          background: '#ffebee',
          color: '#c62828',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {!recognized && (
        <button 
          onClick={handleRecognize}
          disabled={!image || loading}
          style={{ 
            width: '100%',
            padding: '16px',
            fontSize: '1.1rem',
            fontWeight: '600',
            color: 'white',
            background: (!image || loading) ? '#ccc' : SWITCH_COLORS.green,
            border: 'none',
            borderRadius: '12px',
            cursor: (!image || loading) ? 'not-allowed' : 'pointer',
            boxShadow: (!image || loading) ? 'none' : `0 4px 12px ${SWITCH_COLORS.green}50`
          }}
        >
          {loading ? t('recognize.analyzing') : t('recognize.recognize')}
        </button>
      )}

      {loading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            margin: '0 auto',
            border: '4px solid #e0e0e0',
            borderTopColor: SWITCH_COLORS.gold,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#666', marginTop: '10px' }}>
            {t('recognize.processing')}
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Demo Products Gallery - Only show when not recognized */}
      {/* Gallery moved above camera section */}

      {/* Recognition Result */}
      {recognized && (
        <div style={{ marginTop: '20px' }}>
          <div style={{
            background: `linear-gradient(135deg, ${SWITCH_COLORS.gold}20 0%, ${SWITCH_COLORS.gold}10 100%)`,
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            textAlign: 'center',
            border: `2px solid ${SWITCH_COLORS.gold}`
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>
              {recognized.emoji || '🥬'}
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: SWITCH_COLORS.darkBlue }}>
              {translateProductName(recognized.name) || t('recognize.recognized')}
            </h3>
            {recognized.confidence && (
              <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                {t('recognize.confidence')}: {translateConfidence(recognized.confidence)}
              </p>
            )}
            {recognized.category && (
              <p style={{ margin: '8px 0 0 0', color: '#888', fontSize: '0.85rem' }}>
                {t('recognize.category')}: {translateCategory(recognized.category)}
              </p>
            )}
            {/* Demo product badge */}
            {recognized.isDemoProduct && (
              <div style={{
                marginTop: '12px',
                padding: '6px 12px',
                background: SWITCH_COLORS.green + '20',
                borderRadius: '20px',
                display: 'inline-block',
                fontSize: '0.75rem',
                color: SWITCH_COLORS.green,
                fontWeight: '600'
              }}>
                ✓ {language === 'it' ? 'Prodotto dimostrativo' : 'Demo product'}
              </div>
            )}
          </div>

          {/* Retry button if wrong recognition */}
          <button
            onClick={() => {
              setRecognized(null);
              setImage(null);
              setImagePreview(null);
              sessionStorage.removeItem('recognizedProduct');
              sessionStorage.removeItem('productImage');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px',
              marginBottom: '16px',
              background: '#fff',
              border: `2px solid ${SWITCH_COLORS.gold}`,
              borderRadius: '8px',
              color: SWITCH_COLORS.darkBlue,
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            🔄 {t('recognize.wrongProduct')}
          </button>

          {/* Piatto: ingredienti riconosciuti, modificabili */}
          {recognized.isDish && (
            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '16px'
            }}>
              <div style={{ fontWeight: 700, color: SWITCH_COLORS.darkBlue, marginBottom: '4px' }}>
                🧾 {language === 'it' ? 'Ingredienti della porzione' : 'Ingredients of the portion'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '10px' }}>
                {language === 'it'
                  ? 'Stimati dall\'AI. Correggi se qualcosa non torna.'
                  : 'Estimated by AI. Fix anything that looks wrong.'}
              </div>
              {recognized.ingredients.map((ing, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <input
                    value={ing.name}
                    onChange={(e) => changeIngredient(idx, 'name', e.target.value)}
                    placeholder={language === 'it' ? 'Ingrediente' : 'Ingredient'}
                    style={{ flex: 1, minWidth: 0, padding: '8px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '0.9rem' }}
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={ing.grams}
                    onChange={(e) => changeIngredient(idx, 'grams', e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '64px', padding: '8px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'right' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>g</span>
                  <button
                    onClick={() => removeIngredient(idx)}
                    aria-label={language === 'it' ? 'Rimuovi' : 'Remove'}
                    style={{ border: 'none', background: '#fdecea', color: '#c62828', borderRadius: '8px', width: '32px', height: '34px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={addIngredient}
                style={{
                  width: '100%', padding: '8px', marginTop: '4px', background: 'transparent',
                  border: `1px dashed ${SWITCH_COLORS.darkBlue}`, borderRadius: '8px',
                  color: SWITCH_COLORS.darkBlue, cursor: 'pointer', fontSize: '0.9rem'
                }}
              >
                + {language === 'it' ? 'Aggiungi ingrediente' : 'Add ingredient'}
              </button>
            </div>
          )}

          {/* Scelta del percorso: con o senza spettrometro */}
          <div style={{ fontWeight: 700, color: SWITCH_COLORS.darkBlue, textAlign: 'center', margin: '8px 0 12px' }}>
            {language === 'it' ? 'Come vuoi proseguire?' : 'How do you want to continue?'}
          </div>
          {[
            {
              mode: 'switch',
              icon: '🍽️',
              title: language === 'it' ? 'Scopri il piatto' : 'Discover the dish',
              text: language === 'it'
                ? 'Quiz, impatto ambientale, ingredienti, storia e curiosità. Confronto con il database SWITCH.'
                : 'Quiz, environmental impact, ingredients, history and curiosities. Compared with the SWITCH database.'
            },
            {
              mode: 'spectrometer',
              icon: '🔬',
              title: language === 'it' ? 'Con lo spettrometro' : 'With the spectrometer',
              text: language === 'it'
                ? 'Quiz e misura dei valori reali con lo spettrometro, poi confronto con SWITCH.'
                : 'Quiz and real measurement with the spectrometer, then comparison with SWITCH.'
            }
          ].map((option) => {
            const suggested = option.mode === suggestedMode;
            return (
              <button
                key={option.mode}
                onClick={() => handleChooseFlow(option.mode)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 16px',
                  marginBottom: '10px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: suggested ? 'none' : `2px solid ${SWITCH_COLORS.green}`,
                  background: suggested ? SWITCH_COLORS.green : 'white',
                  color: suggested ? 'white' : SWITCH_COLORS.darkBlue,
                  boxShadow: suggested ? `0 4px 12px ${SWITCH_COLORS.green}50` : 'none'
                }}
              >
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {option.icon} {option.title} →
                  {suggested && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, marginLeft: '8px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.25)' }}>
                      {language === 'it' ? 'consigliato' : 'suggested'}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.82rem', marginTop: '4px', opacity: 0.9 }}>{option.text}</div>
              </button>
            );
          })}
        </div>
      )}
      
      <style>{`
        /* Hide scrollbar for mobile gallery */
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </SwitchLayout>
  );
}

export default RecognizeScreen;
