export const publicFiles = ['index.html','styles.css','runtime.js','crypto.js','site-config.js','countdown.js','lodging/index.html','meals/index.html'];
export const privatePages = {lodging:'lodging.html',meals:'meals.html'};
export const privateImages = {'lodging-map.png':'lodging-map.png'};
export const sourceFiles = [...publicFiles.map(p=>'public/'+p), ...Object.values(privatePages).map(p=>'private/'+p), ...Object.values(privateImages).map(p=>'private/'+p),
  'scripts/build.mjs','scripts/check-build.mjs','scripts/config.mjs','firebase.json'];
export const outputFiles = [...publicFiles, 'encrypted-bundle.json'];
// Fail closed for the current site's private names, access fields, addresses, budgets, meal plans and dietary details.
export const forbidden = /Todd(?:\s|&nbsp;)*(?:#|Lane|Ln)|Sparks|17700|17701|17699|Circle(?:\s|&nbsp;)*4|\b(?:Joe|Torin|Jason|Brock|Adrianne|Aron|Adam|Tashia|Cameron|Siggs|Pompel|Foxworthy)\b|\$\s*\d|Reservation\s*ID|Sunriver(?:\s|&nbsp;)*Brewery|satay|sausage|buttermilk|cinnamon|shrimp|lobster|\bcrab\b|allerg|intoleran/i;
