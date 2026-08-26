import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { obtenerPostulacion } from "@/lib/postulaciones";
import { listarUsuarios } from "@/lib/auth-users";
import { getConfigBonificacion } from "@/lib/config-store";
import { calcularResultadoFinal } from "@/lib/scoring";
import { ETAPAS, type Etapa, type FactorBonificacion, type FilaBonoManualValores } from "@/lib/rubric";
import { nombreCompleto, nombreProyecto, type BonificacionManual, type Evaluacion } from "@/lib/types";

// Página A4 (estándar en Chile) con márgenes de 0.75": ancho de contenido
// disponible para las tablas, en unidades DXA (1440 = 1 pulgada).
const ANCHO_PAGINA_A4 = 11906;
const MARGEN = 1080;
const ANCHO_CONTENIDO = ANCHO_PAGINA_A4 - MARGEN * 2;

// Misma correspondencia factor → columna de bonificaciones_manuales que usa
// internamente scoring.ts (calcularBonificacionDesdeDatos) y rubric.ts
// (calcularBonoEnVivo, para uso en el navegador) — no está exportada desde
// ninguno de los dos archivos, así que se repite acá tal cual, sin cambiar
// ninguna de las dos fuentes originales.
const COLUMNA_MANUAL_POR_FACTOR: Record<string, keyof FilaBonoManualValores> = {
  ambicion_proyeccion: "valor_1_a_5",
  madurez_tecnologica: "madurez_tecnologica_1_a_5",
  escalabilidad_modelo: "escalabilidad_1_a_5",
  traccion_temprana: "traccion_1_a_5",
};

// Encabezados abreviados para la tabla de factores manuales: los nombres
// completos de rubric.ts son descripciones largas pensadas para la pantalla
// de Evaluación, no para encabezados de columna angostos en una tabla Word.
const ETIQUETA_CORTA_POR_FACTOR: Record<string, string> = {
  ambicion_proyeccion: "Ambición y proyección",
  madurez_tecnologica: "Madurez tecnológica",
  escalabilidad_modelo: "Escalabilidad",
  traccion_temprana: "Tracción temprana",
};

function celda(texto: string, opts: { ancho: number; negrita?: boolean; encabezado?: boolean }): TableCell {
  return new TableCell({
    width: { size: opts.ancho, type: WidthType.DXA },
    shading: opts.encabezado ? { type: ShadingType.CLEAR, fill: "EDE9F7" } : undefined,
    children: [
      new Paragraph({
        children: [new TextRun({ text: texto, bold: opts.negrita || opts.encabezado })],
      }),
    ],
  });
}

function tabla(anchos: number[], encabezados: string[], filas: string[][]): Table {
  return new Table({
    width: { size: anchos.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: anchos,
    rows: [
      new TableRow({
        tableHeader: true,
        children: encabezados.map((h, i) => celda(h, { ancho: anchos[i], encabezado: true })),
      }),
      ...filas.map(
        (fila) =>
          new TableRow({
            children: fila.map((valor, i) => celda(valor, { ancho: anchos[i] })),
          })
      ),
    ],
  });
}

function tituloSeccion(texto: string): Paragraph {
  return new Paragraph({ text: texto, heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 160 } });
}

function subtitulo(texto: string): Paragraph {
  return new Paragraph({ text: texto, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } });
}

function parrafo(texto: string, opts: { negrita?: boolean; cursiva?: boolean } = {}): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text: texto, bold: opts.negrita, italics: opts.cursiva })],
  });
}

function formatearNumero(valor: number | null): string {
  return valor === null || valor === undefined ? "—" : String(valor);
}

function formatearFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (session.user.rol !== "admin") {
    return NextResponse.json({ error: "Esta función es solo para administradores/as." }, { status: 403 });
  }

  const { id } = await context.params;
  const postulacionId = Number(id);
  if (!Number.isInteger(postulacionId) || postulacionId <= 0) {
    return NextResponse.json({ error: "ID de postulación inválido." }, { status: 400 });
  }

  const postulacion = await obtenerPostulacion(postulacionId);
  if (!postulacion) {
    return NextResponse.json({ error: "Esa postulación no existe." }, { status: 404 });
  }

  const [evaluaciones, bonificaciones, usuarios, configBono, resultado] = await Promise.all([
    sql<Evaluacion[]>`
      select * from evaluaciones where postulacion_id = ${postulacionId}
      order by evaluador_id, etapa_id, criterio_id
    `,
    sql<BonificacionManual[]>`
      select * from bonificaciones_manuales where postulacion_id = ${postulacionId} order by evaluador_id
    `,
    listarUsuarios(),
    getConfigBonificacion(),
    calcularResultadoFinal(postulacion),
  ]);

  const nombrePorEvaluador = new Map(usuarios.map((u) => [u.id, u.nombre]));
  const nombreDe = (evaluadorId: number) => nombrePorEvaluador.get(evaluadorId) ?? `Usuario #${evaluadorId}`;

  const secciones: (Paragraph | Table)[] = [];

  // --- Portada / identificación ---------------------------------------
  secciones.push(
    new Paragraph({
      text: "Reporte consolidado de evaluación",
      heading: HeadingLevel.TITLE,
      spacing: { after: 80 },
    }),
    new Paragraph({
      text: nombreProyecto(postulacion),
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 160 },
    }),
    parrafo(`Postulante: ${nombreCompleto(postulacion) || "—"}`),
    parrafo(`ID de postulación: ${postulacion.id}`),
    parrafo(`Comuna / Provincia: ${postulacion.comuna ?? "—"} / ${postulacion.provincia ?? "—"}`),
    parrafo(`Sector o industria declarado: ${postulacion.sector_industria ?? "—"}`),
    parrafo(
      `Reporte generado el ${new Date().toLocaleString("es-CL", { dateStyle: "long", timeStyle: "short" })} — Plataforma Incubba Ñuble UBB`,
      { cursiva: true }
    ),
    parrafo(
      "Este documento consolida todas las evaluaciones registradas en la plataforma a la fecha de generación. " +
        "Es un resumen informativo de apoyo al comité; no reemplaza el acta oficial de evaluación.",
      { cursiva: true }
    )
  );

  // --- Etapas 1, 2 y 3 ---------------------------------------------------
  const anchosCriterio = [2400, 2200, 1400, ANCHO_CONTENIDO - 2400 - 2200 - 1400];

  for (const etapa of ETAPAS as Etapa[]) {
    secciones.push(tituloSeccion(etapa.nombre));
    secciones.push(parrafo(etapa.descripcion, { cursiva: true }));

    for (const criterio of etapa.criterios) {
      secciones.push(subtitulo(`${criterio.nombre} · peso ${Math.round(criterio.peso * 100)}%`));

      const filasCriterio = evaluaciones
        .filter((ev) => ev.etapa_id === etapa.id && ev.criterio_id === criterio.id)
        .map((ev) => [
          nombreDe(ev.evaluador_id),
          ev.nivel_seleccionado ?? "—",
          formatearNumero(ev.puntos),
          ev.comentario?.trim() || "—",
        ]);

      if (filasCriterio.length === 0) {
        secciones.push(parrafo("Aún no hay evaluaciones registradas para este criterio."));
      } else {
        secciones.push(
          tabla(anchosCriterio, ["Evaluador/a", "Nivel seleccionado", "Puntos", "Comentario"], filasCriterio)
        );
      }
    }

    if (etapa.id === "etapa_1") {
      secciones.push(
        parrafo(
          `Estado de admisibilidad: ${resultado.estado_admisibilidad} ` +
            `(puntaje promedio: ${formatearNumero(resultado.puntaje_admisibilidad)})`,
          { negrita: true }
        )
      );
    } else if (etapa.id === "etapa_2") {
      secciones.push(
        parrafo(
          `Puntaje promedio de la etapa (evaluadores que completaron todos los criterios): ${formatearNumero(resultado.puntaje_etapa_2)}`,
          { negrita: true }
        )
      );
    } else if (etapa.id === "etapa_3") {
      secciones.push(
        parrafo(
          `Puntaje promedio de la etapa (evaluadores que completaron todos los criterios): ${formatearNumero(resultado.puntaje_etapa_3)}`,
          { negrita: true }
        )
      );
    }
  }

  // --- Bonificación por potencial dinámico -------------------------------
  secciones.push(tituloSeccion("Bonificación por potencial dinámico"));

  const factoresManuales = (configBono.factores ?? []).filter(
    (f: FactorBonificacion) => COLUMNA_MANUAL_POR_FACTOR[f.id]
  );
  const factoresAutomaticos = (configBono.factores ?? []).filter(
    (f: FactorBonificacion) => !COLUMNA_MANUAL_POR_FACTOR[f.id]
  );

  if (factoresManuales.length > 0) {
    secciones.push(subtitulo("Factores calificados manualmente por el panel (escala 1 a 5)"));
    const anchosBono = [
      1800,
      ...factoresManuales.map(() => Math.floor((ANCHO_CONTENIDO - 1800 - 2200) / factoresManuales.length)),
      2200,
    ];
    const filasBono = bonificaciones.map((b) => [
      nombreDe(b.evaluador_id),
      ...factoresManuales.map((f) => {
        const columna = COLUMNA_MANUAL_POR_FACTOR[f.id];
        const valor = b[columna];
        return valor === null || valor === undefined ? "—" : String(valor);
      }),
      b.comentario?.trim() || "—",
    ]);
    if (filasBono.length === 0) {
      secciones.push(parrafo("Aún no hay bonificación cualitativa registrada por ningún evaluador/a."));
    } else {
      secciones.push(
        tabla(
          anchosBono,
          ["Evaluador/a", ...factoresManuales.map((f) => ETIQUETA_CORTA_POR_FACTOR[f.id] ?? f.nombre), "Comentario"],
          filasBono
        )
      );
    }
  }

  if (factoresAutomaticos.length > 0) {
    secciones.push(subtitulo("Factores automáticos (según datos declarados en la postulación)"));
    const anchosAuto = [ANCHO_CONTENIDO - 2200, 2200];
    const filasAuto = factoresAutomaticos.map((f) => [
      f.nombre,
      formatearNumero(resultado.detalle_bonificacion[f.id] ?? null),
    ]);
    secciones.push(tabla(anchosAuto, ["Factor", "Puntos (0 a 10)"], filasAuto));
  }

  secciones.push(
    parrafo(`Bonificación final calculada: ${formatearNumero(resultado.bonificacion)}`, { negrita: true })
  );

  // --- Resultado final -----------------------------------------------
  secciones.push(tituloSeccion("Resultado final consolidado"));
  secciones.push(
    tabla(
      [ANCHO_CONTENIDO - 3000, 3000],
      ["Componente", "Valor"],
      [
        ["Estado de admisibilidad (Etapa 1)", resultado.estado_admisibilidad],
        ["Puntaje admisibilidad", formatearNumero(resultado.puntaje_admisibilidad)],
        ["Puntaje Etapa 2 · Evaluación de proyecto", formatearNumero(resultado.puntaje_etapa_2)],
        ["Puntaje Etapa 3 · Entrevista personal", formatearNumero(resultado.puntaje_etapa_3)],
        ["Bonificación por potencial dinámico", formatearNumero(resultado.bonificacion)],
        ["Puntaje base (Etapa 2 + Etapa 3 ponderadas)", formatearNumero(resultado.puntaje_base)],
        ["Puntaje final", formatearNumero(resultado.puntaje_final)],
      ]
    )
  );

  if (evaluaciones.length > 0 || bonificaciones.length > 0) {
    const ultimaFecha = [...evaluaciones.map((e) => e.actualizado_en), ...bonificaciones.map((b) => b.actualizado_en)].sort().at(-1);
    if (ultimaFecha) {
      secciones.push(parrafo(`Última actualización de una evaluación registrada: ${formatearFecha(ultimaFecha)}`, { cursiva: true }));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: MARGEN, bottom: MARGEN, left: MARGEN, right: MARGEN } },
        },
        children: secciones,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const nombreLimpio = nombreProyecto(postulacion)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
  const nombreArchivo = `reporte_postulacion_${postulacionId}_${nombreLimpio || "proyecto"}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
