# Incubba Ñuble UBB · Plataforma de Evaluación (Next.js)

Reescritura en Next.js + PostgreSQL (Supabase) de la plataforma de evaluación
y registro de postulaciones de Incubba Ñuble UBB, pensada para desplegarse en
Vercel. Es la misma lógica y rúbrica de la versión Streamlit original, con
identidad visual actualizada.

Para la guía completa de despliegue paso a paso (sin conocimientos de
programación), revisa el documento Word que se entrega junto a este proyecto:
**Guía de despliegue en Vercel**.

## Resumen técnico

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **PostgreSQL** vía Supabase, usando el *Connection Pooler* (compatible con
  el entorno serverless de Vercel)
- **NextAuth (Auth.js)** con usuario/contraseña propios (bcrypt), sesiones JWT
- **Recharts** para el dashboard de estadísticas
- Sin ORM: acceso a datos con SQL directo (`postgres` / postgres.js) — ver
  `sql/schema.sql` para crear las tablas una sola vez en Supabase

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completa DATABASE_URL y AUTH_SECRET
npm run dev
```

Antes de la primera ejecución, corre el contenido de `sql/schema.sql` en el
SQL Editor de tu proyecto Supabase (crea las tablas si no existen).

## Estructura relevante

- `sql/schema.sql` — DDL de las tablas (usuarios, postulaciones, evaluaciones,
  bonificaciones_manuales, configuracion)
- `src/lib/rubric.ts` — rúbrica oficial de las bases (etapas, criterios,
  niveles, bonificación por potencial dinámico)
- `src/lib/scoring.ts` — motor de cálculo de puntajes y ranking
- `src/lib/importer.ts` — importador de CSV con sugerencia automática de
  columnas
- `src/app/(dashboard)/*` — páginas: Inicio, Postulaciones, Evaluación,
  Resultados, Estadísticas, Configuración
- `src/app/login` — página de acceso
