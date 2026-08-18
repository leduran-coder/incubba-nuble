const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, LevelFormat, AlignmentType, ExternalHyperlink,
} = require("docx");

const MORADO = "7C3AED";
const NAVY = "0F172A";
const GRIS = "64748B";

const numbering = {
  config: [
    {
      reference: "bullets",
      levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ],
    },
    ...["paso1", "paso2", "paso3", "paso4", "paso5", "paso6"].map((reference) => ({
      reference,
      levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ],
    })),
  ],
};

function h1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 150 } });
}
function h2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } });
}
function p(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 120 } });
}
function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text })],
    numbering: { reference: "bullets", level },
    spacing: { after: 80 },
  });
}
function numbered(text, ref = "paso1") {
  return new Paragraph({
    children: [new TextRun({ text })],
    numbering: { reference: ref, level: 0 },
    spacing: { after: 80 },
  });
}
function code(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Consolas", size: 20, color: NAVY })],
    shading: { type: ShadingType.CLEAR, fill: "F1F5F9" },
    spacing: { after: 120 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
    },
  });
}
function nota(text) {
  return new Paragraph({
    children: [new TextRun({ text: "Nota: " + text, italics: true, color: GRIS })],
    spacing: { after: 160 },
  });
}
function link(textVisible, url) {
  return new Paragraph({
    children: [new ExternalHyperlink({
      link: url,
      children: [new TextRun({ text: textVisible, style: "Hyperlink" })],
    })],
    spacing: { after: 120 },
  });
}

function simpleTable(headers, rows, widths) {
  const totalWidth = 9000;
  const w = widths || headers.map(() => Math.floor(totalWidth / headers.length));
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((htext, i) => new TableCell({
      width: { size: w[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: NAVY },
      children: [new Paragraph({ children: [new TextRun({ text: htext, bold: true, color: "FFFFFF" })] })],
    })),
  });
  const bodyRows = rows.map((row) => new TableRow({
    children: row.map((cell, i) => new TableCell({
      width: { size: w[i], type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: cell })] })],
    })),
  }));
  return new Table({ columnWidths: w, width: { size: totalWidth, type: WidthType.DXA }, rows: [headerRow, ...bodyRows] });
}

