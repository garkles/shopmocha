# Basketly

[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-Backend-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Firebase](https://img.shields.io/badge/Firebase-Authentication%20%26%20Database-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Status](https://img.shields.io/badge/Status-In%20Development-orange?style=flat-square)]()

Basketly is a grocery shopping and price-comparison web application designed to help users search for products across multiple South African retailers, compare prices, evaluate price-per-unit values, and build shopping lists.

The application uses a JavaScript frontend, a Node.js and Express backend, Firebase for authentication and data persistence, and retailer product data provided through external APIs.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Application Architecture](#application-architecture)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Product Data Model](#product-data-model)
- [Price Comparison](#price-comparison)
- [Authentication and Data](#authentication-and-data)
- [Testing](#testing)
- [Security](#security)
- [Roadmap](#roadmap)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Grocery prices can vary considerably between retailers, while different package sizes can make direct price comparisons difficult.

Basketly addresses this by bringing product information from multiple retailers into a single interface. Product data is normalized by the backend so that the frontend can display products consistently and calculate comparable price-per-unit values.

Current retailer integrations include:

- Pick n Pay
- Woolworths
- Checkers

The long-term objective is to allow users to optimize an entire shopping basket rather than comparing individual products manually.

---

## Features

### Multi-Retailer Product Search

Search for products across multiple supported South African grocery retailers from a single interface.

### Product Catalogue

Browse products using a unified catalogue containing:

- Product names
- Prices
- Product images
- Retailer information
- Product categories
- Availability information
- Package sizes
- Price-per-unit values

### Price Comparison

Basketly identifies the lowest available product price returned by the supported retailer integrations.

### Price-Per-Unit Comparison

Products can be compared using normalized package quantities. This makes it easier to determine the relative value of products with different package sizes.

For example:

```text
Product A
1 L
R17.99
R17.99/L

Product B
2 L
R29.99
R14.99/L
```

Although Product B has the higher total price, it provides the lower price per litre.

### Retailer Filtering

The catalogue is designed to allow users to restrict results to a specific retailer.

### Product Sorting

The catalogue supports sorting and comparison based on product attributes such as:

- Price
- Price per unit
- Product name
- Relevance

### Shopping Lists

Users can add products to shopping lists and manage quantities.

### User Authentication

Firebase Authentication provides account functionality for users.

### Saved Shopping Lists

Firestore is used to persist shopping lists so that authenticated users can access their saved lists.

### Responsive Web Interface

The application is built as a browser-based web application using HTML, CSS and JavaScript.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Interface styling |
| JavaScript | Frontend application logic |
| Node.js | Backend runtime |
| Express.js | REST API server |
| Firebase Authentication | User authentication |
| Firebase Firestore | Persistent shopping-list data |
| External Retailer APIs | Product and pricing data |
| Git | Version control |
| GitHub | Source-code hosting |

---

## Application Architecture

Basketly follows a frontend/backend architecture.

```text
+-----------------------------+
|        Basketly Frontend    |
|                             |
| Search | Catalogue | Lists  |
| Filters | Sorting | Auth    |
+-------------+---------------+
              |
              | HTTP Requests
              v
+-----------------------------+
|       Express Backend       |
|                             |
| /api/products               |
| /api/pnp                    |
| /api/checkers               |
| /api/woolworths             |
+-------------+---------------+
              |
       +------+-------+-------+
       |              |       |
       v              v       v
   Pick n Pay     Woolworths Checkers
       |              |       |
       +--------------+-------+
                      |
                      v
              Product Normalization
                      |
                      v
              Price Calculations
                      |
                      v
              Frontend Response
```

The backend acts as an abstraction layer between the frontend and retailer-specific APIs. This allows retailer-specific response formats to be converted into a common product structure before being returned to the client.

---

## Project Structure

A simplified project structure is shown below:

```text
Basketly/
|
+-- server/
|   +-- server.js
|   +-- products.js
|   +-- pnp.js
|   +-- woolworths.js
|   +-- checkers.js
|
+-- css/
|   +-- auth.css
|   +-- catalogue.css
|   +-- ...
|
+-- js/
|   +-- catalogue.js
|   +-- firebase.js
|   +-- navbar.js
|   +-- ...
|
+-- images/
|   +-- stores/
|       +-- pnp-logo.png
|       +-- woolworths-logo.png
|       +-- checkers-logo.png
|
+-- index.html
+-- login.html
+-- register.html
+-- dashboard.html
+-- catalogue.html
|
+-- .env
+-- .gitignore
+-- package.json
+-- README.md
```

---

## Installation

### Prerequisites

Before installing Basketly, ensure the following are available:

- Node.js
- npm
- A Firebase project
- Required external API credentials
- Git

### Clone the Repository

```bash
git clone https://github.com/garkles/shopmocha.git
cd basketly
```

### Install Dependencies

```bash
npm install
```

---

## Configuration

Basketly uses environment variables for private API credentials.

Create a `.env` file in the project root:

```env
PARSE_API_KEY=your_parse_api_key
```

Do not commit the `.env` file to source control.

The `.gitignore` file should contain:

```gitignore
.env
.env.local
node_modules/
```

Firebase configuration should also be managed appropriately and should not expose private server-side credentials.

---

## Running the Application

Start the Express server with:

```bash
node server/server.js
```

The application is served locally at:

```text
http://localhost:3000
```

The backend serves the frontend and exposes the application API routes.

---

# API Documentation

## API Overview

Basketly provides a unified product-search endpoint as well as retailer-specific endpoints.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/products/search` | GET | Search across supported retailers |
| `/api/pnp/...` | GET | Pick n Pay integration |
| `/api/checkers/...` | GET | Checkers integration |
| `/api/woolworths/...` | GET | Woolworths integration |

The exact retailer-specific routes may evolve as the integrations are developed.

---

## Combined Product Search

### Endpoint

```http
GET /api/products/search
```

### Query Parameters

| Parameter | Required | Description |
|---|---|---|
| `q` | Yes | Product search query |

### Example Request

```http
GET /api/products/search?q=milk
```

### Example Response

```json
{
  "query": "milk",
  "count": 3,
  "stores": {
    "Pick n Pay": 1,
    "Woolworths": 1,
    "Checkers": 1
  },
  "cheapest": {
    "name": "Full Cream Milk 1L",
    "price": 17.99,
    "store": "Pick n Pay"
  },
  "cheapestPerUnit": {
    "name": "Full Cream Milk 2L",
    "price": 29.99,
    "pricePerUnit": "R14.99/L",
    "store": "Checkers"
  },
  "products": []
}
```

The actual number of products and values depend on the retailer API responses at the time of the request.

---

## Pick n Pay Integration

Pick n Pay product data is accessed through the backend integration.

The integration can provide information including:

- Product ID
- Product code
- Product name
- Price
- Product images
- Product categories
- Availability
- Stock status
- Quantity information

The frontend does not need to understand the original Pick n Pay API response structure.

---

## Woolworths Integration

The Woolworths integration provides product information including:

- Product ID
- Product name
- Product URL
- Price
- Promotional information
- Sale status
- Review information
- Price-per-weight information where available

The backend converts the retailer response into Basketly's normalized product representation.

---

## Checkers Integration

The Checkers integration provides product information including:

- Product ID
- Product name
- Price
- Product images
- Product availability
- Store information
- Product categories
- Quantity and package information where available

---

# Product Data Model

Basketly normalizes retailer-specific responses into a common product representation.

Example:

```json
{
  "id": "12345",
  "name": "Full Cream Milk 2L",
  "price": 29.99,
  "formattedPrice": "R29.99",
  "currency": "ZAR",
  "image": "https://example.com/product.jpg",
  "available": true,
  "stockStatus": "inStock",
  "categories": [],
  "store": "Checkers",
  "size": "2L",
  "sizeValue": 2,
  "sizeUnit": "L",
  "pricePerUnit": "R14.99/L",
  "pricePerUnitValue": 14.99,
  "pricePerUnitLabel": "L"
}
```

This normalization layer allows the frontend to use one consistent data structure regardless of the original retailer response.

---

# Price Comparison

Basketly distinguishes between total product price and price per unit.

### Total Price

The total price represents the listed price of the product or package.

### Price Per Unit

Price per unit is calculated using the product's normalized package quantity.

Example:

```text
Product:
2 L

Price:
R29.99

Calculation:
R29.99 / 2

Result:
R14.995/L
```

The displayed value may be rounded for presentation.

This approach helps users compare products with different package sizes more accurately.

---

# Shopping List

Shopping lists are associated with authenticated users.

A shopping-list item can contain information such as:

```json
{
  "name": "Milk",
  "price": 29.99,
  "quantity": 2,
  "is_done": false
}
```

The shopping-list total is based on:

```text
item price × quantity
```

Completed items can be visually distinguished from active items while remaining part of the saved list.

---

# Authentication and Data

Firebase is used for authentication and persistent user data.

The intended data flow is:

```text
User
 |
 v
Firebase Authentication
 |
 v
Authenticated User
 |
 v
Firestore
 |
 +-- Shopping Lists
      |
      +-- Items
      +-- Quantities
      +-- Prices
      +-- Completion State
```

Firestore security rules should ensure that users can only access their own private shopping-list data.

---

# Testing

Basketly includes behaviour-driven development testing for core shopping-list functionality.

Tests cover areas such as:

- Creating shopping-list items
- Rendering item names
- Creating shopping lists
- Adding items to lists
- Rendering list items
- Adding an item through the browser
- Checking and unchecking items
- Removing items

Tests should be expanded as new backend and frontend functionality is introduced.

---

# Security

Security is an important part of the application because Basketly interacts with external APIs and user accounts.

### API Credentials

Private API credentials must remain server-side.

Never place credentials such as:

```text
PARSE_API_KEY
```

directly inside frontend JavaScript.

### Environment Variables

Use `.env` for local development and ensure it is excluded from Git.

### Firebase

Firestore security rules should restrict users to their own shopping-list data.

### External APIs

Retailer API requests should be routed through the backend where credentials are required. This prevents exposing private API keys to users through browser requests.

---

# Roadmap

The roadmap is organized around progressively developing Basketly from a product-search application into a complete grocery-shopping assistant.

## Phase 1 — Core Product Aggregation

Status: Completed

- [x] Pick n Pay product integration
- [x] Woolworths product integration
- [x] Checkers product integration
- [x] Unified product search
- [x] Product normalization
- [x] Product pricing
- [x] Product availability information
- [x] Product images where available
- [x] Package-size extraction
- [x] Price-per-unit calculation
- [x] Cheapest-product identification
- [x] Cheapest-per-unit identification

---

## Phase 2 — Catalogue Experience

Status: Completed

- [x] Product catalogue
- [x] Search interface
- [x] Reliable retailer filtering
- [x] Category filtering
- [x] Price sorting
- [x] Price-per-unit sorting
- [x] Name sorting
- [x] Relevance sorting
- [x] Improved product-card design
- [x] Improved loading states
- [x] Improved error handling
- [x] Empty-result states
- [x] Mobile optimization

---

## Phase 3 — Shopping Basket

Status: Completed/in progress

- [x] Add products directly from catalogue
- [x] Remove products
- [x] Increase and decrease quantities
- [x] Calculate item subtotals
- [x] Calculate basket total
- [x] Persist basket state
- [x] Compare basket totals between retailers
- [ ] Display estimated savings

---

## Phase 4 — Cross-Store Optimization

Status: Completed/ in progress

- [x] Match equivalent products across retailers
- [x] Compare package sizes
- [x] Compare price per unit
- [x] Identify cheapest retailer for each item
- [ ] Calculate total savings
- [x] Optimize an entire shopping list
- [x] Recommend a single-store basket
- [x] Recommend a multi-store basket when savings justify it

Example target experience:

```text
Shopping List
------------------------------------------------
Milk                  Checkers       R29.99
Bread                 Pick n Pay     R18.99
Eggs                  Checkers       R39.99
Chicken               Pick n Pay     R74.99
------------------------------------------------
Optimized Basket                     R163.96

Alternative single-store basket     R181.97
Estimated saving                     R18.01
```

---

## Phase 5 — User Accounts and Personalization

Status: In Progress / Planned

- [x] User registration
- [x] User login
- [x] Firebase authentication
- [x] Saved shopping lists
- [x] Rename saved lists
- [x] Delete saved lists
- [ ] Shopping-list history
- [x] Favourite products
- [x] Recently viewed products
- [x] Personal shopping preferences

---

## Phase 6 — Price Intelligence

Status: Future additions

- [ ] Price history
- [ ] Price-change tracking
- [ ] Price-drop detection
- [x] Promotion tracking
- [ ] Sale notifications
- [ ] Historical price comparison
- [x] Savings recommendations

---

## Phase 7 — Store Discovery

Status: Future additions

- [ ] Nearby-store search
- [ ] Store availability
- [ ] Store distance
- [ ] Store opening hours
- [ ] Map integration
- [ ] Multi-store route planning

---

## Phase 8 — Advanced Basket Intelligence

Status: Future

- [ ] Budget-based shopping
- [ ] Automatic basket optimization
- [ ] Product substitution recommendations
- [ ] Dietary and preference-based filtering
- [ ] Recurring shopping lists
- [ ] Smart replenishment suggestions
- [ ] Personalized price alerts

---

# Known Limitations

The current version has several limitations that are expected to be addressed during development.

### Retailer API Availability

External retailer data depends on the availability and response structure of third-party API integrations.

### Product Matching

Products from different retailers may use different names, package descriptions and identifiers. Reliable cross-retailer product matching therefore requires additional normalization and matching logic.

### Image Availability

Product image availability differs between retailer integrations. Some retailer responses provide direct image URLs while others may require additional processing.

### Price Volatility

Retailer prices can change over time. Prices displayed by Basketly should therefore be considered time-sensitive rather than permanent.

### API Limits

External API services may impose rate limits, usage limits or credit restrictions.

---

# Contributing

Contributions are welcome as the project develops.

## Development Workflow

1. Fork the repository.
2. Create a feature branch.
3. Implement the change.
4. Test the change locally.
5. Commit the changes with a descriptive message.
6. Push the branch.
7. Open a Pull Request.

Example:

```bash
git checkout -b feature/product-comparison
git add .
git commit -m "Add product comparison functionality"
git push origin feature/product-comparison
```

Pull Requests should clearly describe:

- What was changed
- Why the change was necessary
- How the change was tested
- Any known limitations or follow-up work

---

# License

A public open-source license has not yet been specified for Basketly.

If the project is released as open source, an appropriate license should be added to the repository.

---

# Project Status

Basketly is currently under active development.

The core product aggregation functionality supports Pick n Pay, Woolworths and Checkers, with the backend providing a normalized interface for product information and pricing.

The next major development priorities are improving catalogue filtering and sorting, expanding shopping-list functionality, and developing cross-store basket optimization.

---

## Future Vision

The long-term objective of Basketly is to provide a complete grocery-shopping decision platform.

Instead of requiring users to manually compare individual products across retailers, Basketly should eventually be able to take an entire shopping list and determine the most cost-effective purchasing strategy.

```text
                  Shopping List
                       |
                       v
                  Basketly
                       |
          +------------+------------+
          |            |            |
          v            v            v
       Pick n Pay   Woolworths   Checkers
          |            |            |
          +------------+------------+
                       |
                       v
              Product Matching
                       |
                       v
              Price Comparison
                       |
                       v
             Basket Optimization
                       |
                       v
              Recommended Basket
                       |
                       v
                 Total Savings
```

The goal is to make grocery price comparison faster, clearer and more practical for everyday shoppers.

---

## Author

**Garcia Ah Shene**

Basketly is a full-stack grocery price comparison and shopping-list application developed using JavaScript, Node.js, Express and Firebase.

---

<p align="center">
  Basketly
  <br>
  <strong>Compare prices. Build smarter baskets.</strong>
</p>
