import frappe
from frappe import _

@frappe.whitelist()
def get_products():
    """Devuelve todos los productos de Item"""
    items = frappe.get_all(
        "Item",
        fields=["item_code", "item_name", "standard_rate"],
        filters={"disabled": 0},
        order_by="modified desc"
    )
    return items
