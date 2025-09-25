import frappe

@frappe.whitelist()
def get_products():
    """
    Devuelve todos los productos de ERPNext con los campos principales
    """
    products = frappe.get_all(
        "Item",
        fields=["name", "item_name", "item_group", "standard_rate", "description", "stock_uom", "image"],
        filters={"disabled": 0},  # solo productos habilitados
        order_by="item_name asc"
    )
    return products
