// src/screens/AdminProductsScreen.js
// Admin backoffice for managing demo products with spectrometer data
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2, Plus, Save, X, RefreshCw } from 'lucide-react';

const SWITCH_COLORS = {
  gold: '#FFC300',
  darkBlue: '#1E3A5F',
  green: '#28A745',
  lightBg: '#F8F9FA',
  white: '#FFFFFF'
};

const ADMIN_PASSWORD = 'switch2026';

const emptyProduct = {
  name: '',
  category: 'vegetable',
  emoji: '🥬',
  image_base64: '',
  scio_brix: '',
  scio_calories: '',
  scio_carbs: '',
  scio_sugar: '',
  scio_water: '',
  scio_protein: '',
  scio_fiber: '',
  active: true
};

function AdminProductsScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const scioFileInputRef = useRef(null);
  
  const [authenticated, setAuthenticated] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [scioScreenshot, setScioScreenshot] = useState(null);
  const [analyzingScio, setAnalyzingScio] = useState(false);
  const [scioAnalysisStatus, setScioAnalysisStatus] = useState(null); // { type: 'success'|'error', message: string }

  useEffect(() => {
    // Check if already authenticated in session
    const auth = sessionStorage.getItem('adminAuth');
    if (auth === 'true') {
      setAuthenticated(true);
      fetchProducts();
    } else {
      promptPassword();
    }
  }, []);
  
  const promptPassword = () => {
    const pwd = window.prompt('Inserisci la password admin / Enter admin password:');
    if (pwd === ADMIN_PASSWORD) {
      setAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      fetchProducts();
    } else if (pwd !== null) {
      alert('❌ Password errata / Wrong password');
      navigate('/');
    } else {
      navigate('/');
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/demo-products?all=true');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // Compress image
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 400;
          const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          setFormData(prev => ({ ...prev, image_base64: compressed }));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScioScreenshot = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      setScioScreenshot(dataUrl);
      setScioAnalysisStatus(null);
      setAnalyzingScio(true);
      
      try {
        const response = await fetch('/api/analyze-scio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl })
        });
        
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Analisi fallita');
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Map extracted values to form fields
        setFormData(prev => ({
          ...prev,
          scio_brix: data.brix != null ? String(data.brix) : prev.scio_brix,
          scio_calories: data.calories != null ? String(data.calories) : prev.scio_calories,
          scio_carbs: data.carbs != null ? String(data.carbs) : prev.scio_carbs,
          scio_sugar: data.sugar != null ? String(data.sugar) : prev.scio_sugar,
          scio_water: data.water != null ? String(data.water) : prev.scio_water,
          scio_protein: data.protein != null ? String(data.protein) : prev.scio_protein,
          scio_fiber: data.fiber != null ? String(data.fiber) : prev.scio_fiber,
        }));
        
        const confidenceEmoji = data.confidence === 'high' ? '🟢' : data.confidence === 'medium' ? '🟡' : '🔴';
        const foodInfo = data.foodName ? ` — "${data.foodName}"` : '';
        setScioAnalysisStatus({
          type: 'success',
          message: `${confidenceEmoji} Valori estratti con successo${foodInfo} (affidabilità: ${data.confidence || 'n/a'})`
        });
        
      } catch (err) {
        setScioAnalysisStatus({
          type: 'error',
          message: `❌ Errore: ${err.message}`
        });
      } finally {
        setAnalyzingScio(false);
      }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category) {
      alert('Nome e categoria sono obbligatori');
      return;
    }
    
    setSaving(true);
    
    try {
      const method = editingProduct ? 'PUT' : 'POST';
      // Convert comma decimals to dots for PostgreSQL
      const cleanedData = { ...formData };
      ['scio_brix', 'scio_calories', 'scio_carbs', 'scio_sugar', 'scio_water', 'scio_protein', 'scio_fiber'].forEach(key => {
        if (cleanedData[key] && typeof cleanedData[key] === 'string') {
          cleanedData[key] = cleanedData[key].replace(',', '.');
        }
      });
      const body = editingProduct 
        ? { ...cleanedData, id: editingProduct.id }
        : cleanedData;
      
      const response = await fetch('/api/demo-products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.details || err.error || 'Failed to save product');
      }
      
      await fetchProducts();
      setShowForm(false);
      setEditingProduct(null);
      setFormData(emptyProduct);
      
    } catch (err) {
      alert('Errore: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category: product.category || 'vegetable',
      emoji: product.emoji || '🥬',
      image_base64: product.image_base64 || '',
      scio_brix: product.scio_brix || '',
      scio_calories: product.scio_calories || '',
      scio_carbs: product.scio_carbs || '',
      scio_sugar: product.scio_sugar || '',
      scio_water: product.scio_water || '',
      scio_protein: product.scio_protein || '',
      scio_fiber: product.scio_fiber || '',
      active: product.active !== false
    });
    setScioScreenshot(null);
    setScioAnalysisStatus(null);
    setShowForm(true);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Eliminare "${product.name}"?`)) return;
    
    try {
      const response = await fetch(`/api/demo-products?id=${product.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete');
      await fetchProducts();
    } catch (err) {
      alert('Errore: ' + err.message);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      const response = await fetch('/api/demo-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, active: !product.active })
      });
      if (!response.ok) throw new Error('Failed to update');
      await fetchProducts();
    } catch (err) {
      alert('Errore: ' + err.message);
    }
  };

  const handleSeedProducts = async () => {
    if (!window.confirm('Inserire i prodotti demo di esempio?')) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/seed-demo-products', {
        method: 'POST'
      });
      const data = await response.json();
      alert(data.message);
      await fetchProducts();
    } catch (err) {
      alert('Errore: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <p style={{ color: 'white' }}>Autenticazione in corso...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', color: SWITCH_COLORS.darkBlue, margin: 0 }}>
              🎛️ Gestione Prodotti Demo
            </h1>
            <p style={{ color: '#666', margin: '4px 0 0', fontSize: '0.9rem' }}>
              {products.length} prodotti
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={fetchProducts}
              style={{
                padding: '10px 16px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.9rem'
              }}
            >
              <RefreshCw size={16} /> Aggiorna
            </button>
            
            {products.length === 0 && (
              <button
                onClick={handleSeedProducts}
                style={{
                  padding: '10px 16px',
                  background: SWITCH_COLORS.gold,
                  color: SWITCH_COLORS.darkBlue,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}
              >
                ⚡ Seed Demo
              </button>
            )}
            
            <button
              onClick={() => {
                setEditingProduct(null);
                setFormData(emptyProduct);
                setScioScreenshot(null);
                setScioAnalysisStatus(null);
                setShowForm(true);
              }}
              style={{
                padding: '10px 16px',
                background: SWITCH_COLORS.green,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
            >
              <Plus size={16} /> Nuovo Prodotto
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: '#fee2e2',
            border: '2px solid #ef4444',
            borderRadius: '8px',
            marginBottom: '16px',
            color: '#991b1b'
          }}>
            Errore: {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#666', marginTop: '12px' }}>Caricamento...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Product Form Modal */}
        {showForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{ margin: 0, color: SWITCH_COLORS.darkBlue }}>
                  {editingProduct ? '✏️ Modifica Prodotto' : '➕ Nuovo Prodotto'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={24} color="#666" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                {/* Basic Info */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="es: Broccolo"
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                      Categoria *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="vegetable">🥬 Verdura</option>
                      <option value="fruit">🍎 Frutta</option>
                      <option value="meat">🥩 Carne</option>
                      <option value="fish">🐟 Pesce</option>
                      <option value="cheese">🧀 Formaggi</option>
                      <option value="dairy">🥛 Latticini</option>
                      <option value="bread">🍞 Pane e cereali</option>
                      <option value="legumes">🫘 Legumi</option>
                    </select>
                  </div>
                  
                  <div style={{ width: '100px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                      Emoji
                    </label>
                    <input
                      type="text"
                      value={formData.emoji}
                      onChange={(e) => setFormData(prev => ({ ...prev, emoji: e.target.value }))}
                      placeholder="🥬"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '1.5rem',
                        textAlign: 'center'
                      }}
                    />
                  </div>
                </div>
                
                {/* Image Upload */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Immagine
                  </label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {formData.image_base64 && (
                      <img 
                        src={formData.image_base64} 
                        alt="Preview"
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '10px 16px',
                        background: SWITCH_COLORS.lightBg,
                        border: `2px dashed ${SWITCH_COLORS.gold}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      🖼️ Scegli foto
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    {formData.image_base64 && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image_base64: '' }))}
                        style={{
                          padding: '6px',
                          background: '#fee2e2',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={16} color="#ef4444" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* SCIO Data */}
                <div style={{ 
                  background: SWITCH_COLORS.lightBg, 
                  padding: '16px', 
                  borderRadius: '12px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ margin: '0 0 12px', color: SWITCH_COLORS.darkBlue }}>
                    🔬 Dati Spettrometro (per 100g)
                  </h4>
                  
                  {/* SCIO Screenshot Upload */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {scioScreenshot && (
                        <img 
                          src={scioScreenshot} 
                          alt="Screenshot Spettrometro"
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: `2px solid ${SWITCH_COLORS.gold}`
                          }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => scioFileInputRef.current?.click()}
                        disabled={analyzingScio}
                        style={{
                          padding: '10px 16px',
                          background: analyzingScio ? '#f3f4f6' : SWITCH_COLORS.lightBg,
                          border: `2px dashed ${SWITCH_COLORS.gold}`,
                          borderRadius: '8px',
                          cursor: analyzingScio ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.9rem',
                          color: SWITCH_COLORS.darkBlue,
                          fontWeight: '500'
                        }}
                      >
                        {analyzingScio ? (
                          <>
                            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            Analisi in corso...
                          </>
                        ) : (
                          <>📸 Scegli screenshot spettrometro</>
                        )}
                      </button>
                      <input
                        ref={scioFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleScioScreenshot}
                        style={{ display: 'none' }}
                      />
                      {scioScreenshot && !analyzingScio && (
                        <button
                          type="button"
                          onClick={() => { setScioScreenshot(null); setScioAnalysisStatus(null); }}
                          style={{
                            padding: '6px',
                            background: '#fee2e2',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={16} color="#ef4444" />
                        </button>
                      )}
                    </div>
                    {scioAnalysisStatus && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        background: scioAnalysisStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
                        border: `1px solid ${scioAnalysisStatus.type === 'success' ? '#10b981' : '#ef4444'}`,
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: scioAnalysisStatus.type === 'success' ? '#065f46' : '#991b1b'
                      }}>
                        {scioAnalysisStatus.message}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '12px' 
                  }}>
                    {[
                      { key: 'scio_brix', label: 'Brix (°)', placeholder: 'es: 5.2' },
                      { key: 'scio_calories', label: 'Calorie (kcal)', placeholder: 'es: 34' },
                      { key: 'scio_carbs', label: 'Carboidrati (g)', placeholder: 'es: 6.6' },
                      { key: 'scio_sugar', label: 'Zuccheri (g)', placeholder: 'es: 1.7' },
                      { key: 'scio_water', label: 'Acqua (%)', placeholder: 'es: 89.3' },
                      { key: 'scio_protein', label: 'Proteine (g)', placeholder: 'es: 2.8' },
                      { key: 'scio_fiber', label: 'Fibre (g)', placeholder: 'es: 2.6' },
                    ].map(field => (
                      <div key={field.key}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '4px', 
                          fontSize: '0.85rem',
                          color: '#666'
                        }}>
                          {field.label}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData[field.key]}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            [field.key]: e.target.value 
                          }))}
                          placeholder={field.placeholder}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Active Toggle */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '20px'
                }}>
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="active" style={{ cursor: 'pointer' }}>
                    Prodotto attivo (visibile nella galleria)
                  </label>
                </div>
                
                {/* Submit */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#e5e7eb',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: saving ? '#ccc' : SWITCH_COLORS.green,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Save size={16} />
                    {saving ? 'Salvataggio...' : 'Salva'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && products.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#666'
          }}>
            <p style={{ fontSize: '1.1rem' }}>Nessun prodotto demo</p>
            <p style={{ fontSize: '0.9rem' }}>
              Clicca "Seed Demo" per inserire prodotti di esempio, oppure "Nuovo Prodotto" per crearne uno.
            </p>
          </div>
        )}
        
        {!loading && products.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {products.map(product => (
              <div
                key={product.id}
                style={{
                  border: `2px solid ${product.active ? SWITCH_COLORS.gold : '#e5e7eb'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  background: product.active ? 'white' : '#f9f9f9',
                  opacity: product.active ? 1 : 0.7
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  {product.image_base64 ? (
                    <img 
                      src={product.image_base64}
                      alt={product.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: SWITCH_COLORS.lightBg,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem'
                    }}>
                      {product.emoji || '🥬'}
                    </div>
                  )}
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      margin: 0, 
                      color: SWITCH_COLORS.darkBlue,
                      fontSize: '1.1rem'
                    }}>
                      {product.emoji} {product.name}
                    </h3>
                    <p style={{ 
                      margin: '4px 0 0', 
                      color: '#666',
                      fontSize: '0.85rem'
                    }}>
                      {{
                        'fruit': '🍎 Frutta',
                        'vegetable': '🥬 Verdura',
                        'meat': '🥩 Carne',
                        'fish': '🐟 Pesce',
                        'cheese': '🧀 Formaggi',
                        'dairy': '🥛 Latticini',
                        'bread': '🍞 Pane e cereali',
                        'legumes': '🫘 Legumi'
                      }[product.category] || '🥬 Verdura'}
                    </p>
                    {!product.active && (
                      <span style={{
                        display: 'inline-block',
                        marginTop: '4px',
                        padding: '2px 8px',
                        background: '#fee2e2',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        color: '#ef4444'
                      }}>
                        Disattivo
                      </span>
                    )}
                  </div>
                </div>
                
                {/* SCIO Data Summary */}
                <div style={{
                  background: SWITCH_COLORS.lightBg,
                  padding: '10px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  fontSize: '0.75rem'
                }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '6px',
                    textAlign: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: SWITCH_COLORS.darkBlue }}>
                        {product.scio_brix || '-'}°
                      </div>
                      <div style={{ color: '#888' }}>Brix</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: SWITCH_COLORS.darkBlue }}>
                        {product.scio_sugar || '-'}g
                      </div>
                      <div style={{ color: '#888' }}>Zuccheri</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: SWITCH_COLORS.darkBlue }}>
                        {product.scio_calories || '-'}
                      </div>
                      <div style={{ color: '#888' }}>kcal</div>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleToggleActive(product)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: product.active ? '#fef3c7' : '#d1fae5',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: '500'
                    }}
                  >
                    {product.active ? '⏸️ Disattiva' : '▶️ Attiva'}
                  </button>
                  <button
                    onClick={() => handleEdit(product)}
                    style={{
                      padding: '8px 12px',
                      background: SWITCH_COLORS.gold,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit2 size={14} color={SWITCH_COLORS.darkBlue} />
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    style={{
                      padding: '8px 12px',
                      background: '#fee2e2',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={14} color="#ef4444" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/admin')}
            style={{
              padding: '12px 24px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            ← Torna all'Admin
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminProductsScreen;
