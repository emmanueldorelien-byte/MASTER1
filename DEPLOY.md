Preparar y desplegar en Vercel

Pasos rápidos:

1) Añadir variables de entorno en Vercel
- Abre Vercel Dashboard → tu proyecto → Settings → Environment Variables
- Crea las variables del archivo `.env.example` (asegúrate de marcar Production + Preview + Development)
- Variables obligatorias: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

2) Configuración de build
- Vercel ya está configurado para usar:
  - Install Command: `npm install`
  - Build Command: `npm run build`
- `package.json` incluye `build` que ejecuta `vite build` y el script `scripts/patch-vercel-output.mjs` para adaptar la salida Nitro a Vercel.

3) Versión de Node
- Recomendado: usar Node 20+. Se añadió `engines.node: ">=20"` en `package.json`.
- En Vercel, en Settings → General → Node.js Version, selecciona `20.x` si quieres forzarlo.

4) Qué esperar del build
- El proyecto usa Nitro/Vite y está preparado para el "Vercel Build Output API" (generará `.vercel/output`).
- El script `scripts/patch-vercel-output.mjs` ajusta el handler para compatibilidad y runtime Node 20.

5) Desplegar
- Push a tu repo y crea un nuevo Deploy en Vercel o redeploy desde la interfaz.

6) Post-deploy / debugging
- Si ves errores 500 relacionados con supabase, revisa que las 6 variables obligatorias estén correctamente configuradas.
- Para logs de runtime usa Vercel → Deployments → View Functions logs.

Notas adicionales
- Si quieres probar localmente SSR: `npm run build` y luego `npm run preview` (requiere `nitro` en devDependencies). 
- Mantén actualizado `scripts/patch-vercel-output.mjs` si cambias la estructura de salida de Nitro.

Si quieres, realizo estos cambios adicionales automáticamente:
- Forzar `node` en `engines` (ya aplicado).
- Añadir un archivo `vercel.env` de ejemplo (opcional).
- Comprobar que `vercel.json` incluya `buildCommand` e `installCommand` (ya está).

Dime si quieres que cree `vercel.env` o actualice algo más.
