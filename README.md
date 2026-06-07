# test\_kashio

Respuestas a Prueba técnica QA Automation, Kashio



**PARTE 1:

FakeStoreAPI / GoRest**

Para construir la suite de automatización desde cero considerando un entorno de ciclo de desarrollo ágil, se aplicó una estrategia de Pruebas Basada en Riesgos (Risk-Based Testing), priorizando el "Camino Feliz" del negocio y la madurez técnica de los endpoints

El criterio para la toma de decisiones fue el siguiente:

1. Bloqueo Técnico por Falta de Persistencia Real (Carrito y Usuarios)

&#x20;   **La Razón Técnica:** Al explorar fakestoreapi.com, se detectó que los métodos de escritura (POST, PUT, DELETE) son simulados (mokeados en el backend). Si creas un usuario o modificas un carrito, la API te devuelve un HTTP 200 y un ID ficticio, pero no persiste los datos en su base de datos
    **El Impacto en QA**: Si intentabamos hacer un flujo dinámico e2e en FakeStore (ej: Crear usuario->Iniciar Sesión->Crear Carrito->Modificar Cantidades), la prueba fallaba inmediatamente porque el usuario creado no existe para el endpoint de autenticación.

&#x20;   **La Decisión:** Para demostrar la capacidad de automatizar un flujo dinámico integral (E2E) con persistencia real e idempotencia, se decidió mover todo ese esfuerzo técnico a la API de GoRest, la cual sí persiste datos y permite evaluar escenarios complejos de estados y control de duplicados de forma real.

2. Priorización del Core de Negocio (El Catálogo)
    **La Razón Negocio:** El catalogo de productos es el motor principal de cualquier e-commerce. Si el catálogo falla, los usuarios no pueden ver stock, no existen transacciones y el negocio se detiene por completo. El carrito, los perfiles de usuario y la autenticación son flujos dependientes que nacen a partir de la existencia de un producto.
    **La Decisión:** Se priorizó establecer una base arquitectónica bien robusta en el catalogo para validar la integridad y el control de datos criticos (como la prevención de ingresar precios negativos). Una vez que esta base (Page Object Model, configuración de Playwright y reportería masiva) queda certificada, el framework queda listo para escalar hacia los otros módulos de manera limpia

Para presentar esto a negocio, específicamente a PO le explicaría cuales serian las siguientes fases de automatización.:

Fase 1 (Entregada): Cimientos de Arquitectura + Core de Catálogo (FakeStore) + Ciclo Completo E2E (GoRest).

Fase 2 (Próximo Sprint): Automatización de Autenticación (Login) generando tokens JWT simulados.

Fase 3 (Medio Plazo): Automatización del Carrito de Compras inyectando IDs fijos de productos pre-existentes en la base de datos de FakeStore para evitar el bloqueo de la falsa persistencia.

Básicamente mi criterio fue priorizar la calidad arquitectónica y la mitigación de riesgos reales sobre la cantidad de scripts. Decidí aislar el comportamiento simulado de FakeStore en el Catálogo y demostrar la robustez de un flujo End-to-End transaccional en GoRest, optimizando el tiempo de entrega y asegurando el valor de la suite de pruebas.

**Preguntas Parte 1:**

1. ¿Qué aspectos mejorarías en tu solución si tuvieras más tiempo?
r: Si dispusiera de más tiempo para robustecer la solución actual, implementaría las siguientes mejoras de arquitectura e infraestructura:


a.- Validación Avanzada de Esquemas: En lugar de evaluar campos de forma individual con toHaveProperty, integraría una librería como ajv para validar de forma automática y estricta el contrato completo de la API contra un esquema JSON predefinido. Esto detectaría cambios sutiles en el backend de forma instantánea


b.- Abstracción de Capa de Asertividad: Crearia asercionees personalizadas,específicas para el dominio financiero/e-commerce, centralizando las validaciones repetitivas y mejorando la lectura de los step definitions


c.- Pruebas de Contrato Autonomas (Contract Testing): Añadiría herramientas como Pact para aislar las dependencias entre microservicios, asegurando la compatibilidad antes de integrarnos en los ambientes de QAs.



