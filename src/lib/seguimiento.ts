/**
 * Seguimiento y control del equipo evaluador: calcula, para cada evaluador/a,
 * cuántas postulaciones ha evaluado por completo en cada etapa y en la
 * bonificación cualitativa, a partir de las mismas tablas que ya alimentan
 * el resto de la plataforma (evaluaciones, bonificaciones_manuales). No
 * requiere ninguna tabla ni columna nueva: es puramente de lectura, no
 * escribe nada ni cambia el comportamiento de la pantalla de Evaluación.
 *
 * "Completa" para una etapa significa lo mismo que ya exige scoring.ts para
 * promediarla en el puntaje final: el evaluador respondió TODOS los
 * criterios de esa etapa para esa postulación (ver puntajesPorEvaluadorDesdeLista
 * en scoring.ts — la misma regla se replica aquí para no depender de
 * funciones internas no exportadas de ese archivo). Para la bonificación
 * cualitativa, "completa" significa que existe una fila guardada en
 * bonificaciones_manuales para ese par (postulación, evaluador): el
 * formulario guarda los 4 factores juntos con un solo botón, así que la fila
 * existe o no existe, no hay estados parciales.
 */
import { sql } from "@/lib/db";
import { ETAPAS } from "@/lib/rubric";
import { listarUsuarios } from "@/lib/auth-users";
import { listarPostulaciones } from "@/lib/postulaciones";
import { nombreCompleto, nombreProyecto, type Evaluacion } from "@/lib/types";

export interface AvanceEvaluador {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
  totalPostulaciones: number;
  etapa1Completas: number;
  etapa2Completas: number;
  etapa3Completas: number;
  bonoCompletas: number;
  totalmenteEvaluadas: number;
  ultimaActividad: string | null;
}

interface FilaBonoFecha {
  postulacion_id: number;
  evaluador_id: number;
  actualizado_en: string;
}

export async function avancePorEvaluador(): Promise<AvanceEvaluador[]> {
  const [usuarios, postulaciones, evaluaciones, bonificaciones] = await Promise.all([
    listarUsuarios(),
    listarPostulaciones(),
    sql<Evaluacion[]>`select * from evaluaciones`,
    sql<FilaBonoFecha[]>`
      select postulacion_id, evaluador_id, actualizado_en from bonificaciones_manuales
    `,
  ]);

  const evaluadores = usuarios.filter((u) => u.rol === "evaluador");
  const totalPostulaciones = postulaciones.length;

  // Set de ids de criterio por etapa, para saber cuándo una etapa quedó completa.
  const criteriosPorEtapa = new Map(ETAPAS.map((e) => [e.id, new Set(e.criterios.map((c) => c.id))]));

  // mapa[evaluador_id][postulacion_id][etapa_id] = Set de criterio_id ya respondidos
  const mapa = new Map<number, Map<number, Map<string, Set<string>>>>();
  const ultimaPorEvaluador = new Map<number, string>();

  function marcarActividad(evaluadorId: number, fecha: string) {
    const actual = ultimaPorEvaluador.get(evaluadorId);
    if (!actual || fecha > actual) ultimaPorEvaluador.set(evaluadorId, fecha);
  }

  for (const ev of evaluaciones) {
    if (!mapa.has(ev.evaluador_id)) mapa.set(ev.evaluador_id, new Map());
    const porPostulacion = mapa.get(ev.evaluador_id)!;
    if (!porPostulacion.has(ev.postulacion_id)) porPostulacion.set(ev.postulacion_id, new Map());
    const porEtapa = porPostulacion.get(ev.postulacion_id)!;
    if (!porEtapa.has(ev.etapa_id)) porEtapa.set(ev.etapa_id, new Set());
    porEtapa.get(ev.etapa_id)!.add(ev.criterio_id);
    marcarActividad(ev.evaluador_id, ev.actualizado_en);
  }

  const bonoCompleto = new Set<string>(); // clave: "evaluador_id:postulacion_id"
  for (const b of bonificaciones) {
    bonoCompleto.add(`${b.evaluador_id}:${b.postulacion_id}`);
    marcarActividad(b.evaluador_id, b.actualizado_en);
  }

  function etapaCompleta(
    porEtapa: Map<string, Set<string>> | undefined,
    etapaId: string
  ): boolean {
    const respondidos = porEtapa?.get(etapaId);
    if (!respondidos) return false;
    const criterios = criteriosPorEtapa.get(etapaId);
    if (!criterios || criterios.size === 0) return false;
    for (const id of criterios) {
      if (!respondidos.has(id)) return false;
    }
    return true;
  }

  return evaluadores
    .map((u) => {
      const porPostulacion = mapa.get(u.id);
      let etapa1 = 0;
      let etapa2 = 0;
      let etapa3 = 0;
      let bono = 0;
      let completas = 0;

      for (const p of postulaciones) {
        const porEtapa = porPostulacion?.get(p.id);
        const e1ok = etapaCompleta(porEtapa, "etapa_1");
        const e2ok = etapaCompleta(porEtapa, "etapa_2");
        const e3ok = etapaCompleta(porEtapa, "etapa_3");
        const bonoOk = bonoCompleto.has(`${u.id}:${p.id}`);

        if (e1ok) etapa1++;
        if (e2ok) etapa2++;
        if (e3ok) etapa3++;
        if (bonoOk) bono++;
        if (e1ok && e2ok && e3ok && bonoOk) completas++;
      }

      return {
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        activo: u.activo,
        totalPostulaciones,
        etapa1Completas: etapa1,
        etapa2Completas: etapa2,
        etapa3Completas: etapa3,
        bonoCompletas: bono,
        totalmenteEvaluadas: completas,
        ultimaActividad: ultimaPorEvaluador.get(u.id) ?? null,
      };
    })
    .sort((a, b) => b.totalmenteEvaluadas - a.totalmenteEvaluadas || a.nombre.localeCompare(b.nombre));
}

