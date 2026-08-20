// ======================================================
// SHOPMOCHA CATALOGUE
// PICK N PAY + WOOLWORTHS + CHECKERS
// ======================================================
//
// FEATURES
// ------------------------------------------------------
// • Search all stores
// • Store filtering
// • Price sorting
// • A-Z / Z-A sorting
// • Relevance sorting
// • Best Deal product
// • Best Deal respects active filters
// • Product images
// • Store logos
// • Add products to Firebase shopping lists
// • Checkers image resolution
// ======================================================


import {
    auth,
    db
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    arrayUnion,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


// ======================================================
// DOM
// ======================================================

const searchForm =
    document.getElementById("search_form");

const searchInput =
    document.getElementById("search_input");

const searchButton =
    document.getElementById("search_button");

const loading =
    document.getElementById("loading");

const emptyState =
    document.getElementById("empty_state");

const searchStatus =
    document.getElementById("search_status");


// ======================================================
// STATE
// ======================================================

let currentUser = null;

let shoppingLists = [];

let selectedListId =
    localStorage.getItem(
        "shopmocha_active_list_id"
    );

let allProducts = [];

let currentSearchTerm = "";

let currentStoreFilter = "all";

let currentSort = "relevance";

let productsGrid = null;

let bestDealSection = null;

let bestDealContent = null;


// ======================================================
// STORE LOGOS
// ======================================================

const STORE_LOGOS = {

    "Pick n Pay":
        "/images/stores/pnp-logo.png",

    "Woolworths":
        "/images/stores/woolworths-logo.png",

    "Checkers":
        "/images/stores/checkers-logo.png"

};


// ======================================================
// INITIALISE
// ======================================================

function initialiseCatalogue() {

    createCombinedResultsSection();

    createCatalogueFilters();

    createBestDealSection();

    hideOldStoreSections();

}


// ======================================================
// CREATE COMBINED RESULTS
// ======================================================

function createCombinedResultsSection() {

    const existingGrid =
        document.getElementById(
            "products_grid"
        );


    if (existingGrid) {

        productsGrid =
            existingGrid;

        return;

    }


    const container =
        document.querySelector(
            ".catalogue-container"
        );


    if (!container) {

        console.error(
            "Could not find .catalogue-container"
        );

        return;

    }


    const section =
        document.createElement(
            "section"
        );


    section.id =
        "combined_results_section";


    section.className =
        "store-results-section";


    section.innerHTML = `

        <div class="store-results-header">

            <div class="store-results-title">

                <div>

                    <h2>
                        Products
                    </h2>

                </div>

            </div>


            <span
                id="combined_result_count"
                class="store-result-count"
            ></span>

        </div>


        <div
            id="products_grid"
            class="products-grid"
        ></div>

    `;


    const oldCheckers =
        document.getElementById(
            "checkers_results_section"
        );


    if (oldCheckers) {

        container.insertBefore(
            section,
            oldCheckers
        );

    } else {

        container.appendChild(
            section
        );

    }


    productsGrid =
        document.getElementById(
            "products_grid"
        );

}


// ======================================================
// HIDE OLD STORE SECTIONS
// ======================================================

function hideOldStoreSections() {

    const ids = [

        "checkers_results_section",

        "woolworths_results_section",

        "pnp_results_section",

        "other_stores_section"

    ];


    ids.forEach(
        function (id) {

            const section =
                document.getElementById(
                    id
                );


            if (section) {

                section.style.display =
                    "none";

            }

        }
    );

}


// ======================================================
// CREATE / CONNECT FILTER CONTROLS
// ======================================================
//
// IMPORTANT:
// The HTML already contains #catalogue_filters.
// Therefore we MUST NOT return before connecting
// the existing controls.
//

function createCatalogueFilters() {

    let filters =
        document.getElementById(
            "catalogue_filters"
        );


    // ==================================================
    // CREATE FILTERS ONLY IF HTML DOES NOT HAVE THEM
    // ==================================================

    if (!filters) {

        if (!searchForm) {

            return;

        }


        filters =
            document.createElement(
                "div"
            );


        filters.id =
            "catalogue_filters";


        filters.className =
            "catalogue-filters";


        filters.innerHTML = `

            <div class="catalogue-filter-header">

                <div>

                    <span class="catalogue-filter-label">
                        FILTERS & SORTING
                    </span>

                    <h3>
                        Find the best product
                    </h3>

                </div>

            </div>


            <div class="catalogue-filter-grid">

                <div class="catalogue-filter-field">

                    <label
                        for="catalogue_store_filter"
                    >
                        Store
                    </label>


                    <select
                        id="catalogue_store_filter"
                    >

                        <option value="all">
                            All Stores
                        </option>

                        <option value="Pick n Pay">
                            Pick n Pay
                        </option>

                        <option value="Woolworths">
                            Woolworths
                        </option>

                        <option value="Checkers">
                            Checkers
                        </option>

                    </select>

                </div>


                <div class="catalogue-filter-field">

                    <label
                        for="catalogue_sort"
                    >
                        Sort By
                    </label>


                    <select
                        id="catalogue_sort"
                    >

                        <option value="relevance">
                            Relevance
                        </option>

                        <option value="cheapest">
                            Price: Low to High
                        </option>

                        <option value="expensive">
                            Price: High to Low
                        </option>

                        <option value="az">
                            Alphabetical A–Z
                        </option>

                        <option value="za">
                            Alphabetical Z–A
                        </option>

                    </select>

                </div>


                <div class="catalogue-filter-field catalogue-filter-clear">

                    <label>
                        &nbsp;
                    </label>


                    <button
                        type="button"
                        id="catalogue_clear_filters"
                    >
                        Clear Filters
                    </button>

                </div>

            </div>

        `;


        searchForm.parentNode.insertBefore(
            filters,
            searchForm.nextSibling
        );

    }


    // ==================================================
    // GET EXISTING CONTROLS
    // ==================================================

    const storeFilter =
        document.getElementById(
            "catalogue_store_filter"
        );


    const sortSelect =
        document.getElementById(
            "catalogue_sort"
        );


    const clearButton =
        document.getElementById(
            "catalogue_clear_filters"
        );


    // ==================================================
    // STORE FILTER
    // ==================================================

    if (storeFilter) {

        currentStoreFilter =
            normaliseStoreName(
                storeFilter.value
            );


        if (
            storeFilter.value ===
            "all"
        ) {

            currentStoreFilter =
                "all";

        }


        storeFilter.addEventListener(
            "change",
            function () {

                currentStoreFilter =
                    normaliseStoreName(
                        storeFilter.value
                    );


                if (
                    storeFilter.value ===
                    "all"
                ) {

                    currentStoreFilter =
                        "all";

                }


                console.log(
                    "Store filter changed:",
                    currentStoreFilter
                );


                applyFiltersAndSort();

            }
        );

    }


    // ==================================================
    // SORT
    // ==================================================

    if (sortSelect) {

        currentSort =
            sortSelect.value ||
            "relevance";


        sortSelect.addEventListener(
            "change",
            function () {

                currentSort =
                    sortSelect.value;


                console.log(
                    "Sort changed:",
                    currentSort
                );


                applyFiltersAndSort();

            }
        );

    }


    // ==================================================
    // CLEAR FILTERS
    // ==================================================

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function () {

                currentStoreFilter =
                    "all";


                currentSort =
                    "relevance";


                if (storeFilter) {

                    storeFilter.value =
                        "all";

                }


                if (sortSelect) {

                    sortSelect.value =
                        "relevance";

                }


                applyFiltersAndSort();

            }
        );

    }

}


