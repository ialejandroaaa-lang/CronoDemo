IF EXISTS (SELECT * FROM sysobjects WHERE name='TransferenciasDetalle' AND xtype='U')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[TransferenciasDetalle]') AND name = 'PlanUoM')
    BEGIN
        ALTER TABLE TransferenciasDetalle ADD PlanUoM NVARCHAR(50) NULL
    END
END
