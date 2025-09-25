import frappe

@frappe.whitelist()
def get_products():
    """Devuelve todos los productos de Item con categoría e imagen"""
    items = frappe.get_all(
        "Item",
        fields=["item_code", "item_name", "item_group", "image", "standard_rate"],
        filters={"disabled": 0},
        order_by="item_group asc, item_name asc"
    )
    return items
