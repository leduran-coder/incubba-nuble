-- =============================================================================
-- Esquema de base de datos · Plataforma Incubba Ñuble UBB
-- =============================================================================
-- Cómo usar este archivo (una sola vez, antes del primer despliegue):
--   1. Entra a tu proyecto en https://supabase.com/dashboard
--   2. Ve al menú "SQL Editor" (ícono de una terminal, en la barra lateral)
--   3. Pega TODO el contenido de este archivo y presiona "Run"
--   4. Deberías ver "Success. No rows returned" - listo, las tablas ya existen.
--
-- Si ya usaste la versión anterior (Streamlit) de la plataforma con este
-- mismo proyecto Supabase, las tablas ya existen y no necesitas hacer nada:
-- todos los "create table if not exists" no tocarán tus datos actuales.
-- =============================================================================

create table if not exists usuarios (
  id serial primary key,
  nombre varchar(200) not null,
  email varchar(200) not null unique,
  password_hash varchar(200) not null,
  rol varchar(20) not null default 'evaluador',
  activo boolean default true,
  -- Independiente de "activo" (que solo controla si puede iniciar sesión):
  -- esta marca decide si las evaluaciones y bonificaciones YA registradas
  -- por este evaluador/a cuentan en los promedios de Resultados,
  -- Estadísticas y los reportes Word. Pensada para cuando hay que cerrar el
  -- proceso y algunos evaluadores no alcanzaron a terminar -- el
  -- administrador/a puede excluirlos del cálculo (para ver cómo queda el
  -- ranking sin ellos) y volver a incluirlos en cualquier momento, sin que
  -- eso afecte si pueden seguir entrando al sistema ni borre ninguna
  -- respuesta ya guardada.
  incluido_en_resultados boolean not null default true,
  creado_en timestamptz default now()
);

-- Si esta tabla ya existía de una convocatoria anterior (creada antes de que
-- esta columna se agregara acá arriba), esto la agrega sin tocar ninguna
-- fila existente -- todas quedan con el valor por defecto "true" (incluidas
-- en el cálculo, como siempre estuvieron hasta ahora).
alter table usuarios add column if not exists incluido_en_resultados boolean not null default true;

create table if not exists postulaciones (
  id serial primary key,
  -- Se usa "text" (sin límite de caracteres) en casi todos los campos en vez
  -- de varchar(N): estos datos vienen de un formulario de Google que no está
  -- bajo nuestro control, y cualquier límite arbitrario (ej. varchar(20))
  -- puede rechazar una fila completa si una respuesta resulta más larga de
  -- lo esperado (por ejemplo, una pregunta de selección múltiple que junta
  -- varias opciones separadas por coma en un solo texto).
  fuente_timestamp text,
  correo text,
  nombres text,
  apellido_paterno text,
  apellido_materno text,
  run text,
  fecha_nacimiento text,
  genero text,
  telefono text,
  residencia_tipo text,
  provincia text,
  comuna text,
  participa_programa_similar text,
  tipo_emprendimiento text,
  estado_detalle text,
  nombre_emprendimiento text,
  nombre_empresa text,
  rut_empresa text,
  tipo_empresa text,
  sector_industria text,
  tamano_empresa text,
  descripcion text,
  propuesta_valor text,
  ha_levantado_financiamiento text,
  detalle_financiamiento text,
  cree_que_es_innovacion text,
  por_que_innovador text,
  tipo_potencial_innovador text,
  tipo_innovacion text,
  alcance_innovacion text,
  sector_area_impacto text,
  resultados_3_anios text,
  impacto_esperado text,
  num_personas_equipo integer,
  descripcion_equipo text,
  video_link text,
  video_link_alternativo text,
  video_password text,
  raw_json text,
  -- Marca que SOLO el administrador puede activar/desactivar (desde la
  -- página "Seguimiento" → "Reportes consolidados por proyecto"): cuando
  -- está en true, la bonificación por potencial dinámico de este proyecto
  -- se fuerza a 0 en todos los cálculos (Resultados, Estadísticas,
  -- reportes), sin importar los factores automáticos declarados en el
  -- formulario ni lo que hayan calificado los evaluadores. Es independiente
  -- de lo que hagan los evaluadores: ellos siguen viendo y usando la
  -- pestaña "Bonificación" con total normalidad, y sus respuestas guardadas
  -- en bonificaciones_manuales nunca se tocan ni se borran por esta marca.
  sin_potencial_dinamico boolean not null default false,
  creado_en timestamptz default now()
);

