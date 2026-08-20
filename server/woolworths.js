
// ==========================================
// SHOPMOCHA WOOLWORTHS API
// ==========================================

const express = require("express");

const router = express.Router();


// ==========================================
// WOOLWORTHS PARSE API
// ==========================================

const WOOLWORTHS_SEARCH_API_URL =
    "https://api.parse.bot/scraper/3c08f360-415f-4984-bcd1-846bc0d7dafc/search_products";

const WOOLWORTHS_DETAILS_API_URL =
    "https://api.parse.bot/scraper/3c08f360-415f-4984-bcd1-846bc0d7dafc/get_product_details";


// ==========================================
// CACHE
// ==========================================

const CACHE_DURATION =
    30 * 60 * 1000;


// ==========================================
// SEARCH CACHE
// ==========================================

const woolworthsSearchCache =
    new Map();


// ==========================================
// PRODUCT DETAILS CACHE
// ==========================================
//
// Stores the complete response from
// get_product_details.
//
// This includes:
// - images
// - brand
// - rating
// - description
// - ingredients
// - nutritional information
// - etc.
//
// ==========================================

const woolworthsProductCache =
    new Map();


// ==========================================
// SEARCH PRODUCTS
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
        // NORMALISE CACHE KEY
        // ==========================================

        const cacheKey =
            searchTerm
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();


        // ==========================================
        // CHECK SEARCH CACHE
        // ==========================================

        const cachedResult =
            woolworthsSearchCache.get(
                cacheKey
            );


        if (cachedResult) {

            const cacheAge =
                Date.now() -
                cachedResult.timestamp;


            if (
                cacheAge <
                CACHE_DURATION
            ) {

                console.log(
                    `Woolworths search cache HIT: "${cacheKey}"`
                );

                return res.json(
                    cachedResult.data
                );

            }


            console.log(
                `Woolworths search cache expired: "${cacheKey}"`
            );


            woolworthsSearchCache.delete(
                cacheKey
            );

        }


        // ==========================================
        // API KEY
        // ==========================================

        const apiKey =
            process.env.PARSE_API_KEY;


        if (!apiKey) {

            console.error(
                "Woolworths API key is missing."
            );

            return res.status(500).json({

                error:
                    "Woolworths API key is not configured."

            });

        }


        try {

            // ==========================================
            // BUILD SEARCH URL
            // ==========================================

            const searchUrl =
                new URL(
                    WOOLWORTHS_SEARCH_API_URL
                );


            searchUrl.searchParams.set(
                "query",
                searchTerm
            );


            searchUrl.searchParams.set(
                "offset",
                "0"
            );


            // ==========================================
            // CALL SEARCH PRODUCTS
            // ==========================================

            console.log(
                `Woolworths search request: "${searchTerm}"`
            );


            const searchResponse =
                await fetch(
                    searchUrl.toString(),
                    {

                        method:
                            "GET",

                        headers: {

                            "X-API-Key":
                                apiKey,

                            "Accept":
                                "application/json"

                        }

                    }
                );


            const searchData =
                await searchResponse.json();


            // ==========================================
            // SEARCH API ERROR
            // ==========================================

            if (!searchResponse.ok) {

                console.error(
                    "Woolworths search API error:",
                    searchResponse.status,
                    searchData
                );


                return res.status(
                    searchResponse.status
                ).json({

                    error:
                        searchData.error ||
                        searchData.message ||
                        "Woolworths search request failed."

                });

            }


            // ==========================================
            // EXTRACT PRODUCTS
            // ==========================================

            const products =
                extractProducts(
                    searchData
                );


            console.log(
                `Woolworths search returned ${products.length} products`
            );


            // ==========================================
            // GET PRODUCT DETAILS
            // ==========================================
            //
            // get_product_details gives us the
            // actual image URLs.
            //
            // Cached products do NOT consume another
            // API credit.
            //
            // ==========================================

            const productsWithDetails =
                await Promise.all(

                    products.map(
                        async function (product) {

                            const details =
                                await getWoolworthsProductDetails(
                                    product,
                                    apiKey
                                );


                            // ==========================================
                            // IMAGE
                            // ==========================================

                            let imageUrl =
                                "";


                            if (
                                details &&
                                Array.isArray(
                                    details.images
                                ) &&
                                details.images.length > 0
                            ) {

                                imageUrl =
                                    String(
                                        details.images[0] || ""
                                    ).trim();

                            }


                            // ==========================================
                            // NORMALIZED PRODUCT
                            // ==========================================

                            return {

                                ...product,

                                // ------------------------------------------
                                // Prefer detailed information when available
                                // ------------------------------------------

                                id:
                                    details?.id ||
                                    product.id ||
                                    "",

                                name:
                                    details?.name ||
                                    product.name ||
                                    "",

                                price:
                                    details?.price ??
                                    product.price ??
                                    null,

                                price_per_kg:
                                    details?.price_per_kg ??
                                    product.price_per_kg ??
                                    null,

                                review_count:
                                    details?.review_count ??
                                    product.review_count ??
                                    0,

                                on_sale:
                                    details?.on_sale ??
                                    product.on_sale ??
                                    false,

                                brand:
                                    details?.brand ??
                                    product.brand ??
                                    null,

                                rating:
                                    details?.rating ??
                                    product.rating ??
                                    null,

                                // ------------------------------------------
                                // IMAGE
                                // ------------------------------------------

                                image_url:
                                    imageUrl,

                                image:
                                    imageUrl,

                                // ------------------------------------------
                                // STORE
                                // ------------------------------------------

                                store:
                                    "Woolworths"

                            };

                        }
                    )

                );


            // ==========================================
            // BUILD NORMALIZED RESPONSE
            // ==========================================

            const normalizedData = {

                ...searchData,

                products:
                    productsWithDetails

            };


            // ==========================================
            // SAVE SEARCH CACHE
            // ==========================================

            woolworthsSearchCache.set(
                cacheKey,
                {

                    data:
                        normalizedData,

                    timestamp:
                        Date.now()

                }
            );


            console.log(
                `Woolworths search cached: "${cacheKey}"`
            );


            // ==========================================
            // RETURN
            // ==========================================

            return res.json(
                normalizedData
            );


        } catch (error) {

            console.error(
                "Woolworths search error:",
                error
            );


            return res.status(500).json({

                error:
                    "Unable to search Woolworths."

            });

        }

    }
);


