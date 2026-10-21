from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query, Request, Response
from starlette.middleware.base import RequestResponseEndpoint
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field

from src.app.catalog import Category, Product, find_product, search_products


APP_DIR = Path(__file__).parent
STATIC_DIR = APP_DIR / "static"
TEMPLATES = Jinja2Templates(directory=APP_DIR / "templates")

app = FastAPI(title="Morrow Supply Demo", version="0.2.0")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

SECURITY_HEADERS = {
    "Content-Security-Policy": (
        "default-src 'self'; style-src 'self'; script-src 'self'; "
        "img-src 'self' data:; connect-src 'self'; object-src 'none'; "
        "base-uri 'self'; frame-ancestors 'none'"
    ),
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
}


@app.middleware("http")
async def add_security_headers(
    request: Request, call_next: RequestResponseEndpoint
) -> Response:
    response = await call_next(request)
    response.headers.update(SECURITY_HEADERS)
    return response


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500, strip_whitespace=True)


class ProductList(BaseModel):
    products: list[Product]


class ChatResponse(BaseModel):
    reply: str


@app.get("/", include_in_schema=False)
async def home(request: Request):
    return TEMPLATES.TemplateResponse(request=request, name="index.html", context={"active_page": "home"})


@app.get("/shop", include_in_schema=False)
async def shop(request: Request):
    return TEMPLATES.TemplateResponse(request=request, name="shop.html", context={"active_page": "shop"})


@app.get("/product/{product_id}", include_in_schema=False)
async def product_detail(request: Request, product_id: str):
    product = find_product(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return TEMPLATES.TemplateResponse(
        request=request,
        name="product.html",
        context={"active_page": "shop", "product": product},
    )


@app.get("/bag", include_in_schema=False)
async def bag(request: Request):
    return TEMPLATES.TemplateResponse(request=request, name="bag.html", context={"active_page": "bag"})


@app.get("/checkout", include_in_schema=False)
async def checkout(request: Request):
    return TEMPLATES.TemplateResponse(
        request=request,
        name="checkout.html",
        context={"active_page": "bag"},
    )


@app.get("/approach", include_in_schema=False)
async def approach(request: Request):
    return TEMPLATES.TemplateResponse(
        request=request,
        name="approach.html",
        context={"active_page": "approach"},
    )


@app.get("/contact", include_in_schema=False)
async def contact(request: Request):
    return TEMPLATES.TemplateResponse(
        request=request,
        name="contact.html",
        context={"active_page": "contact"},
    )


@app.get("/privacy", include_in_schema=False)
async def privacy(request: Request):
    return TEMPLATES.TemplateResponse(
        request=request,
        name="privacy.html",
        context={"active_page": "privacy"},
    )


@app.get("/api/products", response_model=ProductList)
async def list_products(
    q: Annotated[str, Query(max_length=100)] = "",
    category: Category | None = None,
):
    return {"products": search_products(q, category)}


@app.get("/api/products/{product_id}", response_model=Product)
async def get_product(product_id: str) -> Product:
    product = find_product(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.post("/api/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    # Placeholder only. A future agent must treat product text and model output as untrusted.
    return ChatResponse(
        reply="The shop guide is still being built. For now, try the search and category filters above."
    )