-- Si esta tabla ya existía de una convocatoria anterior (creada antes de que
-- esta columna se agregara acá arriba), esto la agrega sin tocar ninguna
-- fila existente -- todas quedan con el valor por defecto "false".
alter table postulaciones add column if not exists sin_potencial_dinamico boolean not null default false;

create table if not exists evaluaciones (
  id serial primary key,
  postulacion_id integer not null references postulaciones(id) on delete cascade,
  evaluador_id integer not null references usuarios(id),
  etapa_id varchar(20) not null,
  criterio_id varchar(60) not null,
  nivel_seleccionado varchar(60),
  puntos double precision,
  comentario text,
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now(),
  constraint uq_evaluacion_unica unique (postulacion_id, evaluador_id, etapa_id, criterio_id)
);

create table if not exists bonificaciones_manuales (
  id serial primary key,
  postulacion_id integer not null references postulaciones(id) on delete cascade,
  evaluador_id integer not null references usuarios(id),
  valor_1_a_5 integer,
  madurez_tecnologica_1_a_5 integer,
  escalabilidad_1_a_5 integer,
  traccion_1_a_5 integer,
  comentario text,
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now(),
  constraint uq_bono_manual_unico unique (postulacion_id, evaluador_id)
);

create table if not exists configuracion (
  clave varchar(80) primary key,
  valor_json text not null,
  actualizado_en timestamptz default now()
);

-- Guarda el resultado del "Ranking IA" (Configuración/página exclusiva para
-- administrador/a): una evaluación de referencia generada automáticamente
-- por IA para TODAS las postulaciones, puramente informativa. Una fila por
-- postulación (se reemplaza cada vez que se vuelve a generar para esa misma
-- postulación, por eso "postulacion_id" es la llave primaria). Nunca se lee
-- ni se escribe desde evaluaciones ni bonificaciones_manuales -- vive
-- completamente separada del ranking oficial para no interferir jamás con
-- el trabajo del panel evaluador humano.
create table if not exists ranking_ia (
  postulacion_id integer primary key references postulaciones(id) on delete cascade,
  -- Sugerencias crudas de la IA por criterio/factor (nivel o valor 1-5 +
  -- justificación), guardadas como JSON para poder mostrar el detalle
  -- completo sin tener que volver a llamar a la IA.
  etapa1 jsonb not null,
  etapa2 jsonb not null,
  bono jsonb not null,
  -- Puntajes ya calculados con la MISMA fórmula y los mismos pesos que usa
  -- el ranking oficial (ver calcularResultadoFinalDesdeDatos en scoring.ts),
  -- para que el número sea comparable. Etapa 3 (Entrevista personal) no
  -- existe en este cálculo porque la IA no puede evaluarla -- el puntaje
  -- final queda compuesto solo por Etapa 2 + Bonificación.
  estado_admisibilidad varchar(20) not null,
  puntaje_admisibilidad double precision,
  puntaje_etapa2 double precision,
  puntaje_bono double precision,
  puntaje_final double precision,
  generado_en timestamptz not null default now()
);

create index if not exists idx_evaluaciones_postulacion on evaluaciones(postulacion_id);
create index if not exists idx_evaluaciones_evaluador on evaluaciones(evaluador_id);
create index if not exists idx_bonificaciones_postulacion on bonificaciones_manuales(postulacion_id);
