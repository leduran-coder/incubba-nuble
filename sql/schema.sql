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
  creado_en timestamptz default now()
);

create table if not exists postulaciones (
  id serial primary key,
  fuente_timestamp varchar(50),
  correo varchar(200),
  nombres varchar(200),
  apellido_paterno varchar(200),
  apellido_materno varchar(200),
  run varchar(20),
  fecha_nacimiento varchar(20),
  genero varchar(30),
  telefono varchar(50),
  residencia_tipo varchar(80),
  provincia varchar(40),
  comuna varchar(60),
  participa_programa_similar varchar(120),
  tipo_emprendimiento varchar(20),
  estado_detalle varchar(160),
  nombre_emprendimiento varchar(250),
  nombre_empresa varchar(250),
  rut_empresa varchar(20),
  tipo_empresa varchar(80),
  sector_industria varchar(160),
  tamano_empresa varchar(20),
  descripcion text,
  propuesta_valor text,
  ha_levantado_financiamiento varchar(10),
  detalle_financiamiento text,
  cree_que_es_innovacion varchar(10),
  por_que_innovador text,
  tipo_potencial_innovador varchar(20),
  tipo_innovacion varchar(60),
  alcance_innovacion varchar(20),
  sector_area_impacto varchar(160),
  resultados_3_anios text,
  impacto_esperado text,
  num_personas_equipo integer,
  descripcion_equipo text,
  video_link varchar(500),
  video_password varchar(120),
  raw_json text,
  creado_en timestamptz default now()
);

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

create index if not exists idx_evaluaciones_postulacion on evaluaciones(postulacion_id);
create index if not exists idx_evaluaciones_evaluador on evaluaciones(evaluador_id);
create index if not exists idx_bonificaciones_postulacion on bonificaciones_manuales(postulacion_id);
