const express = require("express");

const router = express.Router();


// ======================================================
// STORE SEARCH FUNCTIONS
// ======================================================

async function searchStore(store, searchTerm) {

    let url = "";

    if (store === "pnp") {

        url =
            `http://localhost:3000/api/pnp/search?q=${encodeURIComponent(searchTerm)}`;

    }

    else if (store === "woolworths") {

        url =
            `http://localhost:3000/api/woolworths/search?q=${encodeURIComponent(searchTerm)}`;

    }

    else if (store === "checkers") {

        url =
            `http://localhost:3000/api/checkers/search?q=${encodeURIComponent(searchTerm)}`;

    }

    else {

        return [];

    }


    try {

        const response =
            await fetch(url);


        if (!response.ok) {

            console.error(
                `${store} search failed: ${response.status}`
            );

            return [];

        }


        const data =
            await response.json();


        return extractProducts(data);

    }

    catch (error) {

        console.error(
            `${store} search error:`,
            error.message
        );

        return [];

    }

}


// ======================================================
// EXTRACT PRODUCTS
// ======================================================

function extractProducts(data) {

    if (Array.isArray(data)) {

        return data;

    }


    if (
        data &&
        Array.isArray(data.products)
    ) {

        return data.products;

    }


    if (
        data &&
        data.data &&
        Array.isArray(data.data.products)
    ) {

        return data.data.products;

    }


    if (
        data &&
        Array.isArray(data.results)
    ) {

        return data.results;

    }


    if (
        data &&
        data.data &&
        Array.isArray(data.data.results)
    ) {

        return data.data.results;

    }


    return [];

}


// ======================================================
// CONVERT VALUE TO NUMBER
// ======================================================

function numberFromValue(value) {

    if (typeof value === "number") {

        if (Number.isFinite(value)) {

            return value;

        }

        return null;

    }


    if (typeof value === "string") {

        const cleaned =
            value
                .replace(/R/gi, "")
                .replace(/,/g, "")
                .trim();


        const match =
            cleaned.match(
                /\d+(?:\.\d+)/
            );


        if (match) {

            const number =
                Number(match[0]);


            if (Number.isFinite(number)) {

                return number;

            }

        }

    }


    return null;

}


// ======================================================
// GET PRODUCT PRICE
// ======================================================

function getPrice(product) {

    if (!product) {

        return null;

    }


    // --------------------------------------------------
    // DIRECT PRICE
    // --------------------------------------------------

    let price =
        numberFromValue(
            product.price
        );


    if (price !== null) {

        return price;

    }


    // --------------------------------------------------
    // FORMATTED PRICE
    // --------------------------------------------------

    price =
        numberFromValue(
            product.formattedPrice
        );


    if (price !== null) {

        return price;

    }


    // --------------------------------------------------
    // SALE PRICE
    // --------------------------------------------------

    price =
        numberFromValue(
            product.salePrice
        );


    if (price !== null) {

        return price;

    }


    // --------------------------------------------------
    // CURRENT PRICE
    // --------------------------------------------------

    price =
        numberFromValue(
            product.currentPrice
        );


    if (price !== null) {

        return price;

    }


    // --------------------------------------------------
    // UNIT PRICE
    // --------------------------------------------------

    price =
        numberFromValue(
            product.unitPrice
        );


    if (price !== null) {

        return price;

    }


    // --------------------------------------------------
    // NESTED PRICE OBJECT
    // --------------------------------------------------

    if (
        product.price &&
        typeof product.price === "object"
    ) {

        price =
            numberFromValue(
                product.price.value
            );


        if (price !== null) {

            return price;

        }


        price =
            numberFromValue(
                product.price.amount
            );


        if (price !== null) {

            return price;

        }


        price =
            numberFromValue(
                product.price.current
            );


        if (price !== null) {

            return price;

        }


        price =
            numberFromValue(
                product.price.currentPrice
            );


        if (price !== null) {

            return price;

        }

    }


    // --------------------------------------------------
    // PRICE DATA
    // --------------------------------------------------

    if (
        product.priceData &&
        typeof product.priceData === "object"
    ) {

        price =
            numberFromValue(
                product.priceData.value
            );


        if (price !== null) {

            return price;

        }


        price =
            numberFromValue(
                product.priceData.amount
            );


        if (price !== null) {

            return price;

        }


        price =
            numberFromValue(
                product.priceData.current
            );


        if (price !== null) {

            return price;

        }

    }


    // --------------------------------------------------
    // OTHER COMMON PRICE FIELDS
    // --------------------------------------------------

    const possibleFields = [

        "sellingPrice",
        "finalPrice",
        "displayPrice",
        "regularPrice",
        "originalPrice",
        "productPrice",
        "amount"

    ];


    for (
        const field of possibleFields
    ) {

        price =
            numberFromValue(
                product[field]
            );


        if (price !== null) {

            return price;

        }

    }


    return null;

}


