-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('admin', 'jefe_taller', 'administrativo', 'operario');

-- CreateTable
CREATE TABLE "empresas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "rut" VARCHAR(20),
    "subdominio" VARCHAR(100),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuarios" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'operario',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entidades" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "rut" VARCHAR(20),
    "tipo" VARCHAR(20),
    "giro" VARCHAR(255),
    "direccion" TEXT,
    "comuna" VARCHAR(100),
    "ciudad" VARCHAR(100),
    "email" VARCHAR(255),
    "telefono" VARCHAR(50),
    "contacto_nombre" VARCHAR(255),
    "activo" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "tipo_medicion" VARCHAR(20),
    "unidad_base" VARCHAR(10),
    "permite_retazo" BOOLEAN DEFAULT false,
    "activo" BOOLEAN DEFAULT true,
    "precio_compra" DECIMAL(15,2) DEFAULT 0,
    "precio_venta" DECIMAL(15,2) DEFAULT 0,
    "stock_minimo" DECIMAL(12,4) DEFAULT 0,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operarios" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "codigo" VARCHAR(50),
    "nombre" VARCHAR(255) NOT NULL,
    "especialidad" VARCHAR(100),
    "valor_hora" DECIMAL(10,2) DEFAULT 0,
    "activo" BOOLEAN DEFAULT true,
    "email" VARCHAR(255),
    "celular" VARCHAR(50),

    CONSTRAINT "operarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipos" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "codigo" VARCHAR(50),
    "nombre" VARCHAR(255) NOT NULL,
    "tipo" VARCHAR(100),
    "valor_hora" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ubicacion" VARCHAR(100),
    "activo" BOOLEAN DEFAULT true,

    CONSTRAINT "equipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ubicaciones" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "centro" VARCHAR(100),
    "bodega" VARCHAR(100),
    "ubicacion" VARCHAR(100),
    "nivel" VARCHAR(50),

    CONSTRAINT "ubicaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotizaciones" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "entidad_id" INTEGER,
    "cliente_nombre" VARCHAR(255) NOT NULL,
    "folio" VARCHAR(20),
    "fecha_emision" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "validez_dias" INTEGER DEFAULT 15,
    "monto_neto" DECIMAL(15,2) DEFAULT 0,
    "monto_iva" DECIMAL(15,2) DEFAULT 0,
    "monto_total" DECIMAL(15,2) DEFAULT 0,
    "estado" VARCHAR(20),
    "observaciones" TEXT,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "imagen_url" TEXT,
    "pdf_base64" TEXT,
    "fecha_ultimo_envio" TIMESTAMP(6),
    "motivo_rechazo" TEXT,
    "fecha_rechazo" TIMESTAMP(6),

    CONSTRAINT "cotizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_cotizaciones" (
    "id" SERIAL NOT NULL,
    "cotizacion_id" INTEGER,
    "tipo_item" VARCHAR(20) DEFAULT 'servicio',
    "producto_id" INTEGER,
    "operario_id" INTEGER,
    "equipo_id" INTEGER,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(12,4) NOT NULL,
    "unitario" DECIMAL(15,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "detalle_cotizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_trabajo" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "cotizacion_id" INTEGER,
    "entidad_id" INTEGER,
    "folio" VARCHAR(20),
    "cliente_nombre" VARCHAR(255),
    "estado" VARCHAR(20),
    "fecha_inicio" TIMESTAMP(6),
    "fecha_fin" TIMESTAMP(6),
    "costo_estimado" DECIMAL(15,2) DEFAULT 0,
    "costo_real" DECIMAL(15,2) DEFAULT 0,
    "precio_venta" DECIMAL(15,2) DEFAULT 0,
    "margen_real" DECIMAL(15,2) DEFAULT 0,
    "margen_porcentaje" DECIMAL(5,2) DEFAULT 0,
    "pdf_base64" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordenes_trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tareas" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "ot_id" INTEGER,
    "operario_id" INTEGER,
    "dependencia_id" INTEGER,
    "nombre" VARCHAR(255) NOT NULL,
    "estado" VARCHAR(20),
    "tipo" VARCHAR(20),
    "orden" INTEGER,
    "requiere_material" BOOLEAN DEFAULT false,
    "requiere_documento" BOOLEAN DEFAULT false,
    "observaciones" TEXT,
    "fecha_inicio" TIMESTAMP(6),
    "fecha_fin" TIMESTAMP(6),
    "fecha_inicio_real" TIMESTAMP(6),
    "fecha_fin_real" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tareas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades_stock" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "producto_id" INTEGER,
    "ubicacion_id" INTEGER,
    "es_agregado" BOOLEAN DEFAULT false,
    "tipo_unit" VARCHAR(20),
    "cantidad_total" DECIMAL(12,4) DEFAULT 1,
    "cantidad_disponible" DECIMAL(12,4) DEFAULT 1,
    "cantidad_reservada" DECIMAL(12,4) DEFAULT 0,
    "largo" DECIMAL(10,2),
    "ancho" DECIMAL(10,2),
    "espesor" DECIMAL(10,2),
    "peso" DECIMAL(10,2),
    "estado" VARCHAR(20),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unidades_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumo_ot" (
    "id" SERIAL NOT NULL,
    "tarea_id" INTEGER,
    "unidad_stock_id" INTEGER,
    "cantidad_utilizada" DECIMAL(12,4) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumo_ot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "unidad_stock_id" INTEGER,
    "usuario_id" INTEGER,
    "tipo" VARCHAR(20),
    "cantidad_movida" DECIMAL(12,4) NOT NULL,
    "referencia_tipo" VARCHAR(20),
    "referencia_id" INTEGER,
    "motivo" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_tiempo" (
    "id" SERIAL NOT NULL,
    "tarea_id" INTEGER,
    "operario_id" INTEGER,
    "equipo_id" INTEGER,
    "horas" DECIMAL(10,2),
    "costo_total" DECIMAL(15,2),
    "descripcion" TEXT,
    "fecha_registro" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registro_tiempo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pausas_tarea" (
    "id" SERIAL NOT NULL,
    "tarea_id" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "fecha_pausa" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_reanudacion" TIMESTAMP(6),

    CONSTRAINT "pausas_tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogo_tareas" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN DEFAULT true,

    CONSTRAINT "catalogo_tareas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correos_internos" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "empresa" VARCHAR(100),
    "telefono" VARCHAR(50),
    "ultimo_uso" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "correos_internos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_subdominio_key" ON "empresas"("subdominio");

-- CreateIndex
CREATE UNIQUE INDEX "Usuarios_email_key" ON "Usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "entidades_tenant_id_rut_key" ON "entidades"("tenant_id", "rut");

-- CreateIndex
CREATE UNIQUE INDEX "productos_tenant_id_codigo_key" ON "productos"("tenant_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "operarios_tenant_id_codigo_key" ON "operarios"("tenant_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "equipos_tenant_id_codigo_key" ON "equipos"("tenant_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "cotizaciones_tenant_id_folio_key" ON "cotizaciones"("tenant_id", "folio");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_trabajo_tenant_id_folio_key" ON "ordenes_trabajo"("tenant_id", "folio");

-- CreateIndex
CREATE UNIQUE INDEX "catalogo_tareas_tenant_id_codigo_key" ON "catalogo_tareas"("tenant_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "correos_internos_tenant_id_email_key" ON "correos_internos"("tenant_id", "email");

-- AddForeignKey
ALTER TABLE "Usuarios" ADD CONSTRAINT "Usuarios_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entidades" ADD CONSTRAINT "entidades_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operarios" ADD CONSTRAINT "operarios_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ubicaciones" ADD CONSTRAINT "ubicaciones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_entidad_id_fkey" FOREIGN KEY ("entidad_id") REFERENCES "entidades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_cotizaciones" ADD CONSTRAINT "detalle_cotizaciones_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_cotizaciones" ADD CONSTRAINT "detalle_cotizaciones_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_cotizaciones" ADD CONSTRAINT "detalle_cotizaciones_operario_id_fkey" FOREIGN KEY ("operario_id") REFERENCES "operarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_cotizaciones" ADD CONSTRAINT "detalle_cotizaciones_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_entidad_id_fkey" FOREIGN KEY ("entidad_id") REFERENCES "entidades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_ot_id_fkey" FOREIGN KEY ("ot_id") REFERENCES "ordenes_trabajo"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_operario_id_fkey" FOREIGN KEY ("operario_id") REFERENCES "operarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_dependencia_id_fkey" FOREIGN KEY ("dependencia_id") REFERENCES "tareas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidades_stock" ADD CONSTRAINT "unidades_stock_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidades_stock" ADD CONSTRAINT "unidades_stock_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "unidades_stock" ADD CONSTRAINT "unidades_stock_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "ubicaciones"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consumo_ot" ADD CONSTRAINT "consumo_ot_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "tareas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consumo_ot" ADD CONSTRAINT "consumo_ot_unidad_stock_id_fkey" FOREIGN KEY ("unidad_stock_id") REFERENCES "unidades_stock"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_unidad_stock_id_fkey" FOREIGN KEY ("unidad_stock_id") REFERENCES "unidades_stock"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_tiempo" ADD CONSTRAINT "registro_tiempo_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "tareas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registro_tiempo" ADD CONSTRAINT "registro_tiempo_operario_id_fkey" FOREIGN KEY ("operario_id") REFERENCES "operarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registro_tiempo" ADD CONSTRAINT "registro_tiempo_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pausas_tarea" ADD CONSTRAINT "pausas_tarea_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "tareas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogo_tareas" ADD CONSTRAINT "catalogo_tareas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correos_internos" ADD CONSTRAINT "correos_internos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
