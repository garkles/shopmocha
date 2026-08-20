const express = require("express");

const router = express.Router();


// ==========================================
// PNP PARSE.BOT API
// ==========================================

const PNP_API_URL =
    "https://api.parse.bot/scraper/b87810bc-903f-41b8-b38d-c5c911cab324";

const PNP_API_KEY =
    process.env.PARSE_API_KEY;


// ==========================================
// CACHE
// ==========================================

const pnpCache =
    new Map();

const CACHE_DURATION =
    30 * 60 * 1000;

// ==========================================
// SEARCH PNP PRODUCTS
// ==========================================

router.get(
    "/search",
    async function (req, res) {

        const searchTerm =
            String(
                req.query.q || ""
            ).trim();


        // ==========================================
        // VALIDATE SEARCH
        // ==========================================

        if (!searchTerm) {

            return res.status(400).json({

                error:
                    "Please provide a search term."

            });

        }


        // ==========================================
        // CHECK API KEY
        // ==========================================

        if (!PNP_API_KEY) {

            console.error(
                "PnP Parse API key is missing."
            );

            return res.status(500).json({

                error:
                    "Parse API key is missing."

            });

        }


        // ==========================================
        // CACHE KEY
        // ==========================================

        const cacheKey =
            searchTerm
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();


        // ==========================================
        // CHECK CACHE
        // ==========================================

        const cached =
            pnpCache.get(
                cacheKey
            );


        if (cached) {

            const age =
                Date.now() -
                cached.timestamp;


            if (
                age <
                CACHE_DURATION
            ) {

                console.log(
                    `PnP cache HIT: "${cacheKey}"`
                );

                return res.json(
                    cached.data
                );

            }


            pnpCache.delete(
                cacheKey
            );

        }


        try {

            console.log(
                `PnP API request: "${searchTerm}"`
            );


            // ==========================================
            // BUILD GET URL
            // ==========================================

            const url =
                new URL(
                    `${PNP_API_URL}/search_products`
                );


            url.searchParams.set(
                "page",
                "0"
            );


            url.searchParams.set(
                "sort",
                "relevance"
            );


            url.searchParams.set(
                "query",
                searchTerm
            );


            url.searchParams.set(
                "page_size",
                "20"
            );


            console.log(
                `PnP Parse URL: ${url.toString()}`
            );


            // ==========================================
            // CALL PARSE.BOT
            // ==========================================

            const response =
                await fetch(
                    url.toString(),
                    {

                        method:
                            "GET",

                        headers: {

                            "X-API-Key":
                                PNP_API_KEY,

                            "Accept":
                                "application/json"

                        }

                    }
                );


            // ==========================================
            // READ RESPONSE
            // ==========================================

            const data =
                await response.json();


            // ==========================================
            // HANDLE API ERROR
            // ==========================================

            if (!response.ok) {

                console.error(
                    "PnP API error:",
                    response.status,
                    data
                );


                return res.status(
                    response.status
                ).json(data);

            }


            // ==========================================
            // EXTRACT PRODUCTS
            // ==========================================

            const rawProducts =
                extractProducts(
                    data
                );


            console.log(
                `PnP raw products found: ${rawProducts.length}`
            );


            // ==========================================
            // NORMALISE PRODUCTS
            // ==========================================

            const products =
                rawProducts.map(
                    function (product) {

                        const price =
                            getProductPrice(
                                product
                            );


                        return {

                            ...product,


                            // ==================================
                            // STANDARD ID
                            // ==================================

                            id:
                                product.id ||
                                product.productId ||
                                product.product_id ||
                                product.code ||
                                product.productCode ||
                                "",


                            // ==================================
                            // STANDARD NAME
                            // ==================================

                            name:
                                product.name ||
                                product.title ||
                                product.productName ||
                                "",


                            // ==================================
                            // PRICE
                            // ==================================

                            price:
                                price,


                            formattedPrice:
                                price !== null
                                    ? `R${price.toFixed(2)}`
                                    : product.formattedPrice ||
                                      null,


                            // ==================================
                            // CURRENCY
                            // ==================================

                            currency:
                                product.currency ||
                                product.currencyIso ||
                                "ZAR",


                            // ==================================
                            // IMAGE
                            // ==================================

                            image:
                                product.image ||
                                product.image_url ||
                                product.imageUrl ||
                                "",


                            // ==================================
                            // AVAILABILITY
                            // ==================================

                            available:
                                product.available !== false,


                            // ==================================
                            // STOCK
                            // ==================================

                            stockStatus:
                                product.stockStatus ||
                                product.stockLevelStatus ||
                                "",


                            // ==================================
                            // CATEGORIES
                            // ==================================

                            categories:
                                Array.isArray(
                                    product.categories
                                )
                                    ? product.categories
                                    : [],


                            // ==================================
                            // STORE
                            // ==================================

                            store:
                                "Pick n Pay"

                        };

                    }
                );


            // ==========================================
            // BUILD RESPONSE
            // ==========================================

            const result = {

                store:
                    "Pick n Pay",

                query:
                    searchTerm,

                count:
                    products.length,

                products:
                    products

            };


            // ==========================================
            // CACHE RESULT
            // ==========================================

            pnpCache.set(
                cacheKey,
                {

                    timestamp:
                        Date.now(),

                    data:
                        result

                }
            );


            console.log(
                `PnP products cached: "${cacheKey}"`
            );


            // ==========================================
            // RETURN RESULT
            // ==========================================

            return res.json(
                result
            );

        }


        catch (error) {

            console.error(
                "PnP search error:",
                error
            );


            return res.status(500).json({

                error:
                    "Could not retrieve Pick n Pay products."

            });

        }

    }
);