// ======================================================
// GET PRODUCT ID
// ======================================================

function getProductId(product) {

    return (

        product.id ||

        product.code ||

        product.productId ||

        product.product_id ||

        product.productCode ||

        product.sku ||

        ""

    );

}


// ======================================================
// GET PRODUCT NAME
// ======================================================

function getName(product) {

    return (

        product.name ||

        product.title ||

        product.productName ||

        product.description ||

        ""

    );

}


//======================================================
 // GET PRODUCT IMAGE
// ======================================================

function getProductImage(product) {

    // --------------------------------------------------
    // STANDARD IMAGE FIELDS
    // --------------------------------------------------

    if (product.image) {

        return product.image;

    }


    if (product.image_url) {

        return product.image_url;

    }


    if (product.imageUrl) {

        return product.imageUrl;

    }


    // --------------------------------------------------
    // PNP IMAGE ARRAY
    // --------------------------------------------------

    if (
        Array.isArray(product.images) &&
        product.images.length > 0
    ) {

        // Prefer PnP's "product" image
        const productImage =
            product.images.find(
                image =>
                    image &&
                    image.format === "product" &&
                    image.url
            );


        if (productImage) {

            return productImage.url;

        }


        // Otherwise prefer listing image
        const listingImage =
            product.images.find(
                image =>
                    image &&
                    image.format === "listing" &&
                    image.url
            );


        if (listingImage) {

            return listingImage.url;

        }


        // Otherwise use first available image
        const firstImage =
            product.images.find(
                image =>
                    image &&
                    image.url
            );


        if (firstImage) {

            return firstImage.url;

        }

    }


    return "";

}


// ======================================================
// GET PRODUCT CATEGORIES
// ======================================================

function getCategories(product) {

    // Existing normalized categories
    if (
        Array.isArray(product.categories) &&
        product.categories.length > 0
    ) {

        return product.categories;

    }


    // PnP categoryNames
    if (
        Array.isArray(product.categoryNames)
    ) {

        return product.categoryNames;

    }


    return [];

}


// ======================================================
// GET STOCK STATUS
// ======================================================

function getStockStatus(product) {

    // Standard field
    if (product.stockStatus) {

        return product.stockStatus;

    }


    // Alternative field
    if (product.stockLevelStatus) {

        return product.stockLevelStatus;

    }


    // PnP nested stock object
    if (
        product.stock &&
        product.stock.stockLevelStatus
    ) {

        return product.stock.stockLevelStatus;

    }


    return "";

}


// ======================================================
// GET AVAILABILITY
// ======================================================

function getAvailability(product) {

    // PnP uses inStockIndicator
    if (
        typeof product.inStockIndicator === "boolean"
    ) {

        return product.inStockIndicator;

    }


    // Standard available field
    if (
        typeof product.available === "boolean"
    ) {

        return product.available;

    }


    return true;

}


// ======================================================
// EXTRACT SIZE
// ======================================================

function extractSize(name) {

    const text =
        String(name || "")
            .toLowerCase()
            .trim();


    // ==================================================
    // MULTIPACK
    //
    // Examples:
    //
    // 6 x 1L
    // 6x1L
    // 12 x 500ml
    // 6 x 500 g
    // ==================================================

    const multipackMatch =
        text.match(
            /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(ml|l|g|kg)\b/i
        );


    if (multipackMatch) {

        const quantity =
            Number(
                multipackMatch[1]
            );


        const amount =
            Number(
                multipackMatch[2]
            );


        const unit =
            multipackMatch[3]
                .toLowerCase();


        const converted =
            convertToBaseUnit(
                amount,
                unit
            );


        if (converted) {

            return {

                original:
                    `${quantity} x ${amount}${unit}`,

                value:
                    amount,

                unit:
                    unit,

                totalQuantity:
                    quantity *
                    converted.value,

                baseUnit:
                    converted.unit

            };

        }

    }


    // ==================================================
    // SINGLE SIZE
    //
    // Examples:
    //
    // 1L
    // 2 L
    // 500ml
    // 750g
    // ==================================================

    const singleMatch =
        text.match(
            /(\d+(?:\.\d+)?)\s*(ml|l|g|kg)\b/i
        );


    if (singleMatch) {

        const amount =
            Number(
                singleMatch[1]
            );


        const unit =
            singleMatch[2]
                .toLowerCase();


        const converted =
            convertToBaseUnit(
                amount,
                unit
            );


        if (converted) {

            return {

                original:
                    `${amount}${unit}`,

                value:
                    amount,

                unit:
                    unit,

                totalQuantity:
                    converted.value,

                baseUnit:
                    converted.unit

            };

        }

    }


    return {

        original:
            null,

        value:
            null,

        unit:
            null,

        totalQuantity:
            null,

        baseUnit:
            null

    };

}


