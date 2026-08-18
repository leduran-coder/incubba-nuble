import Image from "next/image";

export function Hero({
  titulo,
  subtitulo,
  pill = "Convocatoria 2026",
}: {
  titulo: string;
  subtitulo?: string;
  pill?: string;
}) {
  return (
    <div className="hero-container">
      <div className="hero-content">
        <h1 className="hero-title">{titulo}</h1>
        {subtitulo ? <p className="hero-sub">{subtitulo}</p> : null}
        {pill ? (
          <div className="pill-badge">
            <span className="pill-dot" />
            <span>{pill}</span>
          </div>
        ) : null}
      </div>
      <div className="hero-logo-box">
        <Image src="/logo.png" alt="Incubba Ñuble UBB" width={160} height={54} style={{ maxHeight: 65, width: "auto", height: "auto" }} priority />
      </div>
    </div>
  );
}