// ==========================================
// EXTRACT PRODUCTS
// ==========================================

function extractProducts(data) {

    // ==========================================
    // RESPONSE IS DIRECT ARRAY
    // ==========================================

    if (
        Array.isArray(data)
    ) {

        return data;

    }


    // ==========================================
    // data.products
    // ==========================================

    if (
        data &&
        Array.isArray(
            data.products
        )
    ) {

        return data.products;

    }


    // ==========================================
    // data.data.products
    // ==========================================

    if (
        data &&
        data.data &&
        Array.isArray(
            data.data.products
        )
    ) {

        return data.data.products;

    }


    // ==========================================
    // data.results
    // ==========================================

    if (
        data &&
        Array.isArray(
            data.results
        )
    ) {

        return data.results;

    }


    // ==========================================
    // data.data.results
    // ==========================================

    if (
        data &&
        data.data &&
        Array.isArray(
            data.data.results
        )
    ) {

        return data.data.results;

    }


    return [];

}


// ==========================================
// GET PRODUCT PRICE
// ==========================================

function getProductPrice(product) {

    // ==========================================
    // DIRECT NUMBER
    // ==========================================

    if (
        typeof product.price === "number" &&
        Number.isFinite(product.price)
    ) {

        return product.price;

    }


    // ==========================================
    // DIRECT STRING
    // ==========================================

    if (
        typeof product.price === "string"
    ) {

        const cleaned =
            product.price
                .replace(/[^0-9.]/g, "");


        const parsed =
            Number(cleaned);


        if (
            Number.isFinite(parsed)
        ) {

            return parsed;

        }

    }


    // ==========================================
    // FORMATTED PRICE
    // ==========================================

    if (
        typeof product.formattedPrice === "string"
    ) {

        const cleaned =
            product.formattedPrice
                .replace(/[^0-9.]/g, "");


        const parsed =
            Number(cleaned);


        if (
            Number.isFinite(parsed)
        ) {

            return parsed;

        }

    }


    // ==========================================
    // PRICE VALUE
    // ==========================================

    if (
        product.price &&
        typeof product.price.value === "number"
    ) {

        return product.price.value;

    }


    // ==========================================
    // PRICE AMOUNT
    // ==========================================

    if (
        product.price &&
        typeof product.price.amount === "number"
    ) {

        return product.price.amount;

    }


    // ==========================================
    // PRICE DATA VALUE
    // ==========================================

    if (
        product.priceData &&
        typeof product.priceData.value === "number"
    ) {

        return product.priceData.value;

    }


    // ==========================================
    // PRICE DATA AMOUNT
    // ==========================================

    if (
        product.priceData &&
        typeof product.priceData.amount === "number"
    ) {

        return product.priceData.amount;

    }


    // ==========================================
    // SALE PRICE
    // ==========================================

    if (
        typeof product.salePrice === "number"
    ) {

        return product.salePrice;

    }


    // ==========================================
    // CURRENT PRICE
    // ==========================================

    if (
        typeof product.currentPrice === "number"
    ) {

        return product.currentPrice;

    }


    return null;

}


// ==========================================
// CLEAR PNP CACHE
// ==========================================

router.get(
    "/clear-cache",
    function (req, res) {

        pnpCache.clear();


        return res.json({

            message:
                "PnP cache cleared."

        });

    }
);


// ==========================================
// EXPORT
// ==========================================

module.exports =
    router;