// ======================================================
// CONVERT TO BASE UNIT
// ======================================================

function convertToBaseUnit(
    amount,
    unit
) {

    switch (unit) {

        case "ml":

            return {

                value:
                    amount,

                unit:
                    "ml"

            };


        case "l":

            return {

                value:
                    amount,

                unit:
                    "L"

            };


        case "g":

            return {

                value:
                    amount,

                unit:
                    "g"

            };


        case "kg":

            return {

                value:
                    amount,

                unit:
                    "kg"

            };


        default:

            return null;

    }

}


// ======================================================
// CALCULATE PRICE PER UNIT
// ======================================================

function calculateUnitPrice(
    price,
    sizeInfo
) {

    if (
        price === null ||
        price <= 0
    ) {

        return null;

    }


    if (
        sizeInfo.totalQuantity === null ||
        !sizeInfo.baseUnit
    ) {

        return null;

    }


    let quantity =
        sizeInfo.totalQuantity;


    let label =
        sizeInfo.baseUnit;


    // --------------------------------------------------
    // ML -> LITRES
    // --------------------------------------------------

    if (
        sizeInfo.baseUnit === "ml"
    ) {

        quantity =
            quantity / 1000;

        label =
            "L";

    }


    // --------------------------------------------------
    // LITRES
    // --------------------------------------------------

    if (
        sizeInfo.baseUnit === "L"
    ) {

        label =
            "L";

    }


    // --------------------------------------------------
    // GRAMS -> KG
    // --------------------------------------------------

    if (
        sizeInfo.baseUnit === "g"
    ) {

        quantity =
            quantity / 1000;

        label =
            "kg";

    }


    // --------------------------------------------------
    // KG
    // --------------------------------------------------

    if (
        sizeInfo.baseUnit === "kg"
    ) {

        label =
            "kg";

    }


    if (
        quantity <= 0
    ) {

        return null;

    }


    const unitPrice =
        price / quantity;


    return {

        value:
            Number(
                unitPrice.toFixed(2)
            ),

        formatted:
            `R${unitPrice.toFixed(2)}/${label}`,

        label:
            label

    };

}


// ======================================================
// NORMALISE PRODUCT
// ======================================================

function normaliseProduct(
    product,
    store
) {

    const price =
        getPrice(product);


    const name =
        getName(product);


    const sizeInfo =
        extractSize(name);


    const unitPrice =
        calculateUnitPrice(
            price,
            sizeInfo
        );


    return {

        // ------------------------------------------------
        // ID
        // ------------------------------------------------

        id:
            getProductId(product),


        // ------------------------------------------------
        // BASIC PRODUCT INFORMATION
        // ------------------------------------------------

        name:
            name,


        price:
            price,


        formattedPrice:
            price !== null
                ? `R${price.toFixed(2)}`
                : null,


        currency:
            product.currency ||
            product.currencyIso ||
            "ZAR",


        // ------------------------------------------------
        // IMAGE
        // ------------------------------------------------

        image:
            getProductImage(product),


        // ------------------------------------------------
        // AVAILABILITY
        // ------------------------------------------------

        available:
            getAvailability(product),


        // ------------------------------------------------
        // STOCK
        // ------------------------------------------------

        stockStatus:
            getStockStatus(product),


        // ------------------------------------------------
        // CATEGORIES
        // ------------------------------------------------

        categories:
            getCategories(product),


        // ------------------------------------------------
        // STORE
        // ------------------------------------------------

        store:
            store,


        // ------------------------------------------------
        // SIZE
        // ------------------------------------------------

        size:
            sizeInfo.original,


        sizeValue:
            sizeInfo.value,


        sizeUnit:
            sizeInfo.unit,


        totalQuantity:
            sizeInfo.totalQuantity,


        // ------------------------------------------------
        // PRICE PER UNIT
        // ------------------------------------------------

        pricePerUnit:
            unitPrice
                ? unitPrice.formatted
                : null,


        pricePerUnitValue:
            unitPrice
                ? unitPrice.value
                : null,


        pricePerUnitLabel:
            unitPrice
                ? unitPrice.label
                : null

    };

}


