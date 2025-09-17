frappe.ui.form.on('Productos Johan', {
    refresh(frm) {
        // Añadir botón
        frm.add_custom_button(__('Generar Catálogo PDF'), function () {
            if (!frm.doc.productos) {
                frappe.msgprint(__('Por favor sube un archivo Excel en el campo “Productos” primero.'));
                return;
            }
            // Llamar al método del servidor
            frappe.call({
                method: 'cybersys.api.generar_catalogo.generar_catalogo_pdf',
                args: {
                    docname: frm.doc.name
                },
                freeze: true,
                freeze_message: __('Generando PDF...'),
                callback: function (r) {
                    if (r && r.message && r.message.pdf_file) {
                        // Abrir el PDF en ventana nueva
                        const download_url = r.message.pdf_file;
                        window.open(download_url);
                    } else {
                        frappe.msgprint(__('Error al generar el PDF'));
                    }
                }
            });
        })
    }
});
