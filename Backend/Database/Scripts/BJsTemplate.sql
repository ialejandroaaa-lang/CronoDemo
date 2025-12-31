-- Script para insertar plantilla estilo BJ's Wholesale Club
-- Muestra logo, formato denso y estilo características de club de precios

INSERT INTO ReceiptTemplates (Nombre, Descripcion, TipoRecibo, AnchoMM, ConfiguracionJSON, Activo, PorDefecto, Usuario)
VALUES (
    'Estilo BJ''s Wholesale',
    'Diseño inspirado en clubes de precios con logo grande y formato denso',
    'Venta',
    80,
    '{
  "width": 80,
  "sections": [
    {
      "id": "header",
      "name": "Encabezado BJ Style",
      "order": 1,
      "visible": true,
      "fields": [
        {
          "id": "logo",
          "type": "image",
          "source": "company.logo",
          "height": 80,
          "alignment": "center",
          "marginBottom": 10
        },
        {
          "id": "welcome",
          "type": "text",
          "text": "WELCOME TO",
          "fontSize": 12,
          "alignment": "center",
          "marginBottom": 2
        },
        {
          "id": "brand",
          "type": "text",
          "text": "BJ''s WHOLESALE CLUB, INC.",
          "fontSize": 14,
          "bold": true,
          "alignment": "center",
          "marginBottom": 5
        },
        {
          "id": "address",
          "type": "text",
          "source": "company.address",
          "fontSize": 10,
          "alignment": "center",
          "marginBottom": 2
        },
        {
          "id": "phone",
          "type": "text",
          "source": "company.phone",
          "fontSize": 10,
          "alignment": "center",
          "marginBottom": 10
        }
      ]
    },
    {
      "id": "info",
      "name": "Datos Transacción",
      "order": 2,
      "visible": true,
      "fields": [
        {
          "id": "separator1",
          "type": "line",
          "style": "dashed",
          "marginBottom": 5
        },
        {
          "id": "details_line1",
          "type": "text",
          "text": "TRX #     REG #     CSHR      DATE        TIME",
          "fontSize": 9,
          "bold": true,
          "alignment": "center",
          "marginBottom": 2
        },
        {
          "id": "details_values",
          "type": "text",
          "source": "receipt.number",
          "text": "0000      001       Juan      20/12/25    10:30",
          "fontSize": 9,
          "alignment": "center",
          "marginBottom": 5
        },
        {
          "id": "member_info",
          "type": "text",
          "label": "MEMBER #:",
          "source": "receipt.client",
          "fontSize": 10,
          "bold": true,
          "alignment": "left",
          "marginBottom": 5
        },
        {
          "id": "separator2",
          "type": "line",
          "style": "dashed",
          "marginBottom": 5
        }
      ]
    },
    {
      "id": "items",
      "name": "Items",
      "order": 3,
      "visible": true,
      "type": "table",
      "fields": [
      ],
      "columns": [
        {"field": "description", "label": "Description", "width": 55, "alignment": "left"},
        {"field": "qty", "label": "Qty", "width": 15, "alignment": "center"},
        {"field": "price", "label": "Net Price", "width": 30, "alignment": "right", "format": "currency"}
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
          "marginBottom": 5
        },
        {
          "id": "subtotal",
          "type": "text",
          "label": "SUBTOTAL",
          "source": "receipt.subtotal",
          "format": "currency",
          "fontSize": 11,
          "alignment": "right",
          "marginBottom": 2
        },
        {
          "id": "tax",
          "type": "text",
          "label": "TAX",
          "source": "receipt.tax",
          "format": "currency",
          "fontSize": 11,
          "alignment": "right",
          "marginBottom": 5
        },
        {
          "id": "total",
          "type": "text",
          "label": "TOTAL",
          "source": "receipt.total",
          "format": "currency",
          "fontSize": 16,
          "bold": true,
          "alignment": "right",
          "marginBottom": 10
        },
        {
          "id": "items_count",
          "type": "text",
          "text": "TOTAL NUMBER OF ITEMS SOLD: 3",
          "fontSize": 10,
          "bold": true,
          "alignment": "center",
          "marginBottom": 10
        }
      ]
    },
    {
      "id": "footer",
      "name": "Pie BJ",
      "order": 5,
      "visible": true,
      "fields": [
        {
          "id": "pay_info",
          "type": "text",
          "label": "TENDER:",
          "source": "receipt.paymentMethod",
          "fontSize": 10,
          "bold": true,
          "alignment": "left",
          "marginBottom": 5
        },
        {
          "id": "change",
          "type": "text",
          "label": "CHANGE DUE:",
          "text": "$0.00",
          "fontSize": 10,
          "alignment": "left",
          "marginBottom": 15
        },
        {
          "id": "message",
          "type": "text",
          "text": "THANK YOU FOR SHOPPING BJ''s",
          "fontSize": 12,
          "bold": true,
          "alignment": "center",
          "marginBottom": 5
        },
        {
          "id": "website",
          "type": "text",
          "text": "www.bjs.com",
          "fontSize": 10,
          "alignment": "center",
          "marginBottom": 10
        },
        {
          "id": "barcode",
          "type": "text",
          "text": "|| |||| ||||| |||| |||| |||",
          "fontSize": 20,
          "alignment": "center",
          "marginBottom": 5
        }
      ]
    }
  ]
}',
    1,
    0,
    'Sistema'
);
GO
