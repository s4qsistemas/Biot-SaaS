-- AlterTable
ALTER TABLE "Nave" ADD COLUMN     "entidad_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Nave" ADD CONSTRAINT "Nave_entidad_id_fkey" FOREIGN KEY ("entidad_id") REFERENCES "Entidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;
