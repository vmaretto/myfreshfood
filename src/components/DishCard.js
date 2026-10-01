// src/components/DishCard.js
// Scheda di un piatto: impatto della porzione, ingredienti (dati SWITCH), valori nutrizionali,
// e storia/curiosità della ricetta (AI). I numeri vengono SOLO dal DB SWITCH.
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SWITCH_COLORS } from './SwitchLayout';

const fmt = (v, digits = 0) => {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return Number(v).toLocaleString('it-IT', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

function Section({ title, children, background = 'white', border = '1px solid #eee' }) {
  return (
    <div style={{ background, border, borderRadius: '16px', padding: '18px', marginBottom: '16px' }}>
      {title && (
        <h3 style={{ margin: '0 0 14px', color: SWITCH_COLORS.darkBlue, fontSize: '1.05rem' }}>{title}</h3>
      )}
      {children}
    </div>
  );
}

function ImpactTile({ icon, value, unit, label, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '12px 6px',
      textAlign: 'center',
      borderTop: `4px solid ${color}`
    }}>
      <div style={{ fontSize: '1.4rem' }}>{icon}</div>
      <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: SWITCH_COLORS.darkBlue, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: '#666' }}>{unit}</div>
      <div style={{ fontSize: '0.72rem', color: '#444', marginTop: '4px', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function DishCard({ dish, productImage, switchData, loading }) {
  const { i18n } = useTranslation();
  const language = i18n.language || 'it';
  const it = language !== 'en';

  const [info, setInfo] = useState(null);
  const [infoLoading, setInfoLoading] = useState(false);

  const found = switchData?.found;
  const portion = switchData?.portion || {};
  const per100 = switchData?.nutrition || {};
  const ingredients = switchData?.ingredients || [];
  const topIngredient = ingredients.find((i) => i.found && i.co2Share !== null);

  useEffect(() => {
    if (!dish?.name || loading) return;
    let cancelled = false;
    const load = async () => {
      setInfoLoading(true);
      try {
        const response = await fetch('/api/dish-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dishName: dish.name,
            ingredients: (dish.ingredients || []).map((i) => i.name),
            topCo2Ingredient: topIngredient?.name || null,
            language
          })
        });
        if (response.ok && !cancelled) setInfo(await response.json());
      } catch (error) {
        console.error('Error fetching dish info:', error);
      } finally {
        if (!cancelled) setInfoLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
    // topIngredient depends on switchData: wait for it so the green tip can name it
  }, [dish?.name, language, loading, topIngredient?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const co2Grams = portion.co2 !== null && portion.co2 !== undefined ? portion.co2 * 1000 : null;

  return (
    <div>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${SWITCH_COLORS.darkBlue} 0%, #2d5a8f 100%)`,
        borderRadius: '16px',
        padding: '18px',
        color: 'white',
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        {productImage ? (
          <img src={productImage} alt={dish.name} style={{
            width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px'
          }} />
        ) : (
          <div style={{ fontSize: '3rem' }}>{dish.emoji || '🍽️'}</div>
        )}
        <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{dish.emoji} {dish.name}</div>
        {(info?.origin || dish.category) && (
          <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px' }}>
            {info?.origin ? `📍 ${info.origin}` : ''}{info?.origin && dish.category ? ' · ' : ''}{dish.category || ''}
          </div>
        )}
        {portion.grams > 0 && (
          <div style={{
            display: 'inline-block', marginTop: '10px', padding: '4px 12px', borderRadius: '20px',
            background: 'rgba(255,255,255,0.15)', fontSize: '0.8rem'
          }}>
            {it ? `Porzione stimata: ${portion.grams} g` : `Estimated portion: ${portion.grams} g`}
          </div>
        )}
      </div>

      {loading && (
        <Section>
          <div style={{ textAlign: 'center', color: '#666' }}>
            🔄 {it ? 'Calcolo i valori dal database SWITCH...' : 'Computing values from the SWITCH database...'}
          </div>
        </Section>
      )}

      {!loading && !found && (
        <Section>
          <div style={{ textAlign: 'center', color: '#856404' }}>
            ⚠️ {it
              ? 'Nessun ingrediente di questo piatto è presente nel database SWITCH.'
              : 'None of the ingredients of this dish is in the SWITCH database.'}
          </div>
        </Section>
      )}

      {!loading && found && (
        <>
          {/* Impatto della porzione */}
          <Section
            title={`🌍 ${it ? 'Impatto della tua porzione' : 'Impact of your portion'}`}
            background="linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 100%)"
            border="none"
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <ImpactTile icon="🏭" value={fmt(co2Grams)} unit="g CO₂e" label={it ? 'Emissioni' : 'Emissions'} color="#95E1A3" />
              <ImpactTile icon="💧" value={fmt(portion.water)} unit={it ? 'litri' : 'liters'} label={it ? 'Acqua' : 'Water'} color="#4FC3F7" />
              <ImpactTile icon="🔥" value={fmt(portion.energy)} unit="kcal" label={it ? 'Energia' : 'Energy'} color="#FF6B6B" />
            </div>
            {topIngredient && topIngredient.co2Share >= 30 && (
              <div style={{ marginTop: '12px', fontSize: '0.85rem', color: SWITCH_COLORS.darkBlue, textAlign: 'center' }}>
                {it
                  ? <>Da solo, <strong>{topIngredient.name}</strong> pesa il <strong>{topIngredient.co2Share}%</strong> delle emissioni del piatto.</>
                  : <><strong>{topIngredient.name}</strong> alone accounts for <strong>{topIngredient.co2Share}%</strong> of the dish emissions.</>}
              </div>
            )}
          </Section>

          {/* Ingredienti */}
          <Section title={`🧾 ${it ? 'Ingredienti riconosciuti' : 'Recognized ingredients'}`}>
            {ingredients.map((ing, idx) => (
              <div key={`${ing.name}-${idx}`} style={{ padding: '10px 0', borderBottom: idx < ingredients.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                  <div style={{ fontWeight: 600, color: '#333' }}>
                    {ing.name} <span style={{ fontWeight: 400, color: '#888', fontSize: '0.85rem' }}>· {fmt(ing.grams)} g</span>
                  </div>
                  {ing.found ? (
                    <div style={{ fontSize: '0.8rem', color: '#555', whiteSpace: 'nowrap' }}>
                      {fmt(ing.co2 * 1000)} g CO₂e
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: '#b26a00' }}>{it ? 'non in SWITCH' : 'not in SWITCH'}</div>
                  )}
                </div>
                {ing.found && (
                  <>
                    <div style={{ height: '8px', background: '#eef2f5', borderRadius: '4px', marginTop: '6px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.max(2, ing.co2Share || 0)}%`,
                        height: '100%',
                        background: (ing.co2Share || 0) >= 40 ? '#f44336' : (ing.co2Share || 0) >= 20 ? '#ff9800' : SWITCH_COLORS.green
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#888', marginTop: '3px' }}>
                      <span>SWITCH: {ing.matchedItem}</span>
                      <span>{fmt(ing.nutrition?.energy)} kcal · {fmt(ing.water)} L</span>
                    </div>
                  </>
                )}
              </div>
            ))}
            {switchData.coverage < 100 && (
              <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '8px' }}>
                {it
                  ? `I valori coprono il ${switchData.coverage}% del peso del piatto (ingredienti presenti in SWITCH).`
                  : `Values cover ${switchData.coverage}% of the dish weight (ingredients found in SWITCH).`}
              </div>
            )}
          </Section>

          {/* Valori nutrizionali */}
          <Section title={`📊 ${it ? 'Valori nutrizionali' : 'Nutrition facts'}`}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '6px', fontSize: '0.9rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase' }}></div>
              <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', textAlign: 'right' }}>{it ? 'Porzione' : 'Portion'}</div>
              <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', textAlign: 'right' }}>100 g</div>
              {[
                ['🔥', it ? 'Energia' : 'Energy', 'energy', 'kcal', 0],
                ['💪', it ? 'Proteine' : 'Protein', 'proteins', 'g', 1],
                ['🍞', it ? 'Carboidrati' : 'Carbs', 'carbohydrates', 'g', 1],
                ['🍬', it ? 'di cui zuccheri' : 'of which sugars', 'soluble', 'g', 1],
                ['🧈', it ? 'Grassi' : 'Fat', 'fat', 'g', 1],
                ['🌾', it ? 'Fibre' : 'Fiber', 'fiber', 'g', 1],
              ].map(([icon, label, key, unit, digits]) => (
                <React.Fragment key={key}>
                  <div style={{ color: '#444' }}>{icon} {label}</div>
                  <div style={{ textAlign: 'right', fontWeight: 600, color: SWITCH_COLORS.darkBlue }}>{fmt(portion[key], digits)} {unit}</div>
                  <div style={{ textAlign: 'right', color: '#666' }}>{fmt(per100[key], digits)} {unit}</div>
                </React.Fragment>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* Storia e curiosità */}
      <Section
        title={`📜 ${it ? 'Storia e curiosità' : 'History and curiosities'}`}
        background="linear-gradient(135deg, #fff8e1 0%, #fffdf5 100%)"
        border={`1px solid ${SWITCH_COLORS.gold}60`}
      >
        {infoLoading && !info && (
          <div style={{ color: '#666', textAlign: 'center' }}>
            ✨ {it ? 'Cerco la storia di questo piatto...' : 'Looking up the story of this dish...'}
          </div>
        )}
        {!infoLoading && !info && (
          <div style={{ color: '#999', textAlign: 'center', fontSize: '0.9rem' }}>
            {it ? 'Storia non disponibile al momento.' : 'Story not available right now.'}
          </div>
        )}
        {info && (
          <div style={{ color: '#333', fontSize: '0.92rem', lineHeight: 1.5 }}>
            {info.history && <p style={{ marginTop: 0 }}>{info.history}</p>}
            {info.funFact && (
              <div style={{ background: 'white', borderRadius: '10px', padding: '10px 12px', margin: '10px 0', borderLeft: `4px solid ${SWITCH_COLORS.gold}` }}>
                😄 {info.funFact}
              </div>
            )}
            {info.curiosities.length > 0 && (
              <>
                <div style={{ fontWeight: 700, color: SWITCH_COLORS.darkBlue, margin: '12px 0 6px' }}>💡 {it ? 'Lo sapevi?' : 'Did you know?'}</div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {info.curiosities.map((c, i) => <li key={i} style={{ marginBottom: '6px' }}>{c}</li>)}
                </ul>
              </>
            )}
            {info.variants.length > 0 && (
              <>
                <div style={{ fontWeight: 700, color: SWITCH_COLORS.darkBlue, margin: '12px 0 6px' }}>🗺️ {it ? 'Varianti' : 'Variants'}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {info.variants.map((v, i) => (
                    <span key={i} style={{ background: 'white', border: '1px solid #eee', borderRadius: '14px', padding: '4px 10px', fontSize: '0.8rem' }}>{v}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Section>

      {info?.greenTip && (
        <Section title={`🌱 ${it ? 'Un consiglio più sostenibile' : 'A greener tip'}`} background="#e8f5e9" border="none">
          <div style={{ fontSize: '0.92rem', color: '#2e5e33' }}>{info.greenTip}</div>
        </Section>
      )}

      <div style={{ fontSize: '0.72rem', color: '#999', textAlign: 'center', marginBottom: '16px', lineHeight: 1.5 }}>
        {it
          ? 'Ingredienti e grammi stimati dall\'AI dalla foto. Valori nutrizionali e ambientali: database SWITCH Food Explorer, sommati sugli ingredienti. Storia e curiosità generate dall\'AI.'
          : 'Ingredients and grams estimated by AI from the photo. Nutritional and environmental values: SWITCH Food Explorer database, summed over the ingredients. History and curiosities generated by AI.'}
      </div>
    </div>
  );
}

export default DishCard;
