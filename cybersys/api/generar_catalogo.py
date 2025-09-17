import frappe
import os
from frappe.utils.file_manager import save_file
from frappe.utils import get_site_path
from frappe import _

@frappe.whitelist()
def generar_catalogo_pdf(docname):
    """
    Genera un catálogo en PDF con los productos del Excel adjunto en el doc Productos Johan
    """
    doc = frappe.get_doc('Productos Johan', docname)
    # Verificamos que tenga archivo adjunto
    if not doc.productos:
        frappe.throw(_('No se encontró archivo Excel en el campo productos'))

    # Obtener el archivo adjunto
    # `productos` es el campo Attach, almacena file_url
    file_doc = frappe.get_doc('File', {'file_url': doc.productos})
    # Ruta física
    file_path = file_doc.get_full_path()
    # Leer Excel
    try:
        import openpyxl
    except ImportError:
        frappe.throw(_('Librería openpyxl no instalada'))

    wb = openpyxl.load_workbook(filename=file_path, data_only=True)
    ws = wb.active

    # Suponiendo que la primera fila es encabezado, y luego los datos
    rows = []
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            # Encabezados: validar que sean los esperados?
            headers = list(row)
            # opcional: verificar que headers == ['Imagen', 'Nombre', 'Stock', 'Marca', 'Precio']
            continue
        # Cada fila de datos
        imagen_url = row[0]
        nombre = row[1]
        stock = row[2]
        marca = row[3]
        precio = row[4]
        # Puedes hacer validaciones si quieres
        rows.append({
            'imagen': imagen_url,
            'nombre': nombre,
            'stock': stock,
            'marca': marca,
            'precio': precio
        })

    # Generar HTML (puedes usar jinja, frappe.render_template, etc.)
    html = frappe.render_template('templates/catalogo/productos_catalogo.html', {
        'rows': rows,
        'doc': doc
    })

    # Convertir HTML en PDF
    from frappe.utils.pdf import get_pdf

    pdf_data = get_pdf(html)
    # Guardar PDF como archivo en File doctype
    file_name = f"Catalogo_{docname}.pdf"
    saved_file = save_file(file_name, pdf_data, "Productos Johan", docname, folder='Home/Attachments', is_private=0)

    # Devolver la URL del archivo para que cliente lo abra
    return {
        'pdf_file': saved_file.file_url
    }
