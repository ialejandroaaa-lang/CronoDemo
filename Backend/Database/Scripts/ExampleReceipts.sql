-- Script para insertar recibos de ejemplo en ReceiptTemplates
-- Estos son ejemplos listos para usar

-- Recibo Moderno Minimalista
INSERT INTO ReceiptTemplates (Nombre, Descripcion, TipoRecibo, AnchoMM, ConfiguracionJSON, Activo, PorDefecto, Usuario)
VALUES (
    'Recibo Moderno Minimalista',
    'Diseño limpio y profesional con espaciado amplio',
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
          "id": "companyName_1",
          "type": "text",
          "source": "company.name",
          "fontSize": 18,
          "bold": true,
          "alignment": "center",
          "marginBottom": 8
        },
        {
          "id": "companyRNC_1",
          "type": "text",
          "source": "company.rnc",
          "label": "RNC:",
          "fontSize": 10,
          "alignment": "center",
          "marginBottom": 3
        },
        {
          "id": "companyAddress_1",
          "type": "text",
          "source": "company.address",
          "fontSize": 9,
          "alignment": "center",
          "marginBottom": 3
        },
        {
          "id": "companyPhone_1",
          "type": "text",
          "source": "company.phone",
          "label": "Tel:",
          "fontSize": 9,
          "alignment": "center",
          "marginBottom": 10
        },
        {
          "id": "separator1",
          "type": "line",
          "style": "solid",
          "marginBottom": 8
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
          "id": "receiptNumber_1",
          "type": "text",
          "label": "RECIBO #",
          "source": "receipt.number",
          "fontSize": 12,
          "bold": true,
          "alignment": "center",
          "marginBottom": 8
        },
        {
          "id": "date_1",
          "type": "text",
          "label": "Fecha:",
          "source": "receipt.date",
          "format": "date",
          "fontSize": 10,
          "alignment": "left",
          "marginBottom": 3
        },
        {
          "id": "time_1",
          "type": "text",
          "label": "Hora:",
          "source": "receipt.time",
          "format": "time",
          "fontSize": 10,
          "alignment": "left",
          "marginBottom": 3
        },
        {
          "id": "cashier_1",
          "type": "text",
          "label": "Cajero:",
          "source": "receipt.cashier",
          "fontSize": 10,
          "alignment": "left",
          "marginBottom": 3
        },
        {
          "id": "client_1",
          "type": "text",
          "label": "Cliente:",
          "source": "receipt.client",
          "fontSize": 10,
          "alignment": "left",
          "marginBottom": 8
        },
        {
          "id": "separator2",
          "type": "line",
          "style": "dashed",
          "marginBottom": 8
        }
      ]
    },
    {
      "id": "totals",
      "name": "Totales",
      "order": 3,
      "visible": true,
      "fields": [
        {
          "id": "subtotal_1",
          "type": "text",
          "label": "Subtotal:",
          "source": "receipt.subtotal",
          "format": "currency",
          "fontSize": 11,
          "alignment": "right",
          "marginBottom": 4
        },
        {
          "id": "itbis_1",
          "type": "text",
          "label": "ITBIS (18%):",
          "source": "receipt.tax",
          "format": "currency",
          "fontSize": 11,
          "alignment": "right",
          "marginBottom": 8
        },
        {
          "id": "separator3",
          "type": "line",
          "style": "solid",
          "marginBottom": 8
        },
        {
          "id": "total_1",
          "type": "text",
          "label": "TOTAL A PAGAR:",
          "source": "receipt.total",
          "format": "currency",
          "fontSize": 16,
          "bold": true,
          "alignment": "center",
          "marginBottom": 8
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
      "order": 4,
      "visible": true,
      "fields": [
        {
          "id": "paymentMethod_1",
          "type": "text",
          "label": "Pago:",
          "source": "receipt.paymentMethod",
          "fontSize": 10,
          "bold": true,
          "alignment": "left",
          "marginBottom": 15
        },
        {
          "id": "message1",
          "type": "text",
          "text": "¡GRACIAS POR SU COMPRA!",
          "fontSize": 14,
          "bold": true,
          "alignment": "center",
          "marginBottom": 5
        },
        {
          "id": "message2",
          "type": "text",
          "text": "Vuelva Pronto",
          "fontSize": 11,
          "alignment": "center",
          "marginBottom": 10
        }
      ]
    }
  ]
}',
    1,
    0,
    'Sistema'
);

-- Recibo Compacto (para ahorrar papel)
INSERT INTO ReceiptTemplates (Nombre, Descripcion, TipoRecibo, AnchoMM, ConfiguracionJSON, Activo, PorDefecto, Usuario)
VALUES (
    'Recibo Compacto',
    'Diseño condensado para ahorrar papel térmico',
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
          "id": "companyName_2",
          "type": "text",
          "source": "company.name",
          "fontSize": 14,
          "bold": true,
          "alignment": "center",
          "marginBottom": 2
        },
        {
          "id": "companyRNC_2",
          "type": "text",
          "source": "company.rnc",
          "label": "RNC:",
          "fontSize": 8,
          "alignment": "center",
          "marginBottom": 5
        },
        {
          "id": "separator1",
          "type": "line",
          "style": "solid",
          "marginBottom": 3
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
          "id": "receiptNumber_2",
          "type": "text",
          "label": "#",
          "source": "receipt.number",
          "fontSize": 9,
          "alignment": "left",
          "marginBottom": 2
        },
        {
          "id": "date_2",
          "type": "text",
          "source": "receipt.date",
          "format": "date",
          "fontSize": 9,
          "alignment": "left",
          "marginBottom": 2
        },
        {
          "id": "cashier_2",
          "type": "text",
          "label": "Caj:",
          "source": "receipt.cashier",
          "fontSize": 9,
          "alignment": "left",
          "marginBottom": 3
        },
        {
          "id": "separator2",
          "type": "line",
          "style": "dashed",
          "marginBottom": 3
        }
      ]
    },
    {
      "id": "totals",
      "name": "Totales",
      "order": 3,
      "visible": true,
      "fields": [
        {
          "id": "subtotal_2",
          "type": "text",
          "label": "Sub:",
          "source": "receipt.subtotal",
          "format": "currency",
          "fontSize": 9,
          "alignment": "right",
          "marginBottom": 2
        },
        {
          "id": "itbis_2",
          "type": "text",
          "label": "Tax:",
          "source": "receipt.tax",
          "format": "currency",
          "fontSize": 9,
          "alignment": "right",
          "marginBottom": 2
        },
        {
          "id": "total_2",
          "type": "text",
          "label": "TOTAL:",
          "source": "receipt.total",
          "format": "currency",
          "fontSize": 12,
          "bold": true,
          "alignment": "right",
          "marginBottom": 3
        },
        {
          "id": "separator3",
          "type": "line",
          "style": "solid",
          "marginBottom": 3
        }
      ]
    },
    {
      "id": "footer",
      "name": "Pie",
      "order": 4,
      "visible": true,
      "fields": [
        {
          "id": "message1",
          "type": "text",
          "text": "Gracias!",
          "fontSize": 10,
          "bold": true,
          "alignment": "center",
          "marginBottom": 3
        }
      ]
    }
  ]
}',
    1,
    0,
    'Sistema'
);

PRINT 'Recibos de ejemplo creados exitosamente';
GO
