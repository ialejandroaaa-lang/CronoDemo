USE [PosCrono]
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Clients]') AND name = 'Moneda')
BEGIN
    PRINT 'Adding Moneda column to Clients table...'
    ALTER TABLE Clients ADD Moneda nvarchar(10) NULL
    PRINT 'Moneda column added successfully.'
END
ELSE
BEGIN
    PRINT 'Moneda column already exists.'
END
GO
