"""
Verificación end-to-end con navegador real (Playwright) contra la app
Next.js ya corriendo en localhost:3000.
"""
import os
import re
import sys
import time

from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
SHOTS = "/root/incubba-nextjs/tests/screenshots"
os.makedirs(SHOTS, exist_ok=True)

ERRORS = []


def check_no_error(page, label):
    time.sleep(0.4)
    if page.locator("text=Application error").count() > 0:
        ERRORS.append(f"[{label}] Application error visible en pantalla")


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/opt/pw-browsers/chromium", headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    print("-> goto login", flush=True)
    page.goto(f"{BASE}/login", wait_until="load", timeout=30000)
    check_no_error(page, "Login (sin sesión)")
    page.screenshot(path=f"{SHOTS}/00_login.png", full_page=True)

    print("-> login", flush=True)
    page.get_by_placeholder("ejemplo@incubba.cl").fill("admin@incubba.cl")
    page.get_by_placeholder("••••••••").fill("incubba2026")
    page.get_by_role("button", name="Ingresar al Sistema").click()
    page.wait_for_timeout(1500)
    check_no_error(page, "Inicio (post-login)")
    page.screenshot(path=f"{SHOTS}/01_inicio_post_login.png", full_page=True)
    if "/login" in page.url:
        ERRORS.append("Después de enviar el login, seguimos en /login (credenciales o sesión fallaron)")
    print("   url actual:", page.url, flush=True)
    page.wait_for_timeout(1000)  # dar tiempo a que la hidratación de React termine

    def ir_a(nombre_visible, url_check):
        link = page.get_by_role("link", name=re.compile(nombre_visible))
        link.first.click(timeout=8000)
        try:
            page.wait_for_url(f"**{url_check}", timeout=6000)
        except Exception:
            pass
        page.wait_for_timeout(500)
        if url_check not in page.url:
            ERRORS.append(f"[{nombre_visible}] no navegó a {url_check}, url actual: {page.url}")

    for nombre, url in [("Postulaciones", "/postulaciones"), ("Evaluación", "/evaluacion"),
                         ("Resultados", "/resultados"), ("Estadísticas", "/estadisticas"),
                         ("Configuración", "/configuracion")]:
        print(f"-> nav {nombre}", flush=True)
        try:
            ir_a(nombre, url)
            check_no_error(page, nombre)
            page.screenshot(path=f"{SHOTS}/nav_{nombre}.png", full_page=True)
        except Exception as e:
            ERRORS.append(f"[{nombre}] excepción de Playwright al navegar: {e}")

    # --- Importar CSV en Configuración ---
    print("-> importar csv", flush=True)
    try:
        ir_a("Configuración", "/configuracion")
        page.get_by_role("button", name="📥 Importar postulaciones").click(timeout=5000)
        page.wait_for_timeout(300)
        page.locator('input[type="file"]').set_input_files(
            "/root/incubba-nextjs-source/sample_data/postulaciones_ejemplo.csv"
        )
        page.wait_for_timeout(1500)
        check_no_error(page, "Configuración - CSV subido")
        page.screenshot(path=f"{SHOTS}/02_config_csv_subido.png", full_page=True)

        boton_importar = page.get_by_role("button", name="Importar postulaciones", exact=True)
        boton_importar.click(timeout=5000)
        page.wait_for_timeout(3000)
        check_no_error(page, "Configuración - import ejecutado")
        page.screenshot(path=f"{SHOTS}/03_config_import_hecho.png", full_page=True)
    except Exception as e:
        ERRORS.append(f"[Importar CSV] excepción: {e}")

    # --- Revisar Postulaciones ya con datos ---
    print("-> postulaciones con datos", flush=True)
    try:
        ir_a("Postulaciones", "/postulaciones")
        check_no_error(page, "Postulaciones con datos")
        page.screenshot(path=f"{SHOTS}/04_postulaciones_con_datos.png", full_page=True)
    except Exception as e:
        ERRORS.append(f"[Postulaciones con datos] excepción: {e}")

    # --- Evaluación: calificar etapa 1 de la primera postulación ---
    print("-> evaluacion", flush=True)
    try:
        ir_a("Evaluación", "/evaluacion")
        page.wait_for_timeout(800)
        recomendado_btns = page.get_by_role("button", name="Recomendado", exact=True)
        n = recomendado_btns.count()
        print(f"   botones Recomendado encontrados: {n}", flush=True)
        for i in range(n):
            recomendado_btns.nth(i).click(timeout=3000)
            page.wait_for_timeout(150)
        check_no_error(page, "Evaluación - antes de guardar")
        boton_guardar = page.get_by_role("button", name=re.compile("Guardar evaluación"))
        if boton_guardar.count() > 0:
            boton_guardar.first.click(timeout=5000)
            page.wait_for_timeout(1500)
        check_no_error(page, "Evaluación - despues de guardar")
        page.screenshot(path=f"{SHOTS}/05_evaluacion_guardada.png", full_page=True)
    except Exception as e:
        ERRORS.append(f"[Evaluación] excepción: {e}")

    # --- Estadísticas y Resultados con datos reales ---
    print("-> estadisticas", flush=True)
    try:
        ir_a("Estadísticas", "/estadisticas")
        check_no_error(page, "Estadísticas con datos")
        page.screenshot(path=f"{SHOTS}/06_estadisticas_con_datos.png", full_page=True)
    except Exception as e:
        ERRORS.append(f"[Estadísticas con datos] excepción: {e}")

    print("-> resultados", flush=True)
    try:
        ir_a("Resultados", "/resultados")
        check_no_error(page, "Resultados con datos")
        page.screenshot(path=f"{SHOTS}/07_resultados_con_datos.png", full_page=True)
    except Exception as e:
        ERRORS.append(f"[Resultados con datos] excepción: {e}")

    print("-> cerrando browser", flush=True)
    browser.close()

if ERRORS:
    print("❌ SE ENCONTRARON POSIBLES PROBLEMAS:")
    for e in ERRORS:
        print(" -", e)
    sys.exit(1)
else:
    print("✅ Navegación completa sin errores visibles en pantalla.")
