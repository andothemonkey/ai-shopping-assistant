"""Synthetic product catalog and read-only search operations."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


Category = Literal["Carry", "Kitchen", "Workspace"]


class Product(BaseModel):
    """A catalog item exposed by the local demo API."""

    model_config = ConfigDict(frozen=True)

    id: str = Field(pattern=r"^p-\d{3}$")
    name: str = Field(min_length=1, max_length=100)
    category: Category
    price: float = Field(gt=0, max_digits=7, decimal_places=2)
    description: str = Field(min_length=1, max_length=500)
    tags: tuple[str, ...]


PRODUCTS: tuple[Product, ...] = (
    Product(
        id="p-100",
        name="Canvas Day Pack",
        category="Carry",
        price=54.00,
        description="An 18 L recycled-fabric pack with a padded laptop sleeve and a pocket for your bottle.",
        tags=("backpack", "hiking", "everyday"),
    ),
    Product(
        id="p-101",
        name="Everyday Travel Mug",
        category="Kitchen",
        price=24.50,
        description="A double-wall stainless steel mug with a snug lid for the morning commute.",
        tags=("coffee", "mug", "travel"),
    ),
    Product(
        id="p-102",
        name="Angle Desk Lamp",
        category="Workspace",
        price=38.00,
        description="A small adjustable LED lamp with three brightness settings and a weighted base.",
        tags=("lighting", "desk", "office"),
    ),
)

PRODUCTS_BY_ID = {product.id: product for product in PRODUCTS}


def find_product(product_id: str) -> Product | None:
    """Return a synthetic product by its stable identifier."""
    return PRODUCTS_BY_ID.get(product_id)


def search_products(query: str = "", category: Category | None = None) -> list[Product]:
    """Match a query against the local catalog's user-facing text."""
    normalized_query = query.strip().casefold()
    matches = []
    for product in PRODUCTS:
        if category is not None and product.category != category:
            continue
        searchable_text = " ".join(
            (product.name, product.category, product.description, *product.tags)
        ).casefold()
        if not normalized_query or normalized_query in searchable_text:
            matches.append(product)
    return matches
