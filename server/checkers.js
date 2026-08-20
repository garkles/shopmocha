const express = require("express");

const router = express.Router();


// ======================================================
// PARSE CONFIGURATION
// ======================================================

const PARSE_API_URL =
    "https://api.parse.bot/scraper/a7a3a4ba-dfb7-4476-9712-8753b2fb3140";

const PARSE_API_KEY =
    process.env.PARSE_API_KEY;


// ======================================================
// CACHE
// ======================================================

const searchCache =
    new Map();


// Cache duration:
// 30 minutes

const CACHE_DURATION =
    30 * 60 * 1000;


// ======================================================
// CHECKERS IMAGE HELPERS
// ======================================================
//
// Parse already gives us usable Checkers image URLs.
//
// Preferred:
// imageProductCardURL
//
// Fallback:
// imagePDPURL
// imageURL
//
// Final fallback:
// imageIds -> constructed Sixty60 URL
// ======================================================

function isValidHttpUrl(value) {

    if (
        typeof value !== "string"
    ) {

        return false;

    }


    const trimmed =
        value.trim();


    if (!trimmed) {

        return false;

    }


    return (
        trimmed.startsWith("https://") ||
        trimmed.startsWith("http://")
    );

}


// ======================================================
// NORMALISE CHECKERS IMAGE URL
// ======================================================

function normaliseCheckersImageUrl(
    value
) {

    if (
        typeof value !== "string"
    ) {

        return "";

    }


    const image =
        value.trim();


    if (!image) {

        return "";

    }


    // Already a complete URL
    if (
        isValidHttpUrl(image)
    ) {

        return image;

    }


    // Checkers / Sixty60 image ID
    if (
        /^[a-f0-9]{24}$/i.test(
            image
        )
    ) {

        return (
            "https://catalog.sixty60.co.za/v2/files/" +
            image
        );

    }


    return "";

}


// ======================================================
// GET CHECKERS PRODUCT IMAGES
// ======================================================

function getCheckersProductImages(
    product
) {

    const images = [];


    function addImage(
        value
    ) {

        const url =
            normaliseCheckersImageUrl(
                value
            );


        if (
            url &&
            !images.includes(url)
        ) {

            images.push(url);

        }

    }


    // --------------------------------------------------
    // BEST IMAGE FOR PRODUCT CARDS
    // --------------------------------------------------

    addImage(
        product.imageProductCardURL
    );


    // --------------------------------------------------
    // PDP IMAGE FALLBACK
    // --------------------------------------------------

    addImage(
        product.imagePDPURL
    );


    // --------------------------------------------------
    // ORIGINAL IMAGE FALLBACK
    // --------------------------------------------------

    addImage(
        product.imageURL
    );


    // --------------------------------------------------
    // IMAGE ID FALLBACK
    // --------------------------------------------------

    if (
        Array.isArray(
            product.imageIds
        )
    ) {

        product.imageIds.forEach(
            function (imageId) {

                addImage(
                    imageId
                );

            }
        );

    }
    else if (
        typeof product.imageIds ===
        "string"
    ) {

        addImage(
            product.imageIds
        );

    }


    // --------------------------------------------------
    // SINGLE IMAGE ID FALLBACK
    // --------------------------------------------------

    addImage(
        product.imageId
    );


    return images;

}


// ======================================================
// NORMALISE CHECKERS PRODUCT
// ======================================================
//
// This converts the raw Parse product into the common
// ShopMocha catalogue format.
//
// The important fields are:
//
// image
// images
// store
// name
// price
//
// This means catalogue.js does not need to know how
// Checkers stores its images.
// ======================================================