export interface AvanceProyecto {
  id: number;
  proyecto: string;
  postulante: string;
  evaluadoresQueParticiparon: number;
  evaluacionesCompletas: number;
  sinPotencialDinamico: boolean;
}

/**
 * Para la lista de "reportes descargables por proyecto": cuántos
 * evaluadores/as distintos han registrado al menos una evaluación en esta
 * postulación, y cuántos la completaron íntegramente (las 3 etapas + bono).
 * Sirve para que el administrador vea de un vistazo qué proyectos ya están
 * listos para generar su reporte consolidado y cuáles siguen en proceso.
 */
export async function avancePorProyecto(): Promise<AvanceProyecto[]> {
  const [postulaciones, evaluaciones, bonificaciones] = await Promise.all([
    listarPostulaciones(),
    sql<Evaluacion[]>`select * from evaluaciones`,
    sql<FilaBonoFecha[]>`select postulacion_id, evaluador_id, actualizado_en from bonificaciones_manuales`,
  ]);

  const criteriosPorEtapa = new Map(ETAPAS.map((e) => [e.id, new Set(e.criterios.map((c) => c.id))]));

  // mapa[postulacion_id][evaluador_id][etapa_id] = Set de criterio_id
  const mapa = new Map<number, Map<number, Map<string, Set<string>>>>();
  for (const ev of evaluaciones) {
    if (!mapa.has(ev.postulacion_id)) mapa.set(ev.postulacion_id, new Map());
    const porEvaluador = mapa.get(ev.postulacion_id)!;
    if (!porEvaluador.has(ev.evaluador_id)) porEvaluador.set(ev.evaluador_id, new Map());
    const porEtapa = porEvaluador.get(ev.evaluador_id)!;
    if (!porEtapa.has(ev.etapa_id)) porEtapa.set(ev.etapa_id, new Set());
    porEtapa.get(ev.etapa_id)!.add(ev.criterio_id);
  }

  const bonoCompleto = new Set<string>();
  for (const b of bonificaciones) bonoCompleto.add(`${b.postulacion_id}:${b.evaluador_id}`);

  return postulaciones.map((p) => {
    const porEvaluador = mapa.get(p.id);
    const evaluadoresIds = new Set<number>([
      ...(porEvaluador ? porEvaluador.keys() : []),
      ...[...bonoCompleto].filter((k) => k.startsWith(`${p.id}:`)).map((k) => Number(k.split(":")[1])),
    ]);

    let completas = 0;
    for (const evaluadorId of evaluadoresIds) {
      const porEtapa = porEvaluador?.get(evaluadorId);
      const okTodas = ETAPAS.every((etapa) => {
        const respondidos = porEtapa?.get(etapa.id);
        const criterios = criteriosPorEtapa.get(etapa.id)!;
        return !!respondidos && [...criterios].every((id) => respondidos.has(id));
      });
      const okBono = bonoCompleto.has(`${p.id}:${evaluadorId}`);
      if (okTodas && okBono) completas++;
    }

    return {
      id: p.id,
      proyecto: nombreProyecto(p),
      postulante: nombreCompleto(p),
      evaluadoresQueParticiparon: evaluadoresIds.size,
      evaluacionesCompletas: completas,
      sinPotencialDinamico: p.sin_potencial_dinamico,
    };
  });
}
