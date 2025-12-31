USE CRONODEMO;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ProveedoresMaster]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ProveedoresMaster](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [CodigoProveedor] [nvarchar](50) NOT NULL,
        [RazonSocial] [nvarchar](200) NOT NULL,
        [NumeroDocumento] [nvarchar](50) NULL,
        [Direccion] [nvarchar](500) NULL,
        [Telefono] [nvarchar](50) NULL,
        [Correo] [nvarchar](100) NULL,
        [Contacto] [nvarchar](100) NULL,
        [Activo] [bit] NOT NULL DEFAULT 1,
        [FechaCreacion] [datetime] NOT NULL DEFAULT GETDATE(),
        [UsuarioCreacion] [nvarchar](50) NULL,
     CONSTRAINT [PK_ProveedoresMaster] PRIMARY KEY CLUSTERED 
    (
        [Id] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
END
GO
