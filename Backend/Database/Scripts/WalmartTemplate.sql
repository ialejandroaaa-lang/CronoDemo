-- Script para insertar plantilla estilo Walmart
-- Estilo característico con slogan "Save Money. Live Better." y códigos TC

INSERT INTO ReceiptTemplates (Nombre, Descripcion, TipoRecibo, AnchoMM, ConfiguracionJSON, Activo, PorDefecto, Usuario)
VALUES (
    'Estilo Walmart',
    'Diseño inspirado en Walmart con códigos TC y slogan característico',
    'Venta',
    80,
    '{
  "width": 80,
  "sections": [
    {
      "id": "header",
      "name": "Encabezado Walmart",
      "order": 1,
      "visible": true,
      "fields": [
        {
          "id": "logo",
          "type": "image",
          "source": "company.logo",
          "height": 60,
          "alignment": "center",
          "marginBottom": 5
        },
        {
          "id": "store_info",
          "type": "text",
          "text": "Walmart",
          "fontSize": 18,
          "bold": true,
          "alignment": "center",
          "marginBottom": 2
        },
        {
          "id": "slogan",
          "type": "text",
          "text": "Save Money. Live Better.",
          "fontSize": 12,
          "bold": true,
          "alignment": "center",
          "marginBottom": 8
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
          "id": "manager",
          "type": "text",
          "text": "MANAGER: GABRIEL",
          "fontSize": 10,
          "alignment": "center",
          "marginBottom": 8
        },
        {
          "id": "contact",
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
      "name": "Datos TRX",
      "order": 2,
      "visible": true,
      "fields": [
        {
          "id": "codes_line",
          "type": "text",
          "text": "ST# 02058  OP# 000090  TE# 40  TR# 08665",
          "fontSize": 9,
          "alignment": "center",
          "marginBottom": 8
        }
      ]
    },
    {
      "id": "items",
      "name": "Items",
      "order": 3,
      "visible": true,
      "type": "table",
      "fields": [],
      "columns": [
        {"field": "description", "label": "Description", "width": 55, "alignment": "left"},
        {"field": "qty", "label": "", "width": 15, "alignment": "center"},
        {"field": "price", "label": "Price", "width": 30, "alignment": "right", "format": "currency"}
      ]
    },
    {
      "id": "totals",
      "name": "Totales",
      "order": 4,
      "visible": true,
      "fields": [
        {
          "id": "separator1",
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
          "label": "TAX 1  18.000 %",
          "source": "receipt.tax",
          "format": "currency",
          "fontSize": 11,
          "alignment": "right",
          "marginBottom": 8
        },
        {
          "id": "total",
          "type": "text",
          "label": "TOTAL",
          "source": "receipt.total",
          "format": "currency",
          "fontSize": 18,
          "bold": true,
          "alignment": "right",
          "marginBottom": 10
        }
      ]
    },
    {
      "id": "footer",
      "name": "Pie Walmart",
      "order": 5,
      "visible": true,
      "fields": [
        {
          "id": "payment",
          "type": "text",
          "label": "WALMART CREDIT",
          "source": "receipt.total",
          "format": "currency",
          "fontSize": 10,
          "alignment": "right",
          "marginBottom": 2
        },
        {
          "id": "tender",
          "type": "text",
          "label": "TENDER",
          "source": "receipt.total",
          "format": "currency",
          "fontSize": 10,
          "alignment": "right",
          "marginBottom": 5
        },
        {
          "id": "change",
          "type": "text",
          "label": "CHANGE DUE",
          "text": "0.00",
          "fontSize": 14,
          "bold": true,
          "alignment": "right",
          "marginBottom": 10
        },
         {
          "id": "items_sold",
          "type": "text",
          "text": "# ITEMS SOLD 3",
          "fontSize": 10,
          "alignment": "center",
          "marginBottom": 5
        },
        {
          "id": "tc_code",
          "type": "text",
          "text": "TC# 8556 4668 5445 6132 8665",
          "fontSize": 10,
          "alignment": "center",
          "marginBottom": 5
        },
        {
          "id": "barcode",
          "type": "text",
          "text": "|| ||||| |||| |||| || ||||",
          "fontSize": 24,
          "alignment": "center",
          "marginBottom": 8
        },
        {
          "id": "date_time",
          "type": "text",
          "source": "receipt.date",
          "text": "20/12/25  10:30 PM",
          "fontSize": 10,
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
GO
