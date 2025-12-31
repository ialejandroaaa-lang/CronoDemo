-- Script para crear tabla de plantillas de recibos
-- Fecha: 2025-12-20
-- Descripción: Tabla para almacenar diseños personalizables de recibos térmicos

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ReceiptTemplates')
BEGIN
    CREATE TABLE ReceiptTemplates (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(100) NOT NULL,
        Descripcion NVARCHAR(500),
        TipoRecibo NVARCHAR(50) NOT NULL DEFAULT 'Venta', -- 'Venta', 'Devolucion', 'Cotizacion'
        AnchoMM INT NOT NULL DEFAULT 80, -- 80mm o 58mm
        PrinterName NVARCHAR(100) NULL, -- Nombre de la impresora del sistema
        ConfiguracionJSON NVARCHAR(MAX) NOT NULL, -- Estructura del diseño
        Activo BIT NOT NULL DEFAULT 1,
        PorDefecto BIT NOT NULL DEFAULT 0,
        FechaCreacion DATETIME DEFAULT GETDATE(),
        FechaModificacion DATETIME DEFAULT GETDATE(),
        Usuario NVARCHAR(50)
    );

    PRINT 'Tabla ReceiptTemplates creada exitosamente';

    -- Crear plantilla por defecto
    INSERT INTO ReceiptTemplates (Nombre, Descripcion, TipoRecibo, AnchoMM, ConfiguracionJSON, PorDefecto, Usuario)
    VALUES (
        'Recibo Estándar 80mm',
        'Plantilla predeterminada para recibos de venta',
        'Venta',
        80,
        '{
  "width": 80,
  "sections": [
    {
      "id": "header",
      "name": "Encabezado",
      "order": 1,
      "visible": true,
      "fields": [
        {
          "id": "companyName",
          "type": "text",
          "source": "company.name",
          "text": "MI EMPRESA S.A.",
          "fontSize": 16,
          "bold": true,
          "alignment": "center",
          "marginBottom": 5
        },
        {
          "id": "companyRNC",
          "type": "text",
          "source": "company.rnc",
          "label": "RNC:",
          "fontSize": 10,
          "alignment": "center",
          "marginBottom": 5
        },
        {
          "id": "companyAddress",
          "type": "text",
          "source": "company.address",
          "fontSize": 9,
          "alignment": "center",
          "marginBottom": 10
        }
      ]
    },
    {
      "id": "info",
      "name": "Información",
      "order": 2,
      "visible": true,
      "fields": [
        {
          "id": "separator1",
          "type": "line",
          "style": "solid",
          "marginBottom": 5
        },
        {
          "id": "receiptNumber",
          "type": "text",
          "label": "Recibo #:",
          "source": "receipt.number",
          "fontSize": 10,
          "alignment": "left",
          "marginBottom": 3
        },
        {
          "id": "date",
          "type": "text",
          "label": "Fecha:",
          "source": "receipt.date",
          "format": "date",
          "fontSize": 10,
          "alignment": "left",
          "marginBottom": 3
        },
        {
          "id": "time",
          "type": "text",
          "label": "Hora:",
          "source": "receipt.time",
          "format": "time",
          "fontSize": 10,
          "alignment": "left",
          "marginBottom": 3
        },
        {
          "id": "cashier",
          "type": "text",
          "label": "Cajero:",
          "source": "receipt.cashier",
          "fontSize": 10,
          "alignment": "left",
          "marginBottom": 5
        },
        {
          "id": "separator2",
          "type": "line",
          "style": "solid",
          "marginBottom": 5
        }
      ]
    },
    {
      "id": "items",
      "name": "Productos",
      "order": 3,
      "visible": true,
      "type": "table",
      "fontSize": 9,
      "columns": [
        {"field": "description", "label": "Producto", "width": 50, "alignment": "left"},
        {"field": "qty", "label": "Cant", "width": 15, "alignment": "right"},
        {"field": "price", "label": "Precio", "width": 35, "alignment": "right", "format": "currency"}
      ]
    },
    {
      "id": "totals",
      "name": "Totales",
      "order": 4,
      "visible": true,
      "fields": [
        {
          "id": "separator3",
          "type": "line",
          "style": "solid",
          "marginTop": 5,
          "marginBottom": 5
        },
        {
          "id": "subtotal",
          "type": "text",
          "label": "Subtotal:",
          "source": "receipt.subtotal",
          "format": "currency",
          "fontSize": 10,
          "alignment": "right",
          "marginBottom": 3
        },
        {
          "id": "itbis",
          "type": "text",
          "label": "ITBIS (18%):",
          "source": "receipt.tax",
          "format": "currency",
          "fontSize": 10,
          "alignment": "right",
          "marginBottom": 5
        },
        {
          "id": "total",
          "type": "text",
          "label": "TOTAL:",
          "source": "receipt.total",
          "format": "currency",
          "fontSize": 14,
          "bold": true,
          "alignment": "right",
          "marginTop": 5,
          "marginBottom": 5
        },
        {
          "id": "separator4",
          "type": "line",
          "style": "double",
          "marginBottom": 10
        }
      ]
    },
    {
      "id": "footer",
      "name": "Pie",
      "order": 5,
      "visible": true,
      "fields": [
        {
          "id": "paymentMethod",
          "type": "text",
          "label": "Método de pago:",
          "source": "receipt.paymentMethod",
          "fontSize": 10,
          "alignment": "left",
          "marginBottom": 10
        },
        {
          "id": "message",
          "type": "text",
          "text": "¡Gracias por su compra!",
          "fontSize": 12,
          "bold": true,
          "alignment": "center",
          "marginTop": 10,
          "marginBottom": 5
        },
        {
          "id": "website",
          "type": "text",
          "text": "www.miempresa.com",
          "fontSize": 9,
          "alignment": "center"
        }
      ]
    }
  ]
}',
        1,
        'Sistema'
    );

    PRINT 'Plantilla por defecto creada';
END
ELSE
BEGIN
    PRINT 'La tabla ReceiptTemplates ya existe';
END
GO