// ======================================================
// AUTH
// ======================================================

onAuthStateChanged(
    auth,
    async function (user) {

        currentUser =
            user;


        if (!user) {

            shoppingLists =
                [];

            return;

        }


        await loadShoppingLists(
            user
        );

    }
);


// ======================================================
// LOAD SHOPPING LISTS
// ======================================================

async function loadShoppingLists(
    user
) {

    try {

        const listsQuery =
            query(
                collection(
                    db,
                    "shoppingLists"
                ),
                where(
                    "userId",
                    "==",
                    user.uid
                )
            );


        const snapshot =
            await getDocs(
                listsQuery
            );


        shoppingLists =
            [];


        snapshot.forEach(
            function (snapshotItem) {

                const data =
                    snapshotItem.data();


                shoppingLists.push({

                    id:
                        snapshotItem.id,

                    name:
                        data.name ||
                        "Unnamed Shopping List"

                });

            }
        );


        console.log(
            "Shopping lists loaded:",
            shoppingLists
        );

    }

    catch (error) {

        console.error(
            "Could not load shopping lists:",
            error
        );


        shoppingLists =
            [];

    }

}


// ======================================================
// SEARCH FORM
// ======================================================

if (searchForm) {

    searchForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const searchTerm =
                searchInput
                    ? searchInput.value.trim()
                    : "";


            if (!searchTerm) {

                if (searchStatus) {

                    searchStatus.textContent =
                        "Please enter a product to search.";

                }

                return;

            }


            await searchProducts(
                searchTerm
            );

        }
    );

}


// ======================================================
// SEARCH PRODUCTS
// ======================================================

