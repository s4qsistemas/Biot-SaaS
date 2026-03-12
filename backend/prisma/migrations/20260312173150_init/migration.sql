-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('super_admin', 'admin', 'gerente', 'jefe_taller', 'administrativo', 'operario');

-- CreateTable
CREATE TABLE "Empresa" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "rut" VARCHAR(20) NOT NULL,
    "alias" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_vencimiento" TIMESTAMP(3),
    "plan_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'operario',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "debe_cambiar_password" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entidad" (
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

    CONSTRAINT "Entidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
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

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operario" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "codigo" VARCHAR(50),
    "nombre" VARCHAR(255) NOT NULL,
    "especialidad" VARCHAR(100),
    "valor_hora" DECIMAL(10,2) DEFAULT 0,
    "activo" BOOLEAN DEFAULT true,
    "email" VARCHAR(255),
    "celular" VARCHAR(50),

    CONSTRAINT "Operario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipo" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "codigo" VARCHAR(50),
    "nombre" VARCHAR(255) NOT NULL,
    "tipo" VARCHAR(100),
    "valor_hora" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ubicacion" VARCHAR(100),
    "activo" BOOLEAN DEFAULT true,

    CONSTRAINT "Equipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ubicacion" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "centro" VARCHAR(100),
    "bodega" VARCHAR(100),
    "ubicacion" VARCHAR(100),
    "nivel" VARCHAR(50),

    CONSTRAINT "Ubicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "entidad_id" INTEGER NOT NULL,
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

    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleCotizacion" (
    "id" SERIAL NOT NULL,
    "cotizacion_id" INTEGER NOT NULL,
    "tipo_item" VARCHAR(20) DEFAULT 'servicio',
    "producto_id" INTEGER,
    "operario_id" INTEGER,
    "equipo_id" INTEGER,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(12,4) NOT NULL,
    "unitario" DECIMAL(15,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "DetalleCotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenTrabajo" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "cotizacion_id" INTEGER NOT NULL,
    "entidad_id" INTEGER NOT NULL,
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

    CONSTRAINT "OrdenTrabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarea" (
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

    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadStock" (
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

    CONSTRAINT "UnidadStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumoOt" (
    "id" SERIAL NOT NULL,
    "tarea_id" INTEGER,
    "unidad_stock_id" INTEGER,
    "cantidad_utilizada" DECIMAL(12,4) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsumoOt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movimiento" (
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

    CONSTRAINT "Movimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroTiempo" (
    "id" SERIAL NOT NULL,
    "tarea_id" INTEGER,
    "operario_id" INTEGER,
    "equipo_id" INTEGER,
    "horas" DECIMAL(10,2),
    "costo_total" DECIMAL(15,2),
    "descripcion" TEXT,
    "fecha_registro" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroTiempo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PausaTarea" (
    "id" SERIAL NOT NULL,
    "tarea_id" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "fecha_pausa" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_reanudacion" TIMESTAMP(6),

    CONSTRAINT "PausaTarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogoTarea" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN DEFAULT true,

    CONSTRAINT "CatalogoTarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorreoInterno" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "empresa" VARCHAR(100),
    "telefono" VARCHAR(50),
    "ultimo_uso" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorreoInterno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "limite_usuarios" INTEGER NOT NULL DEFAULT 5,
    "precio_mensual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditoriaEmpresa" (
    "id" SERIAL NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "tipo_evento" VARCHAR(50) NOT NULL,
    "valor_anterior" TEXT,
    "valor_nuevo" TEXT,
    "justificacion" TEXT NOT NULL,
    "modificado_por_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaEmpresa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_rut_key" ON "Empresa"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_alias_key" ON "Empresa"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Entidad_tenant_id_rut_key" ON "Entidad"("tenant_id", "rut");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_tenant_id_codigo_key" ON "Producto"("tenant_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Operario_tenant_id_codigo_key" ON "Operario"("tenant_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Equipo_tenant_id_codigo_key" ON "Equipo"("tenant_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Cotizacion_tenant_id_folio_key" ON "Cotizacion"("tenant_id", "folio");

-- CreateIndex
CREATE UNIQUE INDEX "OrdenTrabajo_tenant_id_folio_key" ON "OrdenTrabajo"("tenant_id", "folio");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogoTarea_tenant_id_codigo_key" ON "CatalogoTarea"("tenant_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "CorreoInterno_tenant_id_email_key" ON "CorreoInterno"("tenant_id", "email");

-- AddForeignKey
ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entidad" ADD CONSTRAINT "Entidad_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operario" ADD CONSTRAINT "Operario_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipo" ADD CONSTRAINT "Equipo_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ubicacion" ADD CONSTRAINT "Ubicacion_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_entidad_id_fkey" FOREIGN KEY ("entidad_id") REFERENCES "Entidad"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DetalleCotizacion" ADD CONSTRAINT "DetalleCotizacion_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DetalleCotizacion" ADD CONSTRAINT "DetalleCotizacion_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCotizacion" ADD CONSTRAINT "DetalleCotizacion_operario_id_fkey" FOREIGN KEY ("operario_id") REFERENCES "Operario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCotizacion" ADD CONSTRAINT "DetalleCotizacion_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "Equipo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_entidad_id_fkey" FOREIGN KEY ("entidad_id") REFERENCES "Entidad"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "Cotizacion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_ot_id_fkey" FOREIGN KEY ("ot_id") REFERENCES "OrdenTrabajo"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_operario_id_fkey" FOREIGN KEY ("operario_id") REFERENCES "Operario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_dependencia_id_fkey" FOREIGN KEY ("dependencia_id") REFERENCES "Tarea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnidadStock" ADD CONSTRAINT "UnidadStock_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnidadStock" ADD CONSTRAINT "UnidadStock_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UnidadStock" ADD CONSTRAINT "UnidadStock_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "Ubicacion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsumoOt" ADD CONSTRAINT "ConsumoOt_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "Tarea"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsumoOt" ADD CONSTRAINT "ConsumoOt_unidad_stock_id_fkey" FOREIGN KEY ("unidad_stock_id") REFERENCES "UnidadStock"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_unidad_stock_id_fkey" FOREIGN KEY ("unidad_stock_id") REFERENCES "UnidadStock"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroTiempo" ADD CONSTRAINT "RegistroTiempo_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "Tarea"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "RegistroTiempo" ADD CONSTRAINT "RegistroTiempo_operario_id_fkey" FOREIGN KEY ("operario_id") REFERENCES "Operario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "RegistroTiempo" ADD CONSTRAINT "RegistroTiempo_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "Equipo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PausaTarea" ADD CONSTRAINT "PausaTarea_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "Tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogoTarea" ADD CONSTRAINT "CatalogoTarea_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorreoInterno" ADD CONSTRAINT "CorreoInterno_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaEmpresa" ADD CONSTRAINT "AuditoriaEmpresa_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaEmpresa" ADD CONSTRAINT "AuditoriaEmpresa_modificado_por_id_fkey" FOREIGN KEY ("modificado_por_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
