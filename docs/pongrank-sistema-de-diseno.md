# Sistema de diseño de PongRank Mobile

Propuesta de referencia para las pantallas de PongRank. El visor de amistad muestra las decisiones de esta revisión.

## Color y tipografía

| Uso | Color |
| --- | --- |
| Fondo principal | `#000000` |
| Tarjetas y superficies | `#141416` |
| Bordes y divisores | `#2A2A2E` |
| Texto principal | `#FFFFFF` |
| Texto secundario | `#B9BBC1` |
| Rojo de marca y pestaña activa | `#E8262F` |
| Acción primaria y contador de actividad nueva | `#D81E28` |
| Rojo en pulsación | `#B01E26` |
| Acción de texto, foco, selección y datos deportivos | `#22D3EE` |
| Fondo de acción secundaria | `#252529` |
| Deshabilitado | Fondo `#232326`, texto `#9A9CA3`, borde `#2A2A2E` |
| Confirmación y vínculo activo | `#2ECC71`, con texto e icono |
| Verificación FDPTM | Oro `#FFD278`, fondo `#372A15`, borde `#715426` |
| Aviso que requiere atención | Sin color propio: superficie `#141416`, borde `#2A2A2E`, icono y texto de la paleta existente |
| Acción destructiva secundaria | Texto `#FF969C` |
| Contador (único) | Fondo `#D81E28`, texto blanco |

Tipografía del sistema. Título principal de pestaña **34 pt**, título de detalle **26–30 pt**, sección **18 pt**, cuerpo **15–16 pt** y texto de apoyo **12–13 pt**. Cifras tabulares para rating, marcador y contadores. El podio usa oro `#FFD278`, plata `#D0D7E2` y bronce `#F0AF86`, con icono y número de puesto. La tarjeta de derrota usa degradado `#431B23` a `#291418`, texto `#FFC3C8`, equis y puntos negativos.

## Acciones

| Variante | Apariencia | Ejemplo |
| --- | --- | --- |
| Primaria | Relleno rojo, texto e icono blancos. Ancho completo cuando tiene su propia fila. | Enviar solicitud, aceptar, retar |
| Secundaria | Relleno grafito, texto e icono blancos. Mismo alto que la primaria en acciones pareadas. | Rechazar, cancelar un diálogo |
| Solo texto | Celeste, fondo transparente y texto sin subrayado. Flecha al final cuando abre otra pantalla. | Ver perfil, cancelar solicitud, cambiar visibilidad |
| Deshabilitada | Fondo y texto grises con motivo cercano cuando haga falta. Expuesta como deshabilitada al lector de pantalla. | Continuar cuando falta elegir rival |
| En proceso | Indicador de carga dentro de la acción y ancho reservado. Se protege contra toques duplicados. | Aceptando solicitud |
| Destructiva | Texto rosa rojizo en el menú. Confirmación centrada con acción roja explícita. | Eliminar amistad |

Las acciones usan una zona táctil de al menos **44 pt**, radio de **12 pt** y foco visible. Se separan **8 pt** entre sí. Cuando hay una acción principal en el pie, se reservan **12 pt** como mínimo encima de la navegación y se respeta la zona segura. «Cerrar sesión» conserva el tratamiento de texto gris definido en Perfil.

**Solicitudes recibidas** combina «Ver perfil ›» como acción de texto, «Aceptar» como primaria y «Rechazar» como secundaria. «Solicitud recibida» y «Solicitud enviada» se muestran como información de estado dentro del contenido. Las acciones aparecen debajo. El estado usa un icono y texto sin apariencia de botón. Rechazar y Cancelar solicitud permanecen disponibles mientras la solicitud pueda resolverse.

## Insignias, estados y selección

- **Contador único, rojo**, para cualquier cantidad pendiente (solicitudes recibidas, enviadas, etc.). No existe variante gris. Se omite en cero, muestra «9+» como máximo y tiene etiqueta accesible («1 solicitud pendiente»).
- **Paleta cerrada**: no se agregan colores nuevos. El dorado `#FFD278` se usa solo para «FDPTM verificado» y el podio. Los avisos usan la paleta existente.
- **Insignia dorada con escudo** para «FDPTM verificado». Se muestra solo si la verificación está confirmada.
- **Estados vacíos** usan la mascota de PongRank con una frase contextual corta. La mascota es parte del sistema y puede repetirse; las ilustraciones decorativas de cada pantalla se usan una vez.
- **Insignia verde con icono** para «Ya son Pongmigos». En ese estado, «Retar a una partida» es la acción primaria.
- **Selección de filtros** con fondo `#36191E`, borde `#D84149`, texto `#FFB3B7` y check. Las pestañas segmentadas usan un fondo grafito y texto centrado.
- La carga usa un indicador o esqueleto en el espacio del contenido. Los estados vacíos usan una frase contextual. Los errores muestran el mensaje y, cuando resulte posible, la acción «Reintentar».

## Navegación, medidas y composición

- Referencia **iPhone 16 Pro, 402 × 874 pt**. Las pantallas pueden desplazar su contenido si hay menos altura o aumenta el texto. La barra inferior y la zona segura conservan espacio propio.
- Márgenes laterales de **16 pt**. Escala de Mobile **2, 4, 8, 16, 24, 32, 64 pt**. Tarjetas con radios **14–16 pt**, diálogos **20–24 pt**.
- Barra inferior en el orden **Inicio, Social, Partidas, Ranking y Perfil**. Pestaña activa con círculo rojo, icono blanco y etiqueta roja. Comunidades, Clubes y Amigos usan un segmento común con labels centradas. Los filtros de búsqueda usan chips.
- Los controles usan Lucide. Las redes usan sus propios símbolos. Las confirmaciones sencillas y los formularios breves usan un diálogo centrado. La explicación de planes usa un panel inferior.
- Comunidades usa degradado celeste, Clubes usa carbón, rojo y escudo, y el perfil público usa portada de tenis de mesa. Las ilustraciones específicas de una pantalla se usan una vez. El isotipo y los iconos funcionales se comparten como parte del sistema.

## Perfil público y Pongmigos

- Avatar circular con halo celeste y una versión pequeña del isotipo de paleta y pelota en la esquina inferior derecha. La verificación FDPTM lleva su propia insignia junto a la identidad.
- Rating, partidas y victorias comparten una fila de igual ancho. Los números tienen mayor tamaño y un halo celeste tenue.
- Instagram, TikTok y Facebook ocupan todo el ancho en tres columnas con su icono. Con enlace, usan borde y texto celestes. Sin enlace, aparecen en gris y deshabilitados.
- La fila de Pongmigos muestra la cifra junto a «Ver lista ›» cuando es pública. Si está oculta, muestra la cifra junto a «Lista privada» con un candado.
- En Social, con hasta cinco Pongmigos, el perfil se abre tocando la fila y el menú de tres puntos contiene «Retar a una partida» y «Eliminar amistad». Con más de cinco aparece la vista previa de cinco filas y «Ver todos mis Pongmigos ›». La lista completa tiene búsqueda y menú por persona.

## Aplicación en el repositorio

La revisión local encontró que `Brand.red` usa `#E8262F`, `AuthButton` reduce la opacidad al deshabilitarse, y algunas pantallas de registro y marcador todavía subrayan acciones de texto. La propuesta conserva `Brand.red` para marca y navegación y usa `#D81E28` para la acción primaria con texto blanco. La migración se puede hacer con variantes compartidas de botón e insignia y una revisión visual de sus pantallas consumidoras.

## Ilustraciones y generación de imágenes

Cuando se propone o rediseña una pantalla, se debe proponer también su ilustración (estado vacío, banner o portada) para mantener el tono lúdico, joven y gamer de PongRank.

**Reglas**

- Personajes: los robots de PongRank (casco negro, visor con ojos luminosos, detalles rojos; el segundo robot lleva acentos dorados). Mismo estilo 3D suave en todas las imágenes.
- Paleta cerrada: fondo negro o carbón, rojo de marca `#E8262F` como acento y celeste `#22D3EE` como luz secundaria. El dorado solo en detalles pequeños del segundo robot. No se introducen colores nuevos.
- Fondo oscuro, sin texto dentro de la imagen, sin marcas ni logos externos. La imagen debe verse bien recortada a 16:9 (banner) o 1:1 (estado vacío).
- Una ilustración, una pantalla: cada ilustración decorativa se usa en una sola pantalla. Solo el isotipo y la mascota de estados vacíos son recursos compartidos, con la misma pose y emoción para el mismo tipo de estado.
- Emoción según el contexto: contento y animado (logros, amigos), curioso (búsqueda), triste con lágrima (sin resultados o sin amigos), concentrado (partida en curso), de celebración (victoria, torneo ganado).
- Accesibilidad: la imagen es decorativa; no lleva información clave ni sustituye al texto. Las imágenes no se usan como fondo de texto sin un degradado oscuro que mantenga el contraste 4.5:1.
- Entrega: PNG o WebP, máximo 1600 px de ancho, peso menor a 300 KB y con nombre descriptivo (`banner-pongmigos.webp`, `vacio-solicitudes.webp`).

**Plantilla de prompt (completar lo que está entre corchetes)**

> Ilustración 3D estilizada y amigable de [escena: por ejemplo, dos robots chocando las manos], personajes robot de PongRank con casco negro brillante, visor con ojos luminosos y detalles rojos; [segundo robot con acentos dorados]. Fondo [negro/carbón con degradado rojo oscuro], luz rojiza y destellos celestes. Estilo juvenil, lúdico y gamer, iluminación suave de estudio, bordes redondeados. Composición [16:9 con el sujeto a la derecha / 1:1 centrada] y espacio libre para texto superpuesto. Sin texto, sin logos, sin colores fuera de negro, rojo, celeste y toques dorados.

