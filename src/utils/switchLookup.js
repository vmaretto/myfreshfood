// src/utils/switchLookup.js
// Single place where screens ask SWITCH data for the recognized product or dish.

export async function fetchSwitchData(product) {
  if (!product) return { found: false };

  const body = product.isDish
    ? {
        dishName: product.name,
        ingredients: (product.ingredients || []).map((ing) => ({
          name: ing.name,
          switchItem: ing.switchItem || null,
          grams: ing.grams
        }))
      }
    : {
        nameEn: product.nameEn || product.name,
        switchItem: product.switchItem || null
      };

  const response = await fetch('/api/switch-lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`SWITCH lookup failed (${response.status})`);
  }
  return response.json();
}
