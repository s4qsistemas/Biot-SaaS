-- AlterTable
ALTER TABLE "Cotizacion" ADD COLUMN     "firma_url" TEXT,
ADD COLUMN     "folio_externo" VARCHAR(50),
ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "nave_id" INTEGER,
ADD COLUMN     "solicitud_cotizacion" VARCHAR(50);

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "direccion" VARCHAR(255);

-- CreateTable
CREATE TABLE "Nave" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "Nave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Nave_tenant_id_nombre_key" ON "Nave"("tenant_id", "nombre");

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_nave_id_fkey" FOREIGN KEY ("nave_id") REFERENCES "Nave"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Nave" ADD CONSTRAINT "Nave_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
