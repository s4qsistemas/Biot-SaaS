-- AlterTable
ALTER TABLE "OrdenTrabajo" ADD COLUMN     "horario_programado" JSONB,
ALTER COLUMN "cotizacion_id" DROP NOT NULL;
