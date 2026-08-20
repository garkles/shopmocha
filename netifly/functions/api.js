const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");

const checkersRouter =
    require("../../server/checkers");

const pnpRouter =
    require("../../server/pnp");

const woolworthsRouter =
    require("../../server/woolworths");

const productsRouter =
    require("../../server/products");


const app =
    express();


/* ==========================================
   MIDDLEWARE
   ========================================== */

app.use(
    cors()
);

app.use(
    express.json()
);


/* ==========================================
   API ROUTES
   ========================================== */

app.use(
    "/api/checkers",
    checkersRouter
);

app.use(
    "/api/pnp",
    pnpRouter
);

app.use(
    "/api/woolworths",
    woolworthsRouter
);

app.use(
    "/api/products",
    productsRouter
);


/* ==========================================
   NETLIFY FUNCTION
   ========================================== */

module.exports.handler =
    serverless(app);