async function searchProducts(
    searchTerm
) {

    currentSearchTerm =
        searchTerm.trim();


    allProducts =
        [];


    if (productsGrid) {

        productsGrid.innerHTML =
            "";

    }


    hideOldStoreSections();

    hideBestDeal();


    if (emptyState) {

        emptyState.style.display =
            "none";

    }


    if (loading) {

        loading.style.display =
            "block";

    }


    if (searchButton) {

        searchButton.disabled =
            true;

    }


    if (searchStatus) {

        searchStatus.textContent =
            `Searching Pick n Pay, Woolworths and Checkers for "${searchTerm}"...`;

    }


    try {

        const response =
            await fetch(
                `/api/products/search?q=${encodeURIComponent(searchTerm)}`
            );


        if (!response.ok) {

            throw new Error(
                `Search request failed with status ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "Combined catalogue response:",
            data
        );


        allProducts =
            extractProducts(
                data
            );


        // ==================================================
        // NORMALISE EVERY PRODUCT STORE
        // ==================================================

        allProducts =
            allProducts.map(
                function (product) {

                    const detectedStore =
                        getProductStore(
                            product
                        );


                    return {

                        ...product,

                        store:
                            normaliseStoreName(
                                detectedStore
                            )

                    };

                }
            );


        // ==================================================
        // CHECKERS IMAGE RESOLUTION
        // ==================================================

        allProducts =
            await resolveCheckersImages(
                allProducts
            );


        console.log(
            "Products loaded:",
            allProducts.length
        );


        // ==================================================
        // DEBUG PRODUCT DATA
        // ==================================================

        console.table(
            allProducts.map(
                function (product) {

                    return {

                        name:
                            getProductName(
                                product
                            ),

                        store:
                            product.store,

                        price:
                            getNumericProductPrice(
                                product
                            )

                    };

                }
            )
        );


        if (loading) {

            loading.style.display =
                "none";

        }


        if (searchButton) {

            searchButton.disabled =
                false;

        }


        if (
            allProducts.length === 0
        ) {

            if (searchStatus) {

                searchStatus.textContent =
                    `No products found for "${searchTerm}".`;

            }


            if (emptyState) {

                emptyState.style.display =
                    "block";

            }


            return;

        }


        updateSearchStatus();

        applyFiltersAndSort();

    }

    catch (error) {

        console.error(
            "Catalogue search error:",
            error
        );


        if (loading) {

            loading.style.display =
                "none";

        }


        if (searchButton) {

            searchButton.disabled =
                false;

        }


        if (searchStatus) {

            searchStatus.textContent =
                "Unable to search the stores.";

        }


        if (productsGrid) {

            productsGrid.innerHTML = `

                <div class="catalogue-error">

                    <strong>
                        Something went wrong.
                    </strong>

                    <br><br>

                    ${escapeHtml(
                        error.message
                    )}

                </div>

            `;

        }

    }

}


// ======================================================
// GET PRODUCT STORE
// ======================================================

function getProductStore(
    product
) {

    if (!product) {

        return "";

    }


    const possibleStores = [

        product.store,

        product.storeName,

        product.retailer,

        product.retailerName,

        product.merchant,

        product.merchantName,

        product.source,

        product.store_name,

        product.store_name_display,

        product.storeCode,

        product.store_code,

        product.retailerCode,

        product.retailer_code

    ];


    // ==================================================
    // SEARCH FOR A RECOGNISABLE STORE
    // ==================================================

    for (
        const value of possibleStores
    ) {

        if (
            value === undefined ||
            value === null
        ) {

            continue;

        }


        const text =
            String(
                value
            ).trim();


        if (!text) {

            continue;

        }


        const normalised =
            normaliseStoreName(
                text
            );


        if (
            normalised === "Pick n Pay" ||
            normalised === "Woolworths" ||
            normalised === "Checkers"
        ) {

            return normalised;

        }

    }


    // ==================================================
    // FALLBACK
    // ==================================================

    for (
        const value of possibleStores
    ) {

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim()
        ) {

            return String(
                value
            ).trim();

        }

    }


    return "";

}


// ======================================================
// CHECKERS IMAGES
// ======================================================

async function resolveCheckersImages(
    products
) {

    return Promise.all(

        products.map(
            async function (product) {

                if (
                    normaliseStoreName(
                        product.store
                    ) !== "Checkers"
                ) {

                    return product;

                }


                if (
                    getProductImage(
                        product
                    )
                ) {

                    return product;

                }


                if (
                    !Array.isArray(
                        product.imageIds
                    ) ||
                    product.imageIds.length === 0
                ) {

                    return product;

                }


                const imageId =
                    product.imageIds.find(
                        function (id) {

                            return (
                                typeof id === "string" &&
                                id.trim()
                            );

                        }
                    );


                if (!imageId) {

                    return product;

                }


                try {

                    const response =
                        await fetch(
                            `/api/products/get_image_url?image_id=${encodeURIComponent(imageId)}`
                        );


                    if (!response.ok) {

                        return product;

                    }


                    const data =
                        await response.json();


                    const imageUrl =
                        data?.data?.url ||
                        data?.url ||
                        "";


                    if (imageUrl) {

                        return {

                            ...product,

                            image:
                                imageUrl,

                            image_url:
                                imageUrl

                        };

                    }

                }

                catch (error) {

                    console.error(
                        "Checkers image error:",
                        error
                    );

                }


                return product;

            }
        )

    );

}


// ======================================================
// EXTRACT PRODUCTS
// ======================================================

function extractProducts(
    data
) {

    if (
        Array.isArray(data)
    ) {

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
        Array.isArray(
            data.data.products
        )
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
        Array.isArray(
            data.data.results
        )
    ) {

        return data.data.results;

    }


    return [];

}


// ======================================================
// NORMALISE STORE
// ======================================================
//
// Supports:
// P
// PnP
// Pick n Pay
//
// W
// Woolies
// Woolworths
//
// C
// Checkers
//
// ======================================================

function normaliseStoreName(
    store
) {

    const value =
        String(
            store || ""
        )
        .trim()
        .toLowerCase();


    // ==================================================
    // ALL STORES
    // ==================================================

    if (
        value === "all"
    ) {

        return "all";

    }


    // ==================================================
    // PICK N PAY
    // ==================================================

    if (
        value === "p" ||
        value === "pnp" ||
        value === "p.n.p" ||
        value === "pick n pay" ||
        value === "pick n pay asap" ||
        value === "picknpay" ||
        value === "picknpay asap" ||
        value.includes("pick n pay") ||
        value.includes("picknpay")
    ) {

        return "Pick n Pay";

    }


    // ==================================================
    // WOOLWORTHS
    // ==================================================

    if (
        value === "w" ||
        value === "woolworths" ||
        value === "woolies" ||
        value === "woolworth"
    ) {

        return "Woolworths";

    }


    if (
        value.includes("woolworth")
    ) {

        return "Woolworths";

    }


    // ==================================================
    // CHECKERS
    // ==================================================

    if (
        value === "c" ||
        value === "checkers" ||
        value === "checkers sixty60" ||
        value === "checkers sixty 60" ||
        value === "checkers sixty60 asap"
    ) {

        return "Checkers";

    }


    if (
        value.includes("checkers")
    ) {

        return "Checkers";

    }


    // ==================================================
    // UNKNOWN
    // ==================================================

    return (
        String(
            store || ""
        ).trim()
        ||
        "Unknown Store"
    );

}


// ======================================================
// UPDATE SEARCH STATUS
// ======================================================

function updateSearchStatus() {

    if (!searchStatus) {

        return;

    }


    const counts = {

        "Pick n Pay": 0,

        "Woolworths": 0,

        "Checkers": 0

    };


    allProducts.forEach(
        function (product) {

            const store =
                normaliseStoreName(
                    product.store ||
                    getProductStore(
                        product
                    )
                );


            if (
                counts[store] !== undefined
            ) {

                counts[store]++;

            }

        }
    );


    searchStatus.textContent =
        `${allProducts.length} product${
            allProducts.length === 1
                ? ""
                : "s"
        } found • ` +
        `Pick n Pay: ${counts["Pick n Pay"]} • ` +
        `Woolworths: ${counts["Woolworths"]} • ` +
        `Checkers: ${counts["Checkers"]}`;

}


// ======================================================
// APPLY FILTERS + SORT
// ======================================================

function applyFiltersAndSort() {

    if (!productsGrid) {

        return;

    }


    // ==================================================
    // ALWAYS START FROM THE COMPLETE SEARCH RESULTS
    // ==================================================

    let filteredProducts =
        [...allProducts];


    // ==================================================
    // STORE FILTER
    // ==================================================

    const selectedStore =
        normaliseStoreName(
            currentStoreFilter
        );


    if (
        selectedStore !== "all"
    ) {

        filteredProducts =
            filteredProducts.filter(
                function (product) {

                    const productStore =
                        normaliseStoreName(
                            product.store ||
                            getProductStore(
                                product
                            )
                        );


                    return (
                        productStore ===
                        selectedStore
                    );

                }
            );

    }


    // ==================================================
    // SORT
    // ==================================================

    filteredProducts =
        sortProducts(
            filteredProducts
        );


    // ==================================================
    // DEBUG
    // ==================================================

    console.log(
        "CATALOGUE FILTER/SORT RESULT:",
        {

            selectedStore:
                selectedStore,

            sort:
                currentSort,

            totalProducts:
                allProducts.length,

            filteredProducts:
                filteredProducts.length,

            products:
                filteredProducts.map(
                    function (product) {

                        return {

                            name:
                                getProductName(
                                    product
                                ),

                            store:
                                normaliseStoreName(
                                    product.store ||
                                    getProductStore(
                                        product
                                    )
                                ),

                            price:
                                getNumericProductPrice(
                                    product
                                )

                        };

                    }
                )

        }
    );


    // ==================================================
    // BEST DEAL
    // ==================================================

    updateBestDeal(
        filteredProducts
    );


    // ==================================================
    // RENDER
    // ==================================================

    renderProducts(
        filteredProducts
    );


    // ==================================================
    // RESULT COUNT
    // ==================================================

    updateCombinedResultCount(
        filteredProducts.length
    );


    // ==================================================
    // STATUS
    // ==================================================

    updateFilteredStatus(
        filteredProducts.length
    );

}


// ======================================================
// SORT PRODUCTS
// ======================================================

function sortProducts(
    products
) {

    const sorted =
        [...products];


    // ==================================================
    // PRICE HELPER
    // ==================================================

    function getSortPrice(
        product
    ) {

        const price =
            getNumericProductPrice(
                product
            );


        if (
            typeof price !== "number"
        ) {

            return null;

        }


        if (
            !Number.isFinite(price)
        ) {

            return null;

        }


        if (
            price <= 0
        ) {

            return null;

        }


        return price;

    }


    // ==================================================
    // NAME HELPER
    // ==================================================

    function compareNames(
        a,
        b
    ) {

        return getProductName(a)
            .localeCompare(
                getProductName(b),
                undefined,
                {
                    sensitivity:
                        "base",

                    numeric:
                        true
                }
            );

    }


    // ==================================================
    // RELEVANCE
    // ==================================================

    if (
        currentSort ===
        "relevance"
    ) {

        return sorted.sort(
            function (a, b) {

                const relevanceA =
                    calculateRelevance(
                        a,
                        currentSearchTerm
                    );


                const relevanceB =
                    calculateRelevance(
                        b,
                        currentSearchTerm
                    );


                if (
                    relevanceA !==
                    relevanceB
                ) {

                    return (
                        relevanceB -
                        relevanceA
                    );

                }


                const priceA =
                    getSortPrice(
                        a
                    );


                const priceB =
                    getSortPrice(
                        b
                    );


                if (
                    priceA === null &&
                    priceB !== null
                ) {

                    return 1;

                }


                if (
                    priceB === null &&
                    priceA !== null
                ) {

                    return -1;

                }


                if (
                    priceA !== null &&
                    priceB !== null &&
                    priceA !== priceB
                ) {

                    return (
                        priceA -
                        priceB
                    );

                }


                return compareNames(
                    a,
                    b
                );

            }
        );

    }


    // ==================================================
    // LOW TO HIGH
    // ==================================================

    if (
        currentSort ===
        "cheapest"
    ) {

        return sorted.sort(
            function (a, b) {

                const priceA =
                    getSortPrice(
                        a
                    );


                const priceB =
                    getSortPrice(
                        b
                    );


                // Missing prices always go last.

                if (
                    priceA === null &&
                    priceB !== null
                ) {

                    return 1;

                }


                if (
                    priceB === null &&
                    priceA !== null
                ) {

                    return -1;

                }


                if (
                    priceA === null &&
                    priceB === null
                ) {

                    return compareNames(
                        a,
                        b
                    );

                }


                if (
                    priceA < priceB
                ) {

                    return -1;

                }


                if (
                    priceA > priceB
                ) {

                    return 1;

                }


                return compareNames(
                    a,
                    b
                );

            }
        );

    }


    // ==================================================
    // HIGH TO LOW
    // ==================================================

    if (
        currentSort ===
        "expensive"
    ) {

        return sorted.sort(
            function (a, b) {

                const priceA =
                    getSortPrice(
                        a
                    );


                const priceB =
                    getSortPrice(
                        b
                    );


                // Missing prices always go last.

                if (
                    priceA === null &&
                    priceB !== null
                ) {

                    return 1;

                }


                if (
                    priceB === null &&
                    priceA !== null
                ) {

                    return -1;

                }


                if (
                    priceA === null &&
                    priceB === null
                ) {

                    return compareNames(
                        a,
                        b
                    );

                }


                if (
                    priceA > priceB
                ) {

                    return -1;

                }


                if (
                    priceA < priceB
                ) {

                    return 1;

                }


                return compareNames(
                    a,
                    b
                );

            }
        );

    }


    // ==================================================
    // A-Z
    // ==================================================

    if (
        currentSort ===
        "az"
    ) {

        return sorted.sort(
            function (a, b) {

                return compareNames(
                    a,
                    b
                );

            }
        );

    }


    // ==================================================
    // Z-A
    // ==================================================

    if (
        currentSort ===
        "za"
    ) {

        return sorted.sort(
            function (a, b) {

                return compareNames(
                    b,
                    a
                );

            }
        );

    }


    return sorted;

}


// ======================================================
// RELEVANCE
// ======================================================

function calculateRelevance(
    product,
    searchTerm
) {

    if (!searchTerm) {

        return 0;

    }


    const query =
        searchTerm
            .toLowerCase()
            .trim();


    const name =
        getProductName(
            product
        )
        .toLowerCase();


    let score =
        0;


    if (
        name === query
    ) {

        score += 1000;

    }


    if (
        name.startsWith(query)
    ) {

        score += 500;

    }


    if (
        name.includes(query)
    ) {

        score += 300;

    }


    query
        .split(/\s+/)
        .filter(Boolean)
        .forEach(
            function (word) {

                if (
                    name.includes(word)
                ) {

                    score += 75;

                }

            }
        );


    return score;

}


// ======================================================
// RENDER PRODUCTS
// ======================================================

function renderProducts(
    products
) {

    if (!productsGrid) {

        return;

    }


    productsGrid.innerHTML =
        "";


    if (
        products.length === 0
    ) {

        productsGrid.innerHTML = `

            <div class="catalogue-no-results">

                <div class="empty-icon">
                    🔎
                </div>


                <h3>
                    No products match your filters
                </h3>


                <p>
                    Try changing the store
                    or sorting options.
                </p>

            </div>

        `;

        return;

    }


    products.forEach(
        function (product) {

            productsGrid.appendChild(
                createProductCard(
                    product,
                    products
                )
            );

        }
    );


    requestAnimationFrame(
        function () {

            productsGrid
                .querySelectorAll(
                    ".product-card"
                )
                .forEach(
                    function (card) {

                        card.classList.add(
                            "product-card-visible"
                        );

                    }
                );

        }
    );

}


// ======================================================
// CREATE STORE LOGO
// ======================================================

function createStoreLogo(
    store,
    extraClass = ""
) {

    const normalisedStore =
        normaliseStoreName(
            store
        );


    const logoUrl =
        STORE_LOGOS[
            normalisedStore
        ];


    if (!logoUrl) {

        return "";

    }


    return `
        <div
            class="store-logo ${extraClass}"
            data-store="${escapeAttribute(normalisedStore)}"
        >
            <img
                src="${escapeAttribute(logoUrl)}"
                alt="${escapeAttribute(normalisedStore)} logo"
                loading="lazy"
            >
        </div>
    `;

}


// ======================================================
// CREATE PRODUCT CARD
// ======================================================

function createProductCard(
    product,
    visibleProducts = allProducts
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "product-card";


    const name =
        getProductName(
            product
        );


    const numericPrice =
        getNumericProductPrice(
            product
        );


    const displayPrice =
        getProductPrice(
            product
        );


    const image =
        getProductImage(
            product
        );


    const promotion =
        getPromotion(
            product
        );


    const store =
        normaliseStoreName(
            product.store ||
            getProductStore(
                product
            )
        );


    const size =
        product.size ||
        product.weight ||
        product.packSize ||
        "";


    const unitPrice =
        product.pricePerUnit ||
        product.price_per_kg ||
        product.unitPrice ||
        "";


    const available =
        product.available !== false;


    const isBestDeal =
        isCheapestProduct(
            product,
            visibleProducts
        );


    card.innerHTML = `

        <div class="product-image">

            ${
                image
                ?
                `

                    <img
                        src="${escapeAttribute(image)}"
                        alt="${escapeAttribute(name)}"
                        loading="lazy"
                    >

                    <div
                        class="product-image-placeholder"
                        style="display:none;"
                    >
                        🛒
                    </div>

                `
                :
                `

                    <div
                        class="product-image-placeholder"
                    >
                        🛒
                    </div>

                `
            }

        </div>


        <div class="product-info">

            <div class="product-store">

                ${createStoreLogo(store)}

                <span>
                    ${escapeHtml(store)}
                </span>

            </div>


            ${
                isBestDeal
                ?
                `

                    <div class="product-best-deal-label">
                        <span class="product-best-deal-icon">🏆</span>
                        <span>Best Deal</span>
                    </div>

                `
                :
                ""
            }


            <h3
                class="product-name ${
                    isBestDeal
                        ? "product-name-best-deal"
                        : ""
                }"
            >
                ${escapeHtml(name)}
            </h3>


            ${
                size
                ?
                `

                    <div class="product-size">
                        ${escapeHtml(size)}
                    </div>

                `
                :
                ""
            }


            <div class="product-price">
                ${escapeHtml(displayPrice)}
            </div>


            ${
                unitPrice
                ?
                `

                    <div class="product-unit-price">
                        ${escapeHtml(unitPrice)}
                    </div>

                `
                :
                ""
            }


            ${
                promotion
                ?
                `

                    <div class="product-promo">
                        🔥
                        ${escapeHtml(promotion)}
                    </div>

                `
                :
                ""
            }


            ${
                !available
                ?
                `

                    <div class="product-unavailable">
                        Currently unavailable
                    </div>

                `
                :
                ""
            }


            <button
                type="button"
                class="add-product-button"
            >
                + Add to Shopping List
            </button>

        </div>

    `;


    // ==================================================
    // IMAGE ERROR
    // ==================================================

    const productImage =
        card.querySelector(
            ".product-image img"
        );


    if (productImage) {

        productImage.addEventListener(
            "error",
            function () {

                productImage.style.display =
                    "none";


                const placeholder =
                    productImage.nextElementSibling;


                if (placeholder) {

                    placeholder.style.display =
                        "flex";

                }

            }
        );

    }


    // ==================================================
    // ADD BUTTON
    // ==================================================

    const addButton =
        card.querySelector(
            ".add-product-button"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            function () {

                openAddProductModal(
                    product,
                    numericPrice,
                    store
                );

            }
        );

    }


    return card;

}


// ======================================================
// BEST DEAL CHECK
// ======================================================

function isCheapestProduct(
    product,
    products = allProducts
) {

    const price =
        getNumericProductPrice(
            product
        );


    if (
        price <= 0
    ) {

        return false;

    }


    const valid =
        products.filter(
            function (item) {

                return (
                    getNumericProductPrice(
                        item
                    ) > 0
                );

            }
        );


    if (
        valid.length === 0
    ) {

        return false;

    }


    const cheapest =
        Math.min(
            ...valid.map(
                function (item) {

                    return getNumericProductPrice(
                        item
                    );

                }
            )
        );


    return (
        price === cheapest
    );

}


// ======================================================
// BEST DEAL SECTION
// ======================================================

function updateBestDeal(
    filteredProducts = allProducts
) {

    createBestDealSection();


    if (
        !bestDealSection ||
        !bestDealContent
    ) {

        return;

    }


    const validProducts =
        filteredProducts.filter(
            function (product) {

                return (
                    getNumericProductPrice(
                        product
                    ) > 0
                );

            }
        );


    if (
        validProducts.length === 0
    ) {

        hideBestDeal();

        return;

    }


    const cheapest =
        validProducts.reduce(
            function (current, product) {

                return (
                    getNumericProductPrice(
                        product
                    ) <
                    getNumericProductPrice(
                        current
                    )
                )
                    ? product
                    : current;

            }
        );


    const price =
        getNumericProductPrice(
            cheapest
        );


    const name =
        getProductName(
            cheapest
        );


    const image =
        getProductImage(
            cheapest
        );


    const store =
        normaliseStoreName(
            cheapest.store ||
            getProductStore(
                cheapest
            )
        );


    const promotion =
        getPromotion(
            cheapest
        );


    const unitPrice =
        cheapest.pricePerUnit ||
        cheapest.price_per_kg ||
        cheapest.unitPrice ||
        "";


    bestDealContent.innerHTML = `

        <article
            class="best-deal-product-card"
        >

            <div class="best-deal-product-image">

                ${
                    image

                    ?

                    `

                        <img
                            src="${escapeAttribute(image)}"
                            alt="${escapeAttribute(name)}"
                            loading="lazy"
                        >

                    `

                    :

                    `

                        <div class="best-deal-image-placeholder">
                            🛒
                        </div>

                    `
                }

            </div>


            <div class="best-deal-product-details">

                <div class="best-deal-product-store">

                    ${createStoreLogo(
                        store,
                        "best-deal-store-logo"
                    )}

                    <span>
                        ${escapeHtml(store)}
                    </span>

                </div>


                <div class="best-deal-product-label">

                    <span class="best-deal-product-label-icon">
                        🏆
                    </span>

                    <span>
                        Best Deal
                    </span>

                </div>


                <h3 class="best-deal-product-name best-deal-highlight">

                    ${escapeHtml(name)}

                </h3>


                <div class="best-deal-product-price">

                    R${price.toFixed(2)}

                </div>


                ${
                    unitPrice

                    ?

                    `

                        <div class="best-deal-product-unit-price">

                            ${escapeHtml(
                                String(unitPrice)
                            )}

                        </div>

                    `

                    :

                    ""

                }


                ${
                    promotion

                    ?

                    `

                        <div class="best-deal-product-promo">

                            🔥

                            ${escapeHtml(
                                promotion
                            )}

                        </div>

                    `

                    :

                    ""

                }


                <div class="best-deal-product-description">

                    ${
                        currentStoreFilter !== "all"

                        ?

                        `

                            Cheapest ${escapeHtml(
                                currentStoreFilter
                            )} option found

                        `

                        :

                        `

                            Cheapest price found across all stores

                        `
                    }

                </div>


                <button
                    type="button"
                    class="add-product-button best-deal-add-button"
                    id="best_deal_add_button"
                >
                    + Add to Shopping List
                </button>

            </div>

        </article>

    `;


    // ==================================================
    // BEST DEAL IMAGE ERROR
    // ==================================================

    const bestDealImage =
        bestDealContent.querySelector(
            ".best-deal-product-image img"
        );


    if (bestDealImage) {

        bestDealImage.addEventListener(
            "error",
            function () {

                bestDealImage.style.display =
                    "none";


                const placeholder =
                    document.createElement(
                        "div"
                    );


                placeholder.className =
                    "best-deal-image-placeholder";


                placeholder.textContent =
                    "🛒";


                bestDealImage
                    .parentNode
                    .appendChild(
                        placeholder
                    );

            }
        );

    }


    // ==================================================
    // BEST DEAL ADD BUTTON
    // ==================================================

    const addButton =
        bestDealContent.querySelector(
            "#best_deal_add_button"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            function () {

                openAddProductModal(
                    cheapest,
                    price,
                    store
                );

            }
        );

    }


    bestDealSection.style.display =
        "block";

}


// ======================================================
// CREATE BEST DEAL
// ======================================================

function createBestDealSection() {

    if (
        document.getElementById(
            "dynamic_best_deal_section"
        )
    ) {

        bestDealSection =
            document.getElementById(
                "dynamic_best_deal_section"
            );


        bestDealContent =
            document.getElementById(
                "dynamic_best_deal_content"
            );


        return;

    }


    const container =
        document.querySelector(
            ".catalogue-container"
        );


    if (!container) {

        return;

    }


    bestDealSection =
        document.createElement(
            "section"
        );


    bestDealSection.id =
        "dynamic_best_deal_section";


    bestDealSection.className =
        "best-deal-section";


    bestDealSection.style.display =
        "none";


    bestDealSection.innerHTML = `

        <div class="best-deal-header">

            <div class="best-deal-icon">
                🏆
            </div>


            <div>

                <span class="best-deal-label">
                    BEST DEAL
                </span>


                <h2>
                    Cheapest price found
                </h2>

            </div>

        </div>


        <div
            id="dynamic_best_deal_content"
            class="best-deal-content"
        ></div>

    `;


    const combined =
        document.getElementById(
            "combined_results_section"
        );


    if (combined) {

        container.insertBefore(
            bestDealSection,
            combined
        );

    } else {

        container.appendChild(
            bestDealSection
        );

    }


    bestDealContent =
        document.getElementById(
            "dynamic_best_deal_content"
        );

}


// ======================================================
// HIDE BEST DEAL
// ======================================================

function hideBestDeal() {

    const section =
        document.getElementById(
            "dynamic_best_deal_section"
        );


    if (section) {

        section.style.display =
            "none";

    }

}


// ======================================================
// RESULT COUNT
// ======================================================

function updateCombinedResultCount(
    count
) {

    const element =
        document.getElementById(
            "combined_result_count"
        );


    if (!element) {

        return;

    }


    element.textContent =
        `${count} product${
            count === 1
                ? ""
                : "s"
        }`;

}


// ======================================================
// FILTER STATUS
// ======================================================

function updateFilteredStatus(
    count
) {

    if (!searchStatus) {

        return;

    }


    if (
        !allProducts.length
    ) {

        return;

    }


    let message =
        `${count} product${
            count === 1
                ? ""
                : "s"
        } shown`;


    if (
        currentStoreFilter !==
        "all"
    ) {

        message +=
            ` • ${currentStoreFilter}`;

    }


    if (
        currentSort ===
        "cheapest"
    ) {

        message +=
            " • Price: Low to High";

    }


    if (
        currentSort ===
        "expensive"
    ) {

        message +=
            " • Price: High to Low";

    }


    if (
        currentSort ===
        "az"
    ) {

        message +=
            " • A–Z";

    }


    if (
        currentSort ===
        "za"
    ) {

        message +=
            " • Z–A";

    }


    searchStatus.textContent =
        message;

}


// ======================================================
// PRODUCT NAME
// ======================================================

function getProductName(
    product
) {

    return (
        product.name ||
        product.title ||
        product.productName ||
        product.description ||
        "Unknown Product"
    );

}


// ======================================================
// PRODUCT PRICE DISPLAY
// ======================================================

function getProductPrice(
    product
) {

    const numeric =
        getNumericProductPrice(
            product
        );


    if (
        numeric > 0
    ) {

        return (
            `R${numeric.toFixed(2)}`
        );

    }


    return "Price unavailable";

}


// ======================================================
// NUMERIC PRODUCT PRICE
// ======================================================

function getNumericProductPrice(
    product
) {

    if (!product) {

        return 0;

    }


    // ==================================================
    // DIRECT PRICE VALUES
    // ==================================================

    const values = [

        product.price,

        product.sellingPrice,

        product.currentPrice,

        product.salePrice,

        product.formattedPrice,

        product.displayPrice,

        product.regularPrice,

        product.originalPrice,

        product.productPrice,

        product.amount

    ];


    for (
        const value of values
    ) {

        const number =
            numberFromValue(
                value
            );


        if (
            number !== null &&
            number > 0
        ) {

            return number;

        }

    }


    // ==================================================
    // NESTED PRICE OBJECT
    // ==================================================

    if (
        product.price &&
        typeof product.price ===
            "object"
    ) {

        const nested = [

            product.price.value,

            product.price.amount,

            product.price.current,

            product.price.currentPrice

        ];


        for (
            const value of nested
        ) {

            const number =
                numberFromValue(
                    value
                );


            if (
                number !== null &&
                number > 0
            ) {

                return number;

            }

        }

    }


    return 0;

}


// ======================================================
// NUMBER PARSER
// ======================================================

function numberFromValue(
    value
) {

    if (
        typeof value ===
        "number"
    ) {

        return Number.isFinite(
            value
        )
            ? value
            : null;

    }


    if (
        typeof value ===
        "string"
    ) {

        let cleaned =
            value
                .replace(
                    /R/gi,
                    ""
                )
                .replace(
                    /\s/g,
                    ""
                )
                .trim();


        // South African / European decimal format:
        // 39,99 -> 39.99
        if (
            cleaned.includes(",") &&
            !cleaned.includes(".")
        ) {

            cleaned =
                cleaned.replace(
                    ",",
                    "."
                );

        } else {

            cleaned =
                cleaned.replace(
                    /,/g,
                    ""
                );

        }


        const match =
            cleaned.match(
                /-?\d+(?:\.\d+)?/
            );


        if (match) {

            const number =
                Number(
                    match[0]
                );


            if (
                Number.isFinite(
                    number
                )
            ) {

                return number;

            }

        }

    }


    return null;

}


// ======================================================
// PRODUCT IMAGE
// ======================================================

function getProductImage(
    product
) {

    if (!product) {

        return "";

    }


    // ==================================================
    // STANDARD IMAGE
    // ==================================================

    if (
        typeof product.image ===
            "string" &&
        product.image.trim()
    ) {

        return product.image.trim();

    }


    if (
        typeof product.image_url ===
            "string" &&
        product.image_url.trim()
    ) {

        return product.image_url.trim();

    }


    if (
        typeof product.imageUrl ===
            "string" &&
        product.imageUrl.trim()
    ) {

        return product.imageUrl.trim();

    }


    if (
        typeof product.imageURL ===
            "string" &&
        product.imageURL.trim()
    ) {

        return product.imageURL.trim();

    }


    if (
        typeof product.thumbnail ===
            "string" &&
        product.thumbnail.trim()
    ) {

        return product.thumbnail.trim();

    }


    // ==================================================
    // CHECKERS IMAGE IDS
    // ==================================================

    if (
        Array.isArray(
            product.imageIds
        )
    ) {

        const imageId =
            product.imageIds.find(
                function (id) {

                    return (
                        typeof id ===
                            "string" &&
                        id.trim()
                    );

                }
            );


        if (imageId) {

            return (
                "https://catalog.sixty60.co.za/v2/files/" +
                encodeURIComponent(
                    imageId
                )
            );

        }

    }


    // ==================================================
    // IMAGES ARRAY
    // ==================================================

    if (
        Array.isArray(
            product.images
        )
    ) {

        const productImage =
            product.images.find(
                function (image) {

                    return (
                        image &&
                        typeof image === "object" &&
                        image.format === "product" &&
                        image.url
                    );

                }
            );


        if (productImage) {

            return productImage.url;

        }


        const listingImage =
            product.images.find(
                function (image) {

                    return (
                        image &&
                        typeof image === "object" &&
                        image.format === "listing" &&
                        image.url
                    );

                }
            );


        if (listingImage) {

            return listingImage.url;

        }


        const stringImage =
            product.images.find(
                function (image) {

                    return (
                        typeof image ===
                            "string" &&
                        image.trim()
                    );

                }
            );


        if (stringImage) {

            return stringImage;

        }


        const objectImage =
            product.images.find(
                function (image) {

                    return (
                        image &&
                        typeof image === "object" &&
                        image.url
                    );

                }
            );


        if (objectImage) {

            return objectImage.url;

        }

    }


    return "";

}


// ======================================================
// DESCRIPTION
// ======================================================

function getProductDescription(
    product
) {

    return (
        product.description ||
        product.shortDescription ||
        ""
    );

}


// ======================================================
// PROMOTION
// ======================================================

function getPromotion(
    product
) {

    if (
        product.promotion
    ) {

        if (
            typeof product.promotion ===
            "string"
        ) {

            return product.promotion;

        }


        return "Special promotion";

    }


    if (
        product.isOnPromotion
    ) {

        return "Special promotion";

    }


    if (
        product.on_sale
    ) {

        return (
            product.promo_label ||
            "On Sale"
        );

    }


    if (
        product.promo_label
    ) {

        return String(
            product.promo_label
        );

    }


    if (
        product.promo
    ) {

        return String(
            product.promo
        );

    }


    return "";

}


// ======================================================
// ADD PRODUCT MODAL
// ======================================================

function openAddProductModal(
    product,
    price,
    store
) {

    const oldModal =
        document.getElementById(
            "catalogue_add_modal"
        );


    if (oldModal) {

        oldModal.remove();

    }


    const name =
        getProductName(
            product
        );


    const storeName =
        normaliseStoreName(
            store
        );


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "catalogue_add_modal";


    modal.className =
        "catalogue-modal-overlay";


    modal.innerHTML = `

        <div
            class="catalogue-add-modal"
            role="dialog"
            aria-modal="true"
        >

            <button
                type="button"
                class="catalogue-modal-close"
                id="catalogue_modal_close"
            >
                ×
            </button>


            <div class="catalogue-modal-icon">
                🛒
            </div>


            <div class="catalogue-modal-header">

                <span class="catalogue-modal-label">
                    ADD TO SHOPPING LIST
                </span>


                <h2>
                    ${escapeHtml(name)}
                </h2>


                <div class="catalogue-modal-price">

                    ${
                        price > 0
                            ? `R${price.toFixed(2)}`
                            : "Price unavailable"
                    }

                </div>


                <div class="catalogue-modal-store">

                    ${createStoreLogo(
                        storeName,
                        "catalogue-modal-store-logo"
                    )}

                    <span>
                        ${escapeHtml(
                            storeName
                        )}
                    </span>

                </div>

            </div>


            <div class="catalogue-modal-form">

                <div class="catalogue-modal-field">

                    <label>
                        Shopping List
                    </label>


                    <select
                        id="catalogue_list_select"
                    >

                        <option value="">
                            Select a shopping list...
                        </option>

                    </select>

                </div>


                <div class="catalogue-modal-field">

                    <label>
                        Quantity
                    </label>


                    <div class="catalogue-quantity-control">

                        <button
                            type="button"
                            id="catalogue_quantity_minus"
                        >
                            −
                        </button>


                        <input
                            type="number"
                            id="catalogue_quantity_input"
                            value="1"
                            min="1"
                            step="1"
                        >


                        <button
                            type="button"
                            id="catalogue_quantity_plus"
                        >
                            +
                        </button>

                    </div>

                </div>


                <div
                    class="catalogue-modal-summary"
                >

                    <span>
                        Estimated cost
                    </span>


                    <strong>

                        ${
                            price > 0
                                ? `R${price.toFixed(2)}`
                                : "Price unavailable"
                        }

                    </strong>

                </div>


                <div
                    id="catalogue_modal_message"
                    class="catalogue-modal-message"
                ></div>


                <div class="catalogue-modal-actions">

                    <button
                        type="button"
                        class="catalogue-modal-cancel"
                        id="catalogue_modal_cancel"
                    >
                        Cancel
                    </button>


                    <button
                        type="button"
                        class="catalogue-modal-add"
                        id="catalogue_modal_add"
                    >
                        Add to List
                    </button>

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    populateModalLists(
        modal
    );


    setupModalControls(
        modal,
        product,
        price,
        store
    );


    requestAnimationFrame(
        function () {

            modal.classList.add(
                "catalogue-modal-visible"
            );

        }
    );

}


// ======================================================
// POPULATE SHOPPING LISTS
// ======================================================

function populateModalLists(
    modal
) {

    const select =
        modal.querySelector(
            "#catalogue_list_select"
        );


    if (!select) {

        return;

    }


    if (!currentUser) {

        select.innerHTML = `

            <option value="">
                Please sign in first
            </option>

        `;


        select.disabled =
            true;


        return;

    }


    if (
        shoppingLists.length === 0
    ) {

        select.innerHTML = `

            <option value="">
                No saved shopping lists
            </option>

        `;


        select.disabled =
            true;


        return;

    }


    select.innerHTML = `

        <option value="">
            Select a shopping list...
        </option>

    `;


    shoppingLists.forEach(
        function (list) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                list.id;


            option.textContent =
                list.name;


            if (
                list.id ===
                selectedListId
            ) {

                option.selected =
                    true;

            }


            select.appendChild(
                option
            );

        }
    );


    select.disabled =
        false;

}


// ======================================================
// MODAL CONTROLS
// ======================================================

function setupModalControls(
    modal,
    product,
    price,
    store
) {

    const quantityInput =
        modal.querySelector(
            "#catalogue_quantity_input"
        );


    const minusButton =
        modal.querySelector(
            "#catalogue_quantity_minus"
        );


    const plusButton =
        modal.querySelector(
            "#catalogue_quantity_plus"
        );


    const summary =
        modal.querySelector(
            ".catalogue-modal-summary strong"
        );


    const listSelect =
        modal.querySelector(
            "#catalogue_list_select"
        );


    const addButton =
        modal.querySelector(
            "#catalogue_modal_add"
        );


    const closeButton =
        modal.querySelector(
            "#catalogue_modal_close"
        );


    const cancelButton =
        modal.querySelector(
            "#catalogue_modal_cancel"
        );


    function updateSummary() {

        let quantity =
            parseInt(
                quantityInput.value,
                10
            );


        if (
            isNaN(quantity) ||
            quantity < 1
        ) {

            quantity =
                1;


            quantityInput.value =
                "1";

        }


        summary.textContent =
            price > 0
                ? `R${(
                    price *
                    quantity
                ).toFixed(2)}`
                : "Price unavailable";

    }


    if (minusButton) {

        minusButton.addEventListener(
            "click",
            function () {

                let quantity =
                    parseInt(
                        quantityInput.value,
                        10
                    ) || 1;


                if (
                    quantity > 1
                ) {

                    quantity--;

                }


                quantityInput.value =
                    quantity;


                updateSummary();

            }
        );

    }


    if (plusButton) {

        plusButton.addEventListener(
            "click",
            function () {

                let quantity =
                    parseInt(
                        quantityInput.value,
                        10
                    ) || 1;


                quantity++;


                quantityInput.value =
                    quantity;


                updateSummary();

            }
        );

    }


    if (quantityInput) {

        quantityInput.addEventListener(
            "input",
            updateSummary
        );

    }


    if (listSelect) {

        listSelect.addEventListener(
            "change",
            function () {

                selectedListId =
                    listSelect.value;


                if (
                    selectedListId
                ) {

                    localStorage.setItem(
                        "shopmocha_active_list_id",
                        selectedListId
                    );

                }

            }
        );

    }


    if (addButton) {

        addButton.addEventListener(
            "click",
            async function () {

                if (!currentUser) {

                    showModalMessage(
                        modal,
                        "Please sign in before adding a product.",
                        "error"
                    );


                    return;

                }


                const listId =
                    listSelect
                        ? listSelect.value
                        : "";


                if (!listId) {

                    showModalMessage(
                        modal,
                        "Please choose a shopping list.",
                        "error"
                    );


                    return;

                }


                let quantity =
                    parseInt(
                        quantityInput.value,
                        10
                    );


                if (
                    isNaN(quantity) ||
                    quantity < 1
                ) {

                    quantity =
                        1;

                }


                await addProductToShoppingList(
                    product,
                    quantity,
                    listId,
                    store,
                    modal
                );

            }
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            function () {

                closeCatalogueModal(
                    modal
                );

            }
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            function () {

                closeCatalogueModal(
                    modal
                );

            }
        );

    }


    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                modal
            ) {

                closeCatalogueModal(
                    modal
                );

            }

        }
    );


    updateSummary();

}


