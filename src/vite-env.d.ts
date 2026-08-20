/// <reference types="vite/client" />

// TypeScript'in noUncheckedSideEffectImports denetiminde CSS yan-etki
// importlarını (ör. Leaflet CSS) geçerli modül olarak tanımlar.
declare module '*.css';
