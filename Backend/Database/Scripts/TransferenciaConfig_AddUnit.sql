IF EXISTS (SELECT * FROM sysobjects WHERE name='TransferenciaConfigurations' AND xtype='U')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[TransferenciaConfigurations]') AND name = 'DefaultUnit')
    BEGIN
        ALTER TABLE TransferenciaConfigurations ADD DefaultUnit NVARCHAR(20) NULL
    END
END