d.- Paralelizaci{on a Nivel de Docker: Empaquetaría la suite completa en contenedores Docker  para asegurar que la ejecución en el pipeline sea 100% agnósticable.

2.  ¿Cómo parametrizarías el test para ejecutarlo en distintos ambientes?
r: Para lograr que el framework sea capaz de ejecutarse en ambientes de Desarrollo, Staging o Producción sin modificar una sola línea de codigo, utilizaría una estrategia de variables deentorno dinámicas
A nivel de código, centralizaría la lectura en un archivo de configuración (src/support/config.ts) alimentado por dotenv. Los scripts del package.json se parametrizarían inyectando la variable de entorno NODE\_ENV por línea de comandos, Algo si:
"scripts": {

&#x20; "test:dev": "NODE\_ENV=dev cucumber-js",

&#x20; "test:stg": "NODE\_ENV=stg cucumber-js"

}
El archivo de configuración leeria dinámicamente .env.dev o .env.stg según corresponda, modificando las UrñLs base y las credenciales de manera transparente tanto en local como en los agentes de ejecución de GitHub Actions.


3\.  Si manejaras datos sensibles para pruebas (tokens, passwords), ¿cómo logestionarías?
r: El manejo de datos sensibles es imprescindible el mas estricto rigor de seguridad, inclusive por normativa. En mi experiencia siempre he trabajo con estas tres reglas a rajatabla:
- Cero Credenciales en Código o .env locales: Ningún token de acceso (como el de GoRest), password o clave criptográfica se sube al repositorio de Git. El archivo .env se añade inmediatamente a .gitignorw
- Inyección Segura en CI/CD via Secrets: En el pipeline (GitHub Actions), los datos sensibles se configuran en el apartado de Encrypted Secrets. Estos valores viajan cifrados en la nube y se inyectan en memoria dentro del contenedor temporal únicamente durante la fase de ejecución (env: GOREST\_TOKEN: ${{ secrets.GOREST\_TOKEN }}).

\-Enmascaramiento de Logs: Me aseguraro de que las funciones del framework que imprimen reportes o logs de consola omitan o apliquen un regex de enmascaramiento a las cabeceras de autorización (Authorization: Bearer \*\*\*) para evitar la fuga de credenciales en auditorías de logs


4\. ¿Qué estrategia usarías para evitar flakiness y hacer los tests confiables?

r: 
-Evitar Esperas Estáticas: utilizo las esperas explícitas dinámicas de Playwright
-Idempotencia de Datos: Mediante el uso de datos aleatorios dinámicos (como los generados con timestamps para los correos de GoRest)
-Manejo Limpio de Hooks (Setup y Teardown):Garantizar que cada escenario limpie sus datos o cierre sus contextos de red (apiContext.dispose()) al finalizar, previniendo fugas de memoria o estados alterados en el ambiente de pruebas que afecten al siguiente test.



5\. ¿Cómo estructurarías la suite para separar smoke vs regression y acelerar feedback?
r: Para acelerar el feedback y optimizar los recursos informáticos, estructuro la suite mediante el uso estratégico de Tags (Etiquetas) en Cucumber combinados con la segmentación de etapas en el pipeline de CI/CD:
 1. Estructura a Nivel de Gherkin: Se asignan etiquetas @smoke a los flujos críticos (ej: Login exitoso, salud de endpoints, transacción base) y etiquetas @regression a la cobertura exhaustiva.
 2. Gatilladores Inteligentes en CI/CD: \* Smoke Test Gate: Configurando para ejecutarse de forma mandatoria ante cada Pull Request o Push en ramas de desarrollo. Al contener pocos escenarios seleccionados por riesgo de negocio, corre en menos de 3 minutos, alertando al desarrollador (o negocio) de inmediato si rompió el core del sistema
   2a: Regression Nightly (Cobertura Profunda): Configurado mediante un Cron Job nocturno en GitHub Actions para ejecutar la suite completa


**PARTE 2:**


1\. ¿Cómo harías para ejecutar solo Smoke en PR y Regression nightly?
r: Para lograrlo, implementé una estrategia de Tagging (@smoke, @regression) en los escenarios de Cucumber. En el archivo de GitHub Actions (ci.yml), configuro condicionales en los steps basados en el evento disparador (github.event\_name). Si el evento es un pull\_request, el pipeline ejecuta el comando npm run test:smoke para obtener feedback rápido en minutos. Si el evento es schedule (controlado por un cron job nocturno), ejecuta npm run test:regression, permitiendo una cobertura profunda sin bloquear el flujo de trabajo de los desarrolladores durante el día.


2\. ¿Cómo manejarías variables sensibles (token GoRest) sin exponerlas en el repo?
r: A nivel local, utilicé la librería dotenv y agregué el archivo .env al .gitignore. En el pipeline, configuré el token dentro de GitHub Secrets. Luego, en el paso de ejecución del workflow, inyecte el secret de GitHub directamente como una variable de entorno en el contenedor temporal (env: GOREST\_TOKEN: ${{ secrets.GOREST\_TOKEN }})

3. ¿Qué harías si el pipeline falla por intermitencia del API externo?
r: Para mitigarlo, implementaría un patrón de Retry logico a nivel de código y configuraría playwright para reintentar el escenario completo en cucumber utilizando el flag --retry 2. Si la intermitencia sigue y bloquea el pase a produccion, implementaría algún mock aislando en el core y simularía las respuestas del API externa para validar la "resistencia" de la aplicación.

4. ¿Cómo versionarías y almacenarías evidencias (reportes, logs) para auditoría?
r: utilizará la acción actions/upload-artifact en el workflow de GitHub Actions para empaquetar y subir la carpeta reports/ (que contiene el Cucumber HTML Reporter) al finalizar la ejecución. Configuro un retention-days de 15 a 30 días, lo que garantiza que los analistas de negocio o auditores puedan descargar el reporte exacto vinculado al SHA del commit que se intentó desplegar, asegurando total trazabilidad de qué se probó y cuáles fueron los resultados.

5. ¿Qué métricas incorporarías (tiempo, estabilidad, flakiness rate) y dónde las verías?
r: haría un  dashboard externo (como Allure Report) para visualizar métricas a lo largo del tiempo, no solo resultados aislados. Las métricas clave serían:

a.-Duración del Pipeline: para verificar que los smoke test no superen los 5 minutos.
b.-Pass Rate / Estabilidad: revisar el porcentaje de existos
c.-Flakiness Rate: para identificar que test fallan o pasan con el commit del código, asi saber que refatorizacion es urgente o aserciones dinámica mas solidas. 


**PARTE 3:**


1\. Prueba de Carga - Catálogo de Productos

Criterio de Diseño: Para una "carga normal" en un e-commerce regional, definí una simulación de 20 usuarios concurrentes realizando consultas constantes. Un tiempo de respuesta p95 < 500ms es el umbral óptimo; si un usuario espera más de medio segundo en cargar un catálogo, la tasa de abandono aumenta drásticamente.

  **Resultados y Umbrales**

&#x20;   **Throughput:** El sistema mostró una estabilidad alta, procesando aproximadamente 15-20 peticiones por segundo sin degradación.

&#x20;   **Tasa de Errores:** Se estableció un umbral estricto de 0% de error (tasa < 0.01%). Dado que es un endpoint de lectura (GET), el sistema no debería fallar bajo tráfico normal; cualquier error 5xx indicaría un problema de infraestructura o saturación de base de datos

**Conclusión:** El sistema es capaz de manejar la carga esperada manteniendo los umbrales de latencia definidos, asegurando una experiencia de usuario fluida durante la navegación.

2. Prueba de Estrés - Registro de Usuarios


Criterio de Diseño: Se implementó una rampa de carga progresiva desde 10 hasta 100 usuarios concurrentes para identificar el punto de quiebre.


&#x20; **Análisis del Comportamiento (Hallazgos Críticos):**

&#x20;   **Punto de Quiebre:** A partir de los 50 usuarios concurrentes, el sistema activó su mecanismo de defensa: Rate Limiting.
    **Degradación vs. Falla Abrupta:** El sistema no falló abruptamente (no hubo caídas 500), sino que comenzó a rechazar peticiones de forma controlada mediante códigos HTTP 429 (Too Many Requests). Esto demuestra que la API tiene una política de seguridad madura para protegerse contra el abuso de recursos.
    **Recuperación:** Al reducir la carga (etapa de bajada), el sistema recuperó su funcionalidad completa inmediatamente, confirmando que la degradación fue temporal y no hubo bloqueo persistente (deadlock) en la base de datos.


**Conclusión:** El límite operativo real del endpoint de registro, bajo la configuración actual, es de 50 usuarios concurrentes. Cualquier campaña de marketing que supere este volumen debe ser acompañada por un plan de escalado horizontal o aumento de límites en el Rate Limiter.



Preguntas:
1. ¿Qué cuellos de botella identificaste?
r: El principal cuello de botella es el Rate Limiting de la API externa, que actúa como un protector de recursos pero limita la capacidad de adquisición masiva de usuarios en entornos de estrés.


2\. ¿Qué mejoras propondrías?

r: Implementar Caching para las peticiones GET del catálogo, descargar el tráfico de la base de datos hacia una CDN para contenido estático y, ante campañas de alta demanda, configurar un escalamiento horizontal de la infraestructura


3\. ¿Cómo integrarías esto en CI/CD?

r: integraría estos scripts de k6 en un workflow de GitHub Actions que corra después del despliegue en Staging. Si el p95 de respuesta supera los umbrales definidos en thresholds.js, el pipeline debe fallar automáticamente para evitar que código ineficiente llegue a producción.


4\. ¿Qué herramientas adicionales usarías en producción?
r: herramientas como New Relic o DataDog para monitoreo en tiempo real, observabilidad de logs con ELK Stack y dashboards en Grafana para visualizar métricas de latencia y errores minuto a minuto.




pd:
Haciendo las pruebas de estrés en GoRest, me di cuenta de que el sistema no colapsó por hardware, sino que saltaron las políticas de Rate Limiting. Básicamente, cuando llegué a los 50 usuarios concurrentes, el API empezó a devolver errores 429 (Too Many Requests). Es un comportamiento esperado para proteger el sistema y, de hecho, me dio tranquilidad ver que el servidor nunca tiró errores 5xx ni se degradó de forma crítica. En cuanto bajé la intensidad de la carga, el sistema volvió a responder con normalidad al instante



**PARTE 4:**


**1. Arquitectura y Diseño**

**r:** Abordaría el feedback desde una perspectiva pedagógica y de buenas prácticas de desarrollo, no como una crítica destructiva. Le explicaría que el código de automatización debe tratarse con el mismo rigor que el de producción. Los impactos de su solución actual son: alto costo de mantenimiento (si la UI cambia, hay que corregir decenas de archivos), fragilidad (flakiness) por falta de manejo de excepciones y pruebas propensas a fallar por datos duplicados.



Para solucionarlo, le enseñaría dos principios y un patrón arquitectónico fundamental:



**Page Object Model (POM):** Separar por completo la lógica del test de la interfaz de usuario. Los locators se encapsulan en clases exclusivas de páginas, erradicando el hardcodeo en los steps.



**Principio Don't Repeat Yourself (DRY):** Reutilizar los steps parametrizándolos desde Gherkin (ej. usar Entonces el código de respuesta debe ser {int}) en lugar de escribir un step para el código 200, otro para el 201, etc.



**Separación de Responsabilidades y Data Driven Testing**: Extraer los datos de prueba del código y manejarlos mediante variables de entorno (dotenv) o data sets dinamizados con helpers.



**Manejo de Errores mediante Aserciones Robustas:** Reemplazar las esperas fijas por aserciones dinámicas implícitas de Playwright, controlando las excepciones de red para que el reporte falle con motivos claros.





**2. Calidad vs Velocidad**

r: comprendo mi rol no es ser el "policía" (esto crea fricción) del proyecto, sino un habilitador estratégico que expone los riesgos para que el negocio tome decisiones bien informada. Ante una presión de release con fallos críticos, no me limito a decir solo "no se pasa".
Mi flujo de acción seria:
a.- **Analizar la Causa Raíz:** Revisar y analizar si los fallos de las pruebas automatizadas son falsos negativos por intermitencia del ambiente o bugs reales de software

b.- **Construir un Matriz de Riesgo Técnico y de Negocio:** Si los bugs críticos afectan el core transaccional (ej. errores en pasarelas de pago o conciliación en el backend), presento una alerta roja formal.

c.- **Presentación de Evidencias:** Reúno al PO y al TL y expongo datos objetivos en Jira y reportes (Allure/Cucumber HTML) qué flujos están caídos, cuál es el impacto en el usuario final y qué pasaría en producción.

d.- **Proponer Alternativas:** Si el release es inamovible (o algo normativo), propongo un despliegue parcial aislando la funcionalidad corrupta tras un Feature Flag (apagando el flujo con error en producción), o coordinar un hotfix inmediato, asumiendo un 'GO' condicionado bajo la firma y responsabilidad del PO u otro responsable de negocio.


**3. Conflicto con Desarrollo**

**r:** Esto siempre se resuelven con datos y especificaciones, eliminando la subjetividad de las opiniones(así evitamos fricción y falta de cooperación. Mi enfoque para resolverlo de forma profesional se basa en tres pasos:



&#x20; **1.-Validación de Criterios de Aceptación:** Recurro a la Historia de Usuario original y a los criterios acordados en la planning. Si el comportamiento del sistema contradice lo estipulado por el negocio o el analista, el debate se cierra de inmediato con es un defecto de software

&#x20; **2 Demostración Técnica Técnica:** Comparto la evidencia recolectada por el framework de automatización o Postman: el payload enviado, el JSON de respuesta erróneo del backend (ej. un HTTP 500 o datos corruptos) y el comportamiento esperado según el contrato de la API. Muchas veces, realizo una breve llamada para ejecutar el flujo juntos (pair testing) y analizar los logs del servidor.

&#x20; **3 Perspectiva de Usuario (Edge Cases):** Si el desarrollador argumenta que 'ningún usuario real haría ese flujo', le demuestro técnicamente cómo ese escenario límite (un valor negativo o un campo vacío(que siempre pasa :()) podría ser explotado o generar un descuadre transaccional en la base de datos. Si la discrepancia persiste sobre si es un bug o una mejora, involucramos al PO para que defina la prioridad de negocio sin desgastar la relación con desarrollo



**4. Estrategia de Pruebas**

**r:** Para mejorar la calidad sin ralentizar los sprints de 2 semanas, implementaría una estrategia progresiva de Shift-Left Testing y Automatización Basada en Riesgo:



**Semana 1-2 (Foco en el Core):** No intentaría automatizar todo el sistema de golpe. Diseñaría junto al equipo un Smoke Test manual y automatizado ultra acotado (los 5 flujos vitales del negocio que si fallan, la empresa pierde dinero). Esto asegura estabilidad básica en cada entrega.

**Implementar BDD (Gherkin):** Cambiaría la forma en que los 2-3 QAs diseñan las pruebas. Escribir los escenarios en Gherkin junto a desarrollo antes de que codifiquen (Shift-Left) alinea las expectativas y evita que los bugs nazcan, acelerando las entregas funcionales.

**Automatización incremental en el Sprint:** Por cada nueva Historia de Usuario, se automatiza su API o flujo crítico en el mismo sprint (In-Sprint Automation). Las regresiones más densas se programan para correr de forma nocturna en pipelines de CI/CD para no quitarle tiempo de pruebas manuales al equipo durante el día.

**Dividir y Conquistar:** Apoyaría a los QAs manuales a estructurar las pruebas en lenguaje de negocio mientras el automatizador senior (yo) se encarga de la arquitectura técnica del framework, maximizando el rendimiento del equipo pequeño.



**5. Automatización y ROI**

**r:** Le explicaría que las pruebas manuales son rápidas la primera vez que se prueba una funcionalidad nueva pero se vuelven insostenibles y costosas y lentas a medida que el software crece y se crean nuevas unidades de negocio. En un esquema de releases frecuentes, el tiempo del QA manual se consume, se agota repitiendo la misma regresión una y otra vez, convirtiéndose en un cuello de botella que frena al negocio o deja escapar bugs por fatiga humana.

Justifico el valor de la automatización demostrando que es una inversión de escalabilidad: el costo de ejecutar una suite automatizada por milésima vez es cercano a cero, liberando a los QAs para realizar pruebas exploratorias de alto valor que inclusive pudiera detectar oportunidades de mejoras con mayor facilidad.
Para demostrar el ROI al un cargo de liderazgo , utilizaría las siguientes métricas de negocio y de ingeniería:



**Velocidad de entrega (Time-to-Market):** Reducción del tiempo total de la regresión (ej. pasar de 2 días de pruebas manuales a 10 minutos de ejecución automatizada en el pipeline)

**Bugs escapados:** Disminución del número de defectos críticos que llegan a producción tras implementar los Quality Gates automatizados.

**Costo de Ejecución:** Comparativa de horas/hombre invertidas en pruebas repetitivas versus el costo de mantención del framework

**Cobertura de Pruebas:** Incremento del porcentaje de caminos lógicos y APIs validadas de forma matemática, garantizando la consistencia de los datos masivos del negocio





