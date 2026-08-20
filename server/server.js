require("dotenv").config();

console.log(
    "Parse API key loaded:",
    Boolean(process.env.PARSE_API_KEY)
);


const express = require("express");
const cors = require("cors");
const path = require("path");


const app =
    express();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
    cors()
);

app.use(
    express.json()
);


// ==========================================
// CHECKERS API
// ==========================================

const checkersRouter =
    require("./checkers");


app.use(
    "/api/checkers",
    checkersRouter
);


// ==========================================
// PNP API
// ==========================================

const pnpRouter =
    require("./pnp");


app.use(
    "/api/pnp",
    pnpRouter
);


// ==========================================
// WOOLWORTHS API
// ==========================================

const woolworthsRouter =
    require("./woolworths");


app.use(
    "/api/woolworths",
    woolworthsRouter
);


// ==========================================
// COMBINED STORE API
// ==========================================

const productsRouter =
    require("./products");


app.use(
    "/api/products",
    productsRouter
);


// ==========================================
// SERVE SHOPMOCHA
// ==========================================

app.use(
    express.static(
        path.join(
            __dirname,
            ".."
        )
    )
);


// ==========================================
// START SERVER
// ==========================================

const PORT =
    3000;


app.listen(
    PORT,
    function () {

        console.log(
            `ShopMocha running at http://localhost:${PORT}`
        );

    }
);