// ======================================================
// ADD PRODUCT TO FIRESTORE
// ======================================================

async function addProductToShoppingList(
    product,
    quantity,
    listId,
    store,
    modal
) {

    if (!currentUser) {

        showModalMessage(
            modal,
            "Please sign in before adding products.",
            "error"
        );


        return;

    }


    const name =
        getProductName(
            product
        );


    const price =
        getNumericProductPrice(
            product
        );


    const image =
        getProductImage(
            product
        );


    const productId =
        product.id ||
        product.productId ||
        product.product_id ||
        product.code ||
        product.sku ||
        null;


    const productToAdd = {

        title:
            name,

        name:
            name,

        description:
            getProductDescription(
                product
            ) ||
            `${normaliseStoreName(store)} product`,

        quantity:
            Number(quantity) > 0
                ? Number(quantity)
                : 1,

        price:
            price,

        store:
            normaliseStoreName(
                store
            ),

        image:
            image,

        productId:
            productId

    };


    try {

        const listReference =
            doc(
                db,
                "shoppingLists",
                listId
            );


        const listSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "shoppingLists"
                    ),
                    where(
                        "__name__",
                        "==",
                        listId
                    ),
                    where(
                        "userId",
                        "==",
                        currentUser.uid
                    )
                )
            );


        if (
            listSnapshot.empty
        ) {

            throw new Error(
                "Shopping list could not be found."
            );

        }


        await updateDoc(
            listReference,
            {

                items:
                    arrayUnion(
                        productToAdd
                    ),

                updatedAt:
                    serverTimestamp()

            }
        );


        selectedListId =
            listId;


        localStorage.setItem(
            "shopmocha_active_list_id",
            listId
        );


        showCatalogueSuccessMessage(
            `${productToAdd.quantity} × ${name} added to your shopping list.`
        );


        closeCatalogueModal(
            modal
        );

    }

    catch (error) {

        console.error(
            "Could not add catalogue product:",
            error
        );


        showModalMessage(
            modal,
            "Could not add the product to your shopping list. " +
            error.message,
            "error"
        );

    }

}


