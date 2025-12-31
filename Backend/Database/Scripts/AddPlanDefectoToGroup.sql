
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ArticuloSecuenciaPorGrupo' AND COLUMN_NAME = 'PlanDefecto')
BEGIN
    ALTER TABLE ArticuloSecuenciaPorGrupo ADD PlanDefecto NVARCHAR(50) NULL;
    ALTER TABLE ArticuloSecuenciaPorGrupo ADD UnidadMedidaDefecto NVARCHAR(50) NULL;
END
GO