function normaliseCheckersProduct(
    product
) {

    if (
        !product ||
        typeof product !== "object"
    ) {

        return null;

    }


    const images =
        getCheckersProductImages(
            product
        );


    const primaryImage =
        images.length > 0
            ? images[0]
            : "";


    return {

        // ------------------------------------------------
        // PRODUCT IDENTITY
        // ------------------------------------------------

        id:
            product.id ||
            null,

        productId:
            product.id ||
            null,

        articleNumber:
            product.articleNumber ||
            "",

        sku:
            product.articleNumber ||
            "",


        // ------------------------------------------------
        // PRODUCT NAME
        // ------------------------------------------------

        name:
            product.name ||
            product.displayName ||
            "Unknown Checkers Product",

        displayName:
            product.displayName ||
            product.name ||
            "Unknown Checkers Product",

        title:
            product.name ||
            product.displayName ||
            "Unknown Checkers Product",


        // ------------------------------------------------
        // DESCRIPTION
        // ------------------------------------------------

        description:
            product.description ||
            product.shortDescription ||
            "",

        shortDescription:
            product.shortDescription ||
            product.description ||
            "",


        // ------------------------------------------------
        // BRAND
        // ------------------------------------------------

        brand:
            product.brand ||
            "",


        // ------------------------------------------------
        // PRICE
        // ------------------------------------------------

        price:
            typeof product.price === "number"
                ? product.price
                : (
                    typeof product.discountedPrice ===
                    "number"
                        ? product.discountedPrice
                        : 0
                ),

        discountedPrice:
            typeof product.discountedPrice ===
            "number"
                ? product.discountedPrice
                : (
                    typeof product.price ===
                    "number"
                        ? product.price
                        : 0
                ),

        oldPrice:
            typeof product.oldPrice ===
            "number"
                ? product.oldPrice
                : 0,

        currency:
            product.currency ||
            "ZAR",

        currencySymbol:
            product.currencySymbol ||
            "R",


        // ------------------------------------------------
        // PROMOTION
        // ------------------------------------------------

        isOnPromotion:
            Boolean(
                product.isOnPromotion
            ),

        promotion:
            product.isOnPromotion
                ? "Special promotion"
                : "",


        // ------------------------------------------------
        // AVAILABILITY
        // ------------------------------------------------

        available:
            product.outOfStock !== true &&
            product.isStockAvailable !== false,

        outOfStock:
            product.outOfStock === true,


        // ------------------------------------------------
        // STOCK
        // ------------------------------------------------

        isStockAvailable:
            product.isStockAvailable !== false,

        stockOnHand:
            product.stockOnHand ?? null,


        // ------------------------------------------------
        // SIZE / PACKAGING
        // ------------------------------------------------

        size:
            product.boxContent ||
            "",

        packQuantity:
            product.packQuantity ??
            1,

        unitOfMeasure:
            product.unitOfMeasure ||
            "",


        // ------------------------------------------------
        // NORMALISED STORE
        // ------------------------------------------------

        store:
            "Checkers",

        storeName:
            "Checkers",


        // ------------------------------------------------
        // STORE IDENTIFIERS
        // ------------------------------------------------

        storeId:
            product.storeId ||
            null,


        // ------------------------------------------------
        // IMAGES
        // ------------------------------------------------
        //
        // IMPORTANT:
        //
        // image = primary product-card image
        //
        // images = ordered fallback images
        // ------------------------------------------------

        image:
            primaryImage,

        imageUrl:
            primaryImage,

        imageURL:
            primaryImage,

        imageProductCardURL:
            normaliseCheckersImageUrl(
                product.imageProductCardURL
            ) ||
            primaryImage,

        imagePDPURL:
            normaliseCheckersImageUrl(
                product.imagePDPURL
            ) ||
            primaryImage,

        images:
            images,


        // ------------------------------------------------
        // ORIGINAL IMAGE IDS
        //
        // Kept for reference, but the frontend no longer
        // needs to construct URLs from these.
        // ------------------------------------------------

        imageId:
            product.imageId ||
            null,

        imageIds:
            Array.isArray(
                product.imageIds
            )
                ? product.imageIds
                : [],


        // ------------------------------------------------
        // BARCODE
        // ------------------------------------------------

        barcodes:
            Array.isArray(
                product.barcodes
            )
                ? product.barcodes
                : [],


        // ------------------------------------------------
        // RAW CHECKERS DATA
        //
        // Useful if another part of ShopMocha later
        // needs a field that isn't currently normalized.
        // ------------------------------------------------

        checkers: {

            originalId:
                product.id ||
                null,

            articleNumber:
                product.articleNumber ||
                "",

            storeId:
                product.storeId ||
                null

        }

    };

}


// ======================================================
// NORMALISE PARSE SEARCH RESPONSE
// ======================================================

function normaliseCheckersSearchResponse(
    data
) {

    let products = [];


    // --------------------------------------------------
    // Parse response:
    //
    // {
    //   status: "success",
    //   data: {
    //      products: [...]
    //   }
    // }
    // --------------------------------------------------

    if (
        data &&
        data.data &&
        Array.isArray(
            data.data.products
        )
    ) {

        products =
            data.data.products;

    }


    // --------------------------------------------------
    // Fallback if Parse changes response structure
    // --------------------------------------------------

    else if (
        data &&
        Array.isArray(
            data.products
        )
    ) {

        products =
            data.products;

    }


    // --------------------------------------------------
    // Normalise products
    // --------------------------------------------------

    const normalisedProducts =
        products
            .map(
                normaliseCheckersProduct
            )
            .filter(
                Boolean
            );


    return {

        status:
            data.status ||
            "success",

        data: {

            products:
                normalisedProducts

        }

    };

}


// ======================================================
// SEARCH CHECKERS PRODUCTS
// ======================================================