// ======================================================
// CLOSE MODAL
// ======================================================

function closeCatalogueModal(
    modal
) {

    if (!modal) {

        return;

    }


    modal.classList.remove(
        "catalogue-modal-visible"
    );


    setTimeout(
        function () {

            if (
                modal.parentNode
            ) {

                modal.remove();

            }

        },
        200
    );

}


// ======================================================
// MODAL MESSAGE
// ======================================================

function showModalMessage(
    modal,
    message,
    type = "warning"
) {

    const element =
        modal.querySelector(
            "#catalogue_modal_message"
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.className =
        `catalogue-modal-message ${type}`;

}


// ======================================================
// SUCCESS MESSAGE
// ======================================================

function showCatalogueSuccessMessage(
    message
) {

    let messageBox =
        document.getElementById(
            "catalogue_success_message"
        );


    if (!messageBox) {

        messageBox =
            document.createElement(
                "div"
            );


        messageBox.id =
            "catalogue_success_message";


        messageBox.className =
            "catalogue-success-message";


        document.body.appendChild(
            messageBox
        );

    }


    messageBox.textContent =
        "✓ " + message;


    messageBox.classList.add(
        "show"
    );


    setTimeout(
        function () {

            messageBox.classList.remove(
                "show"
            );

        },
        3000
    );

}


// ======================================================
// SECURITY
// ======================================================

function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(
            value ?? ""
        );


    return div.innerHTML;

}


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    )
    .replace(
        /"/g,
        "&quot;"
    );

}


// ======================================================
// START
// ======================================================

initialiseCatalogue();