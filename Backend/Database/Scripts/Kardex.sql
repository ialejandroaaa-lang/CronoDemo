USE CRONODEMO;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MovimientosInventario]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[MovimientosInventario](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [ArticuloId] [int] NOT NULL,
        [FechaMovimiento] [datetime] NOT NULL DEFAULT GETDATE(),
        [TipoMovimiento] [nvarchar](20) NOT NULL, -- 'Entrada' (Purchase), 'Salida' (Sale), 'Ajuste'
        [Cantidad] [decimal](18, 4) NOT NULL, -- Positive for Entry, Negative for Exit
        [CostoUnitario] [decimal](18, 4) NOT NULL DEFAULT 0,
        [Referencia] [nvarchar](100) NULL, -- Source document (OC-2025-001, FAC-1002, etc)
        [Usuario] [nvarchar](50) NULL,
        [AlmacenId] [nvarchar](50) NULL,
        [StockAnterior] [decimal](18, 4) NULL,
        [StockNuevo] [decimal](18, 4) NULL,
     CONSTRAINT [PK_MovimientosInventario] PRIMARY KEY CLUSTERED 
    (
        [Id] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
END
GO