router.get(
    "/search",
    async function (
        req,
        res
    ) {

        try {

            const searchTerm =
                req.query.q;


            // ------------------------------------------------
            // VALIDATE SEARCH TERM
            // ------------------------------------------------

            if (
                !searchTerm ||
                !String(searchTerm).trim()
            ) {

                return res.status(
                    400
                ).json({

                    error:
                        "Please provide a search term."

                });

            }


            // ------------------------------------------------
            // NORMALISE SEARCH TERM
            // ------------------------------------------------

            const cleanSearchTerm =
                String(
                    searchTerm
                ).trim();


            const cacheKey =
                cleanSearchTerm
                    .toLowerCase();


            // ------------------------------------------------
            // CHECK CACHE
            // ------------------------------------------------

            const cached =
                searchCache.get(
                    cacheKey
                );


            if (cached) {

                const cacheAge =
                    Date.now() -
                    cached.timestamp;


                if (
                    cacheAge <
                    CACHE_DURATION
                ) {

                    console.log(
                        `CHECKERS CACHE HIT: "${cacheKey}"`
                    );


                    return res.json(
                        cached.data
                    );

                }


                // Cache expired

                searchCache.delete(
                    cacheKey
                );

            }


            // ------------------------------------------------
            // CHECK API KEY
            // ------------------------------------------------

            if (!PARSE_API_KEY) {

                console.error(
                    "PARSE_API_KEY is not configured."
                );


                return res.status(
                    500
                ).json({

                    error:
                        "Checkers API configuration is missing."

                });

            }


            // ------------------------------------------------
            // CALL PARSE
            // ------------------------------------------------

            console.log(
                `CHECKERS PARSE API CALL: "${cacheKey}"`
            );


            const response =
                await fetch(
                    `${PARSE_API_URL}/search_products`,
                    {

                        method:
                            "POST",

                        headers: {

                            "X-API-Key":
                                PARSE_API_KEY,

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                query:
                                    cleanSearchTerm,

                                page:
                                    0,

                                limit:
                                    20

                            })

                    }
                );


            // ------------------------------------------------
            // READ RESPONSE
            // ------------------------------------------------

            const data =
                await response.json();


            // ------------------------------------------------
            // HANDLE PARSE ERROR
            // ------------------------------------------------

            if (
                !response.ok
            ) {

                console.error(
                    "Checkers Parse API error:",
                    data
                );


                return res.status(
                    response.status
                ).json(
                    data
                );

            }


            // ------------------------------------------------
            // NORMALISE RESPONSE
            // ------------------------------------------------

            const normalisedData =
                normaliseCheckersSearchResponse(
                    data
                );


            // ------------------------------------------------
            // CACHE NORMALISED RESULT
            // ------------------------------------------------

            searchCache.set(
                cacheKey,
                {

                    timestamp:
                        Date.now(),

                    data:
                        normalisedData

                }
            );


            console.log(
                `CHECKERS CACHED: "${cacheKey}" for 30 minutes`
            );


            // ------------------------------------------------
            // RETURN NORMALISED RESPONSE
            // ------------------------------------------------

            return res.json(
                normalisedData
            );

        }
        catch (
            error
        ) {

            console.error(
                "Checkers API error:",
                error
            );


            return res.status(
                500
            ).json({

                error:
                    "Could not retrieve Checkers products."

            });

        }

    }
);


// ======================================================
// FIND CHECKERS STORES
// ======================================================

router.get(
    "/stores",
    async function (
        req,
        res
    ) {

        try {

            const lat =
                req.query.lat;

            const lng =
                req.query.lng;


            // ------------------------------------------------
            // VALIDATE LOCATION
            // ------------------------------------------------

            if (
                lat === undefined ||
                lng === undefined ||
                lat === "" ||
                lng === ""
            ) {

                return res.status(
                    400
                ).json({

                    error:
                        "Latitude and longitude are required."

                });

            }


            const latitude =
                Number(lat);

            const longitude =
                Number(lng);


            if (
                !Number.isFinite(
                    latitude
                ) ||
                !Number.isFinite(
                    longitude
                )
            ) {

                return res.status(
                    400
                ).json({

                    error:
                        "Latitude and longitude must be valid numbers."

                });

            }


            // ------------------------------------------------
            // CHECK API KEY
            // ------------------------------------------------

            if (!PARSE_API_KEY) {

                console.error(
                    "PARSE_API_KEY is not configured."
                );


                return res.status(
                    500
                ).json({

                    error:
                        "Checkers API configuration is missing."

                });

            }


            // ------------------------------------------------
            // CALL PARSE
            // ------------------------------------------------

            const response =
                await fetch(
                    `${PARSE_API_URL}/find_stores`,
                    {

                        method:
                            "POST",

                        headers: {

                            "X-API-Key":
                                PARSE_API_KEY,

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                lat:
                                    latitude,

                                lng:
                                    longitude

                            })

                    }
                );


            const data =
                await response.json();


            // ------------------------------------------------
            // HANDLE ERROR
            // ------------------------------------------------

            if (
                !response.ok
            ) {

                console.error(
                    "Checkers store API error:",
                    data
                );


                return res.status(
                    response.status
                ).json(
                    data
                );

            }


            // ------------------------------------------------
            // RETURN STORES
            // ------------------------------------------------

            return res.json(
                data
            );

        }
        catch (
            error
        ) {

            console.error(
                "Checkers store error:",
                error
            );


            return res.status(
                500
            ).json({

                error:
                    "Could not retrieve Checkers stores."

            });

        }

    }
);


// ======================================================
// EXPORT
// ======================================================

module.exports =
    router;