// ==========================================
// GET WOOLWORTHS PRODUCT DETAILS
// ==========================================

async function getWoolworthsProductDetails(
    product,
    apiKey
) {

    // ==========================================
    // PRODUCT URL
    // ==========================================

    const productUrl =
        String(
            product.url ||
            ""
        ).trim();


    if (!productUrl) {

        console.log(
            `No Woolworths product URL for product: ${product.name || "Unknown"}`
        );

        return null;

    }


    // ==========================================
    // CACHE KEY
    // ==========================================
    //
    // The product URL is unique and is exactly
    // what Parse expects.
    //
    // ==========================================

    const cacheKey =
        productUrl;


    // ==========================================
    // CHECK PRODUCT CACHE
    // ==========================================

    const cachedProduct =
        woolworthsProductCache.get(
            cacheKey
        );


    if (cachedProduct) {

        const cacheAge =
            Date.now() -
            cachedProduct.timestamp;


        if (
            cacheAge <
            CACHE_DURATION
        ) {

            console.log(
                `Woolworths product details cache HIT: ${product.id || productUrl}`
            );


            return cachedProduct.data;

        }


        console.log(
            `Woolworths product details cache expired: ${product.id || productUrl}`
        );


        woolworthsProductCache.delete(
            cacheKey
        );

    }


    // ==========================================
    // BUILD DETAILS URL
    // ==========================================

    const detailsUrl =
        new URL(
            WOOLWORTHS_DETAILS_API_URL
        );


    detailsUrl.searchParams.set(
        "product_url",
        productUrl
    );


    try {

        console.log(
            `Woolworths details request: ${product.id || productUrl}`
        );


        // ==========================================
        // CALL GET PRODUCT DETAILS
        // ==========================================

        const response =
            await fetch(
                detailsUrl.toString(),
                {

                    method:
                        "GET",

                    headers: {

                        "X-API-Key":
                            apiKey,

                        "Accept":
                            "application/json"

                    }

                }
            );


        const data =
            await response.json();


        // ==========================================
        // API ERROR
        // ==========================================

        if (!response.ok) {

            console.error(
                "Woolworths product details error:",
                response.status,
                data
            );


            return null;

        }


        // ==========================================
        // PARSE DETAIL RESPONSE
        // ==========================================
        //
        // According to the Parse API response:
        //
        // {
        //     data: {
        //         id,
        //         name,
        //         images: [...]
        //     },
        //     status: "success"
        // }
        //
        // ==========================================

        const details =
            data &&
            data.data
                ? data.data
                : data;


        if (
            !details ||
            typeof details !== "object"
        ) {

            console.log(
                `No product details returned: ${product.id || productUrl}`
            );

            return null;

        }


        // ==========================================
        // CACHE PRODUCT DETAILS
        // ==========================================

        woolworthsProductCache.set(
            cacheKey,
            {

                data:
                    details,

                timestamp:
                    Date.now()

            }
        );


        console.log(
            `Woolworths product details cached: ${product.id || productUrl}`
        );


        // ==========================================
        // LOG IMAGE STATUS
        // ==========================================

        if (
            Array.isArray(details.images) &&
            details.images.length > 0
        ) {

            console.log(
                `Woolworths image found: ${product.id || productUrl}`
            );

        } else {

            console.log(
                `No Woolworths image returned: ${product.id || productUrl}`
            );

        }


        return details;


    } catch (error) {

        console.error(
            `Woolworths product details error for ${product.id || productUrl}:`,
            error.message
        );


        return null;

    }

}


// ==========================================
// EXTRACT PRODUCTS
// ==========================================

function extractProducts(data) {

    // ==========================================
    // STANDARD PARSE RESPONSE
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
    // DIRECT PRODUCTS ARRAY
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
    // RESULTS ARRAY
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
    // NESTED RESULTS
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
// EXPORT
// ==========================================

module.exports =
    router;