// ======================================================
// COMBINED PRODUCT SEARCH
// ======================================================

router.get(
    "/search",
    async function(req, res) {

        const searchTerm =
            String(
                req.query.q || ""
            ).trim();


        if (!searchTerm) {

            return res.status(400).json({

                error:
                    "Please provide a search term."

            });

        }


        console.log(
            `Combined product search: "${searchTerm}"`
        );


        // ==================================================
        // SEARCH ALL STORES
        // ==================================================

        const [
            pnpProducts,
            woolworthsProducts,
            checkersProducts
        ] =
            await Promise.all([

                searchStore(
                    "pnp",
                    searchTerm
                ),

                searchStore(
                    "woolworths",
                    searchTerm
                ),

                searchStore(
                    "checkers",
                    searchTerm
                )

            ]);


        // ==================================================
        // NORMALISE PNP
        // ==================================================

        const pnp =
            pnpProducts.map(
                product =>
                    normaliseProduct(
                        product,
                        "Pick n Pay"
                    )
            );


        // ==================================================
        // NORMALISE WOOLWORTHS
        // ==================================================

        const woolworths =
            woolworthsProducts.map(
                product =>
                    normaliseProduct(
                        product,
                        "Woolworths"
                    )
            );


        // ==================================================
        // NORMALISE CHECKERS
        // ==================================================

        const checkers =
            checkersProducts.map(
                product =>
                    normaliseProduct(
                        product,
                        "Checkers"
                    )
            );


        // ==================================================
        // COMBINE ALL PRODUCTS
        // ==================================================

        const products = [

            ...pnp,
            ...woolworths,
            ...checkers

        ];


        // ==================================================
        // PRODUCTS WITH VALID PRICES
        // ==================================================

        const productsWithPrices =
            products.filter(
                product =>
                    product.price !== null &&
                    product.price > 0
            );


        // ==================================================
        // CHEAPEST PRODUCT
        // ==================================================

        let cheapest = null;


        if (
            productsWithPrices.length > 0
        ) {

            cheapest =
                productsWithPrices.reduce(
                    function(current, product) {

                        return product.price <
                            current.price
                            ? product
                            : current;

                    }
                );

        }


        // ==================================================
        // PRODUCTS WITH VALID UNIT PRICES
        // ==================================================

        const productsWithUnitPrices =
            products.filter(
                product =>
                    product.pricePerUnitValue !== null &&
                    product.pricePerUnitValue > 0
            );


        // ==================================================
        // CHEAPEST PER UNIT
        // ==================================================

        let cheapestPerUnit = null;


        if (
            productsWithUnitPrices.length > 0
        ) {

            cheapestPerUnit =
                productsWithUnitPrices.reduce(
                    function(current, product) {

                        return product.pricePerUnitValue <
                            current.pricePerUnitValue
                            ? product
                            : current;

                    }
                );

        }


        // ==================================================
        // STORE SUMMARY
        // ==================================================

        const storeSummary = {

            "Pick n Pay":
                pnp.length,

            "Woolworths":
                woolworths.length,

            "Checkers":
                checkers.length

        };


        // ==================================================
        // DEBUG INFORMATION
        // ==================================================

        console.log(
            `PnP products: ${pnp.length}`
        );

        console.log(
            `PnP products with prices: ${
                pnp.filter(
                    product =>
                        product.price !== null
                ).length
            }`
        );

        console.log(
            `Woolworths products: ${woolworths.length}`
        );

        console.log(
            `Checkers products: ${checkers.length}`
        );

        if (cheapest) {

            console.log(
                `Cheapest product: ${cheapest.name} - ${cheapest.formattedPrice} (${cheapest.store})`
            );

        }

        if (cheapestPerUnit) {

            console.log(
                `Cheapest per unit: ${cheapestPerUnit.name} - ${cheapestPerUnit.pricePerUnit} (${cheapestPerUnit.store})`
            );

        }


        // ==================================================
        // RESPONSE
        // ==================================================

        return res.json({

            query:
                searchTerm,

            count:
                products.length,

            stores:
                storeSummary,

            cheapest:
                cheapest,

            cheapestPerUnit:
                cheapestPerUnit,

            products:
                products

        });

    }

);


// ======================================================
// EXPORT
// ======================================================

module.exports =
    router;