**Por cada pantalla propuesta, entregar**: (1) el prompt completado, (2) dónde se usa (banner, vacío o portada), (3) la emoción del robot y (4) confirmación de que la imagen no se repite en otra pantalla.

## Reglas de Social (Comunidades, Clubes y Pongmigos)

**Estructura y pestañas**
- Social tiene tres segmentos: **Comunidades · Clubes · Amigos**. Siempre con el mismo componente segmentado (fondo grafito, texto centrado, segmento activo resaltado). No se usan pestañas subrayadas.
- Los chips se reservan para filtros dentro de una lista (por ejemplo, ciudad o categoría). Un segmento cambia de sección; un chip filtra.
- Partidas usa el mismo segmento para sus secciones. Un solo patrón de pestañas en toda la app.
- La búsqueda de Social está arriba y busca dentro del segmento activo.

**Nombre y voz**
- En toda la interfaz se dice **Pongmigos** (no «amigos» ni «friends»). Los nombres internos de código (`friendships`) no cambian.
- Tono cercano y juvenil, en tú, con frases cortas y verbos de acción: «Aún no tienes Pongmigos agregados.», «Enviar solicitud», «Retar a una partida».
- Los estados de solicitud se escriben como información, no como botón: «Solicitud recibida», «Solicitud enviada».

**Solicitudes y contadores**
- Un único contador, rojo, en «Solicitudes recibidas» y en «Solicitudes enviadas». Se omite en cero y muestra «9+» como máximo.
- Solicitud recibida: «Ver perfil ›» (texto), «Aceptar» (primaria) y «Rechazar» (secundaria). Solicitud enviada: «Cancelar solicitud» como acción de texto.
- Eliminar un Pongmigo siempre pide confirmación en un diálogo centrado con acción roja explícita.

**Estados de verificación FDPTM** (misma insignia dorada con escudo, sin color nuevo)
- **FDPTM verificado:** insignia dorada junto al nombre.
- **En revisión:** texto «Verificación en revisión» en gris con icono de reloj, sin insignia.
- **No verificado:** no se muestra insignia. Solo el dueño del perfil ve la acción «Verificar mi cuenta».

**Formularios y feedback**
- Errores en línea, debajo del campo, con texto claro de qué corregir. Nunca solo color.
- Las acciones completadas muestran un aviso breve (toast) de unos 3 segundos: «Solicitud enviada», «Pongmigo eliminado». No bloquea la pantalla y no usa color nuevo.
- Los botones en proceso muestran carga y se protegen contra toques duplicados.

**Sin conexión y errores de red**
- Pantalla o bloque con la mascota, el mensaje «No pudimos conectar con PongRank» y la acción primaria «Reintentar». Se conserva el contenido ya cargado cuando sea posible.

**Estados vacíos de Social** (con la mascota y una frase)
- Sin Pongmigos: «Aún no tienes Pongmigos agregados.» (mascota triste).
- Sin solicitudes: «No tienes solicitudes pendientes.» (mascota tranquila).
- Sin resultados de búsqueda: «No encontramos a nadie con ese nombre.» (mascota curiosa).
- Cada estado vacío incluye una acción útil cuando existe (por ejemplo, «Buscar jugadores»).

## Checklist de las 10 heurísticas de Nielsen

Antes de cerrar una pantalla, verificar:
1. **Visibilidad del estado:** carga, éxito y error siempre visibles; el contador de pendientes está actualizado.
2. **Lenguaje del usuario:** «Pongmigos», «Retar», sin términos técnicos ni nombres internos.
3. **Control y libertad:** se puede cancelar una solicitud y cerrar diálogos; hay salida en cada flujo.
4. **Consistencia:** mismos botones, segmentos, contador y colores en todas las pantallas.
5. **Prevención de errores:** confirmación antes de eliminar, botón deshabilitado con motivo, protección contra doble toque.
6. **Reconocer antes que recordar:** etiquetas junto a los iconos, acciones visibles, filtros que muestran su selección.
7. **Flexibilidad y eficiencia:** búsqueda en Social, acceso directo a «Retar» desde el menú de cada Pongmigo.
8. **Diseño minimalista:** una acción primaria por pantalla; máximo tres tipos de botón.
9. **Ayuda a reconocer y recuperarse de errores:** mensaje claro, qué pasó y «Reintentar».
10. **Ayuda y documentación:** explicación breve de planes, de la verificación FDPTM y estados vacíos que orientan el siguiente paso.

## Dónde vive este documento

Este archivo es la única fuente del sistema de diseño de PongRank Mobile: colores, acciones, insignias, navegación, reglas de Social, ilustraciones y la checklist de Nielsen. Se guarda en el repositorio móvil en `docs/pongrank-sistema-de-diseno.md` y cualquier cambio de diseño se actualiza aquí.