const doc = new Document({
  numbering,
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
    },
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 } } },
    children: [
      new Paragraph({
        children: [new TextRun({ text: "Guía de despliegue en Vercel", bold: true, size: 56, color: MORADO })],
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Plataforma de Postulación y Evaluación — Incubba Ñuble UBB, Generación 2026 (versión Next.js)", size: 28, color: NAVY })],
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Guía paso a paso pensada para alguien SIN conocimientos de programación.", italics: true, color: GRIS })],
        spacing: { after: 400 },
      }),

      h1("1. Qué cambió respecto a la versión anterior"),
      p("La plataforma se reescribió técnicamente para poder publicarse en Vercel (el proveedor de hosting más usado junto a Next.js). La rúbrica, la bonificación por potencial dinámico, la importación de CSV, el ranking y el dashboard de estadísticas funcionan exactamente igual que antes — lo único que cambió es la tecnología por debajo y el sitio donde se aloja la app."),
      bullet("Antes: aplicación en Python/Streamlit, publicada en Streamlit Community Cloud."),
      bullet("Ahora: aplicación en Next.js (React), publicada en Vercel."),
      bullet("La base de datos sigue siendo la misma: Supabase (PostgreSQL). Si ya tenías un proyecto Supabase de la versión anterior, lo puedes reutilizar sin perder datos."),
      p("Todo el código fuente se entrega junto con esta guía."),

      h1("2. Qué necesitas antes de empezar"),
      p("Todo lo que se usa aquí tiene un plan gratuito suficiente para este proyecto (hasta 40 cupos y unas pocas decenas de evaluadores). Vas a necesitar 3 cuentas gratuitas, en este orden:"),
      simpleTable(
        ["Servicio", "Para qué se usa", "Enlace"],
        [
          ["GitHub", "Guardar el código de la plataforma (como una carpeta en la nube)", "github.com"],
          ["Supabase", "Base de datos donde se guardan postulaciones y evaluaciones", "supabase.com"],
          ["Vercel", "Publicar la app como una página web", "vercel.com"],
        ],
        [2600, 4400, 2000],
      ),
      nota("Si ya hiciste la versión anterior en Streamlit, ya tienes cuentas de GitHub y Supabase — solo te falta crear la cuenta de Vercel. Puedes reutilizar el mismo proyecto de Supabase (mismo DATABASE_URL de antes)."),
      nota("No necesitas escribir ni una línea de código. Solo vas a hacer clics y copiar/pegar un par de datos entre estos 3 sitios."),

      h1("3. Paso 1 · Subir el proyecto a GitHub"),
      numbered("Entra a github.com y crea una cuenta gratuita (si no tienes una).", "paso1"),
      numbered("Arriba a la derecha, haz clic en el símbolo “+” y elige “New repository”.", "paso1"),
      numbered("Ponle un nombre, por ejemplo: incubba-nuble-nextjs. Déjalo como “Public” o “Private” (ambos funcionan). No marques ninguna otra opción. Haz clic en “Create repository”.", "paso1"),
      numbered("En la página del repositorio recién creado, busca el enlace “uploading an existing file” (o el botón “Add file → Upload files”).", "paso1"),
      numbered("Arrastra TODOS los archivos y carpetas del proyecto que te entregamos (la carpeta completa del proyecto Next.js) a esa pantalla.", "paso1"),
      numbered("Escribe un mensaje como “Primera versión Next.js” y haz clic en “Commit changes”.", "paso1"),
      nota("Si nunca has usado GitHub, también puedes pedirle a cualquier persona con conocimientos básicos de computación que haga este paso por ti en 5 minutos; no requiere saber programar, solo subir archivos."),
      nota("No subas el archivo .env.local si lo llegaste a crear en tu computador — ese archivo es solo para pruebas propias y ya está excluido automáticamente por el proyecto (.gitignore)."),

      h1("4. Paso 2 · Preparar la base de datos en Supabase"),
      numbered("Si ya tienes un proyecto Supabase de la versión anterior, puedes reutilizarlo y saltar directo al punto 3 de esta sección.", "paso2"),
      numbered("Si es nuevo: entra a supabase.com y crea una cuenta gratuita (puedes usar tu cuenta de GitHub para entrar más rápido). Haz clic en “New project”, elige un nombre y crea una contraseña segura para la base de datos — GUÁRDALA.", "paso2"),
      numbered("Entra al proyecto → menú lateral “SQL Editor” → botón “New query”.", "paso2"),
      numbered("Abre el archivo sql/schema.sql que viene incluido en el proyecto, copia TODO su contenido, pégalo en el SQL Editor de Supabase y presiona “Run”. Esto crea las tablas necesarias (usuarios, postulaciones, evaluaciones, etc.) — si ya existían de antes, no las modifica ni borra datos.", "paso2"),
      numbered("Ve a “Project Settings” (ícono de engranaje) → “Database”.", "paso2"),
      numbered("Busca la sección “Connect” / “Connection string” y elige el modo “Connection pooling” (Transaction). NO uses la conexión directa: usa siempre el pooler.", "paso2"),
      numbered("Copia ese texto — el host se ve como aws-0-<región>.pooler.supabase.com, el puerto es 6543 y el usuario es postgres.TU_PROYECTO (con el project ref pegado con un punto). Reemplaza [YOUR-PASSWORD] por tu contraseña. Guarda este texto completo, lo vas a pegar en el paso 3.", "paso2"),
      nota("¿Por qué el pooler y no la conexión directa? La conexión directa de Supabase usa una dirección IPv6, y Vercel (igual que Streamlit Cloud, Render, GitHub Actions, etc.) solo tiene salida por IPv4 — la app fallaría al conectar. El pooler (Supavisor) sí es compatible con IPv4."),
      nota("El plan gratuito de Supabase pausa el proyecto si nadie lo usa por 7 días seguidos. Si eso pasa, entra al panel de Supabase y haz clic en “Restore project” — los datos NO se pierden."),

      h1("5. Paso 3 · Publicar la app en Vercel"),
      numbered("Entra a vercel.com e ingresa con tu cuenta de GitHub.", "paso3"),
      numbered("Haz clic en “Add New…” → “Project”.", "paso3"),
      numbered("Busca y selecciona el repositorio que subiste en el Paso 1 (incubba-nuble-nextjs) y haz clic en “Import”. Vercel detecta automáticamente que es un proyecto Next.js — no cambies nada en “Build and Output Settings”.", "paso3"),
      numbered("Antes de hacer clic en “Deploy”, abre la sección “Environment Variables” y agrega estas 3 variables (una por una, con “Add”):", "paso3"),
      code('DATABASE_URL = postgresql://postgres.TU_PROYECTO:TU_PASSWORD@aws-0-sa-east-1.pooler.supabase.com:6543/postgres'),
      code('AUTH_SECRET = (genera un valor aleatorio; ver nota abajo)'),
      code('AUTH_URL = https://TU-PROYECTO.vercel.app'),
      nota("El host \"aws-0-sa-east-1\" puede variar según la región de tu proyecto Supabase — usa exactamente el que copiaste en el Paso 2, no este de ejemplo."),
      nota("Para AUTH_SECRET necesitas un valor aleatorio y secreto (como una contraseña larga). Si tienes a alguien con conocimientos técnicos cerca, puede generarlo con el comando `openssl rand -base64 32`. Si no, puedes usar cualquier generador de contraseñas en línea y pegar un resultado de al menos 32 caracteres."),
      nota("AUTH_URL: la primera vez no sabrás la dirección final hasta después del primer despliegue. Puedes dejarla vacía, hacer “Deploy”, copiar la URL que te asigna Vercel (algo como https://incubba-nuble-nextjs.vercel.app) y luego volver a “Settings → Environment Variables” para agregar AUTH_URL con esa dirección. Después, ve a la pestaña “Deployments” y usa “Redeploy” en el último despliegue para que tome el nuevo valor."),
      numbered("Haz clic en “Deploy”. En 1-2 minutos la plataforma va a estar publicada, con una dirección web propia.", "paso3"),
      nota("Esa dirección web es la que compartes con el resto del equipo evaluador. Cada vez que alguien entra, se conecta a la misma base de datos en Supabase, así que todos ven la misma información en tiempo real."),

      h1("6. Paso 4 · Primer ingreso"),
      p("La primera vez que alguien entra a la plataforma, ya existe un usuario administrador de fábrica (se crea automáticamente la primera vez que alguien abre la página de acceso):"),
      simpleTable(["Correo", "Contraseña"], [["admin@incubba.cl", "incubba2026"]], [4500, 4500]),
      numbered("Ingresa con esos datos.", "paso4"),
      numbered("Ve a Configuración → “Mi cuenta” y cambia la contraseña de inmediato por una solo tuya.", "paso4"),
      numbered("Ve a Configuración → “Evaluadores” y crea una cuenta para cada integrante del panel de evaluación, con su propio correo y una contraseña temporal (cada evaluador/a puede cambiarla luego desde “Mi cuenta”).", "paso4"),

      h1("7. Paso 5 · Importar las postulaciones"),
      numbered("Abre la hoja de cálculo de Google (“Respuestas”) vinculada al formulario de postulación.", "paso5"),
      numbered("Ve a Archivo → Descargar → Valores separados por comas (.csv).", "paso5"),
      numbered("En la plataforma, ve a Configuración → “Importar postulaciones” y sube ese archivo.", "paso5"),
      numbered("Revisa el mapeo de columnas que la plataforma sugiere automáticamente (qué columna del CSV corresponde a qué campo). Ajusta manualmente cualquiera que no calce.", "paso5"),
      numbered("Haz clic en “Importar postulaciones”. Puedes repetir este proceso cada vez que lleguen postulaciones nuevas: la plataforma detecta y omite automáticamente las que ya habías importado (por RUN o correo).", "paso5"),
      nota("Si ya tenías postulaciones importadas en la versión anterior (Streamlit) y usaste el mismo proyecto Supabase, esas postulaciones ya están ahí — no necesitas volver a importarlas."),

      h1("8. Uso diario de la plataforma"),
      h2("Evaluación"),
      p("Cada evaluador/a entra con su cuenta, va a “Evaluación”, elige una postulación y califica las 3 etapas (Admisibilidad, Proyecto, Entrevista) según la rúbrica exacta de las bases, más la pestaña de Bonificación por potencial dinámico. El puntaje final se calcula automáticamente como el promedio entre todos los evaluadores que calificaron cada postulación."),
      h2("Resultados"),
      p("La página “Resultados” muestra el ranking final ordenado, resaltando el cupo máximo de 40 y avisando si no se cumple la meta de al menos 50% de proyectos liderados por mujeres, para que el panel pueda hacer el ajuste manual que indican las bases (punto 4.4, aplicado DESPUÉS del ranking por rúbrica)."),
      h2("Estadísticas"),
      p("La página “Estadísticas” entrega una vista general en cualquier momento: género, provincia/comuna, tipo de emprendimiento, tipo de innovación, sectores más frecuentes, financiamiento previo, etc."),

      h1("9. Cómo ajustar la bonificación por potencial dinámico"),
      p("Las bases NO definen literalmente esta bonificación — se construyó especialmente para este proyecto a partir de la definición de emprendimiento dinámico de CORFO (crecer sobre 20% anual, duplicar el negocio cada 3-4 años). Se calcula así por defecto, y todo es ajustable sin tocar código, desde Configuración → “Bonificación”:"),
      simpleTable(
        ["Factor", "Fuente", "Peso por defecto"],
        [
          ["Tipo de potencial innovador (marginal/incremental/disruptiva)", "Declarado por el postulante en el formulario", "30%"],
          ["Alcance proyectado (regional/nacional/internacional)", "Declarado por el postulante", "25%"],
          ["Financiamiento público o privado ya levantado", "Declarado por el postulante", "15%"],
          ["Ambición y credibilidad de la proyección a 3 años", "Calificado por el panel evaluador (escala 1 a 5)", "30%"],
        ],
        [4200, 3200, 1600],
      ),
      p("El resultado se suma como puntos extra (hasta un máximo configurable, 10 puntos por defecto) sobre el puntaje final de 100. Desde la misma página también se ajusta cuánto pesa cada etapa (proyecto vs. entrevista) en el puntaje final."),

      h1("10. Mantenimiento, respaldos y límites de los planes gratuitos"),
      bullet("Respaldo manual: en “Resultados” hay un botón “Descargar ranking como CSV”. Se recomienda descargarlo cada vez que se cierre una etapa de evaluación importante."),
      bullet("Supabase (gratis): hasta 500 MB de base de datos — más que suficiente para varios años de convocatorias. Pausa proyectos inactivos 7+ días; se reactivan con un clic desde el panel."),
      bullet("Vercel (gratis): a diferencia de Streamlit Cloud, no hay “tiempo de despertar” — cada visita se atiende al instante (arquitectura serverless). El plan gratuito de Vercel tiene límites generosos de tráfico, más que suficientes para este proyecto."),
      bullet("Cada vez que subas un cambio de código a GitHub, Vercel vuelve a publicar la app automáticamente en 1-2 minutos, sin que tengas que hacer nada manual."),
      bullet("Usuarios y contraseñas: solo un administrador/a puede crear evaluadores/as; cualquier evaluador/a puede cambiar su propia contraseña desde “Mi cuenta”."),

      h1("11. Qué NO incluye esta versión (posible fase 2)"),
      p("Para que esta versión estuviera lista rápido y fuera simple de publicar, quedaron fuera de este alcance — y se pueden agregar más adelante si se necesitan:"),
      bullet("Formulario propio de postulación (por ahora se sigue usando el Google Form actual y se importa el CSV; se podría reemplazar por un formulario nativo de la plataforma)."),
      bullet("Sincronización automática y en vivo con la Google Sheet (hoy se hace por subida de CSV, cada vez que se quiera actualizar)."),
      bullet("Notificaciones automáticas por correo a postulantes seleccionados."),
      bullet("Reproducción embebida del video-pitch dentro de la plataforma (hoy se abre el enlace aparte)."),

      h1("12. Soporte"),
      p("Todo el código fuente, junto con esta guía, se entrega junto a este documento. Cualquier ajuste al motor de rúbrica vive en un solo archivo (src/lib/rubric.ts), pensado para que sea fácil de mantener incluso por alguien nuevo en el equipo técnico."),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("/root/incubba-nextjs/docs/Guia_de_despliegue_Vercel_Incubba_Nuble.docx", buffer);
  console.log("Documento generado.");
});
