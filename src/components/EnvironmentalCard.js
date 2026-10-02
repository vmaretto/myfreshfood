// src/components/EnvironmentalCard.js
import React from 'react';
import { useTranslation } from 'react-i18next';

// Color mapping for banding
const bandingColors = {
  'Dark green': { bg: '#1b5e20', text: '#fff', emoji: '🟢' },
  'Light green': { bg: '#4caf50', text: '#fff', emoji: '🟢' },
  'Green': { bg: '#4caf50', text: '#fff', emoji: '🟢' },
  'Yellow': { bg: '#ffc107', text: '#000', emoji: '🟡' },
  'Orange': { bg: '#ff9800', text: '#000', emoji: '🟠' },
  'Red': { bg: '#f44336', text: '#fff', emoji: '🔴' },
};

// Environmental score colors (A-E)
const scoreColors = {
  'A': { bg: '#1b5e20', text: '#fff' },
  'B': { bg: '#4caf50', text: '#fff' },
  'C': { bg: '#ffc107', text: '#000' },
  'D': { bg: '#ff9800', text: '#000' },
  'E': { bg: '#f44336', text: '#fff' },
};

function EnvironmentalCard({ data, loading }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>🌍</div>
        <p style={{ color: '#666', margin: 0 }}>{t('environmental.loading', 'Caricamento dati ambientali...')}</p>
      </div>
    );
  }

  if (!data || !data.found) {
    return null; // Don't show if no data
  }

  const { environmental, matchedItem, matchScore } = data;
  const carbonColor = bandingColors[environmental.carbonFootprintBanding] || bandingColors['Yellow'];
  const waterColor = bandingColors[environmental.waterFootprintBanding] || bandingColors['Yellow'];
  const scoreColor = scoreColors[environmental.environmentalScore] || scoreColors['C'];

  return (
    <div style={{
      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{ margin: '0 0 16px', color: '#1565c0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        🌍 {t('environmental.title', 'Impatto Ambientale')}
        {matchScore < 70 && (
          <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: 'normal' }}>
            ({t('environmental.approximate', 'approssimativo')})
          </span>
        )}
      </h3>

      {/* Environmental Score Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <div style={{
          background: scoreColor.bg,
          color: scoreColor.text,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          {environmental.environmentalScore}
        </div>
        <div style={{ marginLeft: '16px', textAlign: 'left' }}>
          <div style={{ fontWeight: 'bold', color: '#333' }}>
            {t('environmental.envScore', 'Punteggio Ambientale')}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#1565c0', fontWeight: '600' }}>
            {matchedItem || t('environmental.unknown', 'Prodotto non trovato')}
          </div>
        </div>
      </div>

      {/* Carbon and Water Footprint */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Carbon Footprint */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🏭</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#333' }}>
            {environmental.carbonFootprint?.toFixed(2) || '—'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '8px' }}>
            kg CO₂e per 1 kg
          </div>
          <div style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            background: carbonColor.bg,
            color: carbonColor.text
          }}>
            {carbonColor.emoji} {environmental.carbonFootprintImpact || environmental.carbonFootprintBanding}
          </div>
        </div>

        {/* Water Footprint */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>💧</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#333' }}>
            {environmental.waterFootprint?.toFixed(0) || '—'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '8px' }}>
            {t('environmental.litersPerKg', 'litri per 1 kg')}
          </div>
          <div style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            background: waterColor.bg,
            color: waterColor.text
          }}>
            {waterColor.emoji} {environmental.waterFootprintImpact || environmental.waterFootprintBanding}
          </div>
        </div>
      </div>

      {/* Impact explanation - shows matched item */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(255,255,255,0.7)',
        borderRadius: '8px',
        fontSize: '0.8rem',
        color: '#555',
        textAlign: 'center'
      }}>
        💡 {t('environmental.explanation', 'Dati calcolati per 1 kg di prodotto.')}
        {matchedItem && (
          <div style={{ marginTop: '4px', fontWeight: '600', color: '#1565c0' }}>
            📊 {t('environmental.matchedItem', 'Dati per:')} <strong>{matchedItem}</strong>
          </div>
        )}
        <div style={{ marginTop: '4px', fontSize: '0.7rem', color: '#888' }}>
          {t('environmental.source', 'Fonte: SWITCH Food Explorer Database')}
        </div>
      </div>
    </div>
  );
}

export default EnvironmentalCard;
