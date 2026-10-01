// src/utils/flowMode.js
// Percorso scelto dopo il riconoscimento:
// 'spectrometer' = quiz + scansione + confronto con misurato e SWITCH
// 'switch'       = quiz + scheda + confronto solo con SWITCH, nessun riferimento allo spettrometro

const KEY = 'flowMode';

export function getFlowMode() {
  try {
    return sessionStorage.getItem(KEY) === 'spectrometer' ? 'spectrometer' : 'switch';
  } catch (e) {
    return 'switch';
  }
}

export function setFlowMode(mode) {
  sessionStorage.setItem(KEY, mode === 'spectrometer' ? 'spectrometer' : 'switch');
  if (mode !== 'spectrometer') {
    // Nessun dato di spettrometro deve arrivare a scheda e confronto
    ['scioResults', 'scioScanData', 'scioImage', 'scanMethod'].forEach((k) => sessionStorage.removeItem(k));
  }
}

export function hasChosenFlow() {
  return !!sessionStorage.getItem(KEY);
}

export const isSpectrometerFlow = () => getFlowMode() === 'spectrometer';
