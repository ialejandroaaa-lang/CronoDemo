USE CRONODEMO;
GO

-- Compras Master Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ComprasMaster]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ComprasMaster](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [NumeroCompra] [nvarchar](50) NOT NULL,
        [ProveedorId] [int] NOT NULL,
        [FechaCompra] [datetime] NOT NULL,
        [FechaRecepcion] [datetime] NULL,
        [Estado] [nvarchar](20) NOT NULL DEFAULT 'Borrador', -- Borrador, Completado, Anulado
        [TerminosPago] [nvarchar](50) NULL,
        [ReferenciaProveedor] [nvarchar](50) NULL,
        [Subtotal] [decimal](18, 2) NOT NULL DEFAULT 0,
        [Impuestos] [decimal](18, 2) NOT NULL DEFAULT 0,
        [Total] [decimal](18, 2) NOT NULL DEFAULT 0,
        [Observaciones] [nvarchar](max) NULL,
        [UsuarioCreacion] [nvarchar](50) NULL,
        [FechaCreacion] [datetime] NOT NULL DEFAULT GETDATE(),
     CONSTRAINT [PK_ComprasMaster] PRIMARY KEY CLUSTERED 
    (
        [Id] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
END
GO

-- Compras Detail Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ComprasDetalle]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ComprasDetalle](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [CompraId] [int] NOT NULL,
        [ArticuloId] [int] NOT NULL,
        [NumeroArticulo] [nvarchar](50) NOT NULL,
        [Descripcion] [nvarchar](200) NOT NULL,
        [Cantidad] [decimal](18, 4) NOT NULL,
        [UnidadMedida] [nvarchar](20) NOT NULL,
        [CostoUnitario] [decimal](18, 4) NOT NULL,
        [PorcentajeImpuesto] [decimal](18, 2) NOT NULL DEFAULT 0,
        [MontoImpuesto] [decimal](18, 2) NOT NULL DEFAULT 0,
        [TotalLinea] [decimal](18, 2) NOT NULL,
        [AlmacenId] [nvarchar](50) NULL,
     CONSTRAINT [PK_ComprasDetalle] PRIMARY KEY CLUSTERED 
    (
        [Id] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]

    ALTER TABLE [dbo].[ComprasDetalle]  WITH CHECK ADD  CONSTRAINT [FK_ComprasDetalle_ComprasMaster] FOREIGN KEY([CompraId])
    REFERENCES [dbo].[ComprasMaster] ([Id])
    ON DELETE CASCADE
    
    ALTER TABLE [dbo].[ComprasDetalle] CHECK CONSTRAINT [FK_ComprasDetalle_ComprasMaster]
END
GO
