# Notas de Entrega e Inventario — PROTEK GROUP, C.A.

Sistema sencillo para emitir notas de entrega, llevar el inventario y el
kardex de movimientos, y registrar clientes y productos. Pensado para
correr en cualquier computadora con Node.js, sin depender de servicios en
la nube ni bases de datos externas.

## Qué hace

- **Empresa**: datos fiscales y logo que aparecen en el encabezado de cada
  nota de entrega.
- **Clientes**: nombre, RIF, dirección, teléfono y correo. Se pueden
  archivar (no se eliminan) para conservar el historial de sus notas.
- **Productos**: nombre, modelo, color, talla, SKU, unidad de venta,
  descripción, foto y precio de venta (siempre editable). El inventario
  inicial se carga al crear el producto.
- **Notas de entrega**: se eligen el cliente y los productos con su
  cantidad y precio; el sistema arma el total, descuenta el inventario y
  genera un documento imprimible (botón "Imprimir / Guardar PDF") con el
  logo y los datos de la empresa, los datos del cliente y espacio para
  firmas de entrega y recibido. Se pueden anular (el inventario entregado
  vuelve a sumarse al stock).
- **Kardex**: movimientos de inventario (entradas, salidas y ajustes por
  conteo físico) por producto, con filtro por rango de fechas.
- **Reportes**: total facturado por cliente (con filtro de fechas) y
  valor actual del inventario.
- **Panel**: resumen del mes, notas recientes y productos con stock bajo.

## Cómo correrlo

Requiere [Node.js](https://nodejs.org) 22 o superior.

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Los datos se guardan
en un archivo SQLite en `data/app.db`, que se crea automáticamente la
primera vez que se ejecuta la aplicación.

Para producción:

```bash
npm run build
npm run start
```

## Dónde viven los datos

Todo se guarda localmente en `data/app.db` (una base de datos SQLite, sin
necesidad de instalar ni configurar ningún motor de base de datos aparte).
Esa carpeta **no se sube al repositorio** (está en `.gitignore`), así que
cada computadora donde corras la aplicación tiene su propia base de datos.

Esto significa que, tal como está hoy, el sistema es ideal para trabajar
desde una sola computadora (o para llevarlo de un lado a otro copiando la
carpeta `data/`), pero **no sincroniza automáticamente entre varios
dispositivos**. Si más adelante quieres acceder desde el teléfono, la
tienda y la oficina al mismo tiempo con los mismos datos, se puede migrar
la base de datos a un servicio en la nube (por ejemplo Postgres/Supabase)
y desplegar la aplicación (por ejemplo en Vercel) — es un cambio acotado
porque toda la lógica de datos está centralizada en `src/lib/db.ts` y
`src/lib/repo/`.

## Catálogo inicial

La base de datos se siembra automáticamente (solo la primera vez) con:

- Los datos de PROTEK GROUP, C.A. (RIF, dirección, teléfono, correo).
- 90 productos armados a partir del packing list del contenedor: un
  producto por cada combinación de modelo + color + talla (FZ003 a FZ011),
  con el inventario inicial real de esa lista. El precio de venta queda en
  `0` hasta cargar la lista de precios — se edita por producto en
  **Productos**, en cualquier momento.

Esta siembra inicial vive en `src/lib/db.ts` (función `seedProtekCatalog`
y el `INSERT` de la tabla `company`); es el lugar a editar si cambian los
datos de la empresa o se quiere ajustar el catálogo de arranque.

## Estructura del proyecto

```
src/
  lib/
    db.ts            Conexión SQLite, esquema de tablas y siembra inicial
    types.ts         Tipos de datos compartidos
    format.ts        Formato de moneda/fecha y normalización de RIF
    validate.ts       Helpers de validación de formularios
    repo/            Consultas a la base de datos, por entidad
    actions/         Server Actions (crear/editar/archivar/etc.)
  app/
    empresa/          Datos de la empresa y logo
    clientes/         Alta, edición e historial de clientes
    productos/        Alta, edición, foto e inventario de productos
    notas-entrega/    Emisión, listado, vista imprimible y anulación
    reportes/         Facturado por cliente e inventario
    kardex/           Movimientos de inventario por producto
```

No usa un ORM externo: las consultas son SQL directo sobre el módulo
nativo `node:sqlite` de Node.js (todavía experimental en Node 22, pero
sin dependencias adicionales que instalar).

## Notas

- No tiene inicio de sesión: está pensado como una herramienta interna de
  un solo usuario. Si se va a exponer más allá de la red local, conviene
  agregarle autenticación antes.
- Los documentos de nota de entrega se generan como una página web lista
  para imprimir; usa el botón "Imprimir / Guardar PDF" del navegador para
  obtener el PDF.
