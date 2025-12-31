USE CRONODEMO;
GO

IF NOT EXISTS(SELECT * FROM sys.columns 
            WHERE Name = N'PlanMedida' AND Object_ID = Object_ID(N'ArticulosMaster'))
BEGIN
    ALTER TABLE ArticulosMaster
    ADD PlanMedida NVARCHAR(50) NULL;
    PRINT 'Columna PlanMedida agregada.';
END
GO
