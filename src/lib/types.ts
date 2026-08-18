export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  rol: "admin" | "evaluador";
  activo: boolean;
  creado_en: string;
}

export interface Postulacion {
  id: number;
  fuente_timestamp: string | null;
  correo: string | null;
  nombres: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  run: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  telefono: string | null;
  residencia_tipo: string | null;
  provincia: string | null;
  comuna: string | null;
  participa_programa_similar: string | null;
  tipo_emprendimiento: string | null;
  estado_detalle: string | null;
  nombre_emprendimiento: string | null;
  nombre_empresa: string | null;
  rut_empresa: string | null;
  tipo_empresa: string | null;
  sector_industria: string | null;
  tamano_empresa: string | null;
  descripcion: string | null;
  propuesta_valor: string | null;
  ha_levantado_financiamiento: string | null;
  detalle_financiamiento: string | null;
  cree_que_es_innovacion: string | null;
  por_que_innovador: string | null;
  tipo_potencial_innovador: string | null;
  tipo_innovacion: string | null;
  alcance_innovacion: string | null;
  sector_area_impacto: string | null;
  resultados_3_anios: string | null;
  impacto_esperado: string | null;
  num_personas_equipo: number | null;
  descripcion_equipo: string | null;
  video_link: string | null;
  video_link_alternativo: string | null;
  video_password: string | null;
  raw_json: string | null;
  creado_en: string;
}

export function nombreCompleto(p: Postulacion): string {
  return [p.nombres, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(" ");
}

export function nombreProyecto(p: Postulacion): string {
  return p.nombre_emprendimiento || p.nombre_empresa || "(sin nombre)";
}

export interface Evaluacion {
  id: number;
  postulacion_id: number;
  evaluador_id: number;
  etapa_id: string;
  criterio_id: string;
  nivel_seleccionado: string | null;
  puntos: number | null;
  comentario: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface BonificacionManual {
  id: number;
  postulacion_id: number;
  evaluador_id: number;
  valor_1_a_5: number | null;
  madurez_tecnologica_1_a_5: number | null;
  escalabilidad_1_a_5: number | null;
  traccion_1_a_5: number | null;
  comentario: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface BonificacionManualValores {
  valor_1_a_5: number | null;
  madurez_tecnologica_1_a_5: number | null;
  escalabilidad_1_a_5: number | null;
  traccion_1_a_5: number | null;
  comentario: string | null;
}

export interface ConfiguracionClave {
  clave: string;
  valor_json: string;
  actualizado_en: string;
}
