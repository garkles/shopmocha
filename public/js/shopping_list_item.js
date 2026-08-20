/* ==========================================
   SHOPPING LIST ITEM
   ========================================== */

export class ShoppingListItem {

    constructor(
        title = "",
        description = "",
        quantity = 1,
        price = 0,
        store = "",
        image = "",
        productId = null
    ) {

        this.title =
            String(
                title || "Unnamed Item"
            );

        this.description =
            String(
                description || ""
            );

        this.quantity =
            Number(quantity) > 0
                ? Number(quantity)
                : 1;

        this.price =
            Number(price) >= 0
                ? Number(price)
                : 0;

        this.store =
            String(
                store || ""
            );

        this.image =
            String(
                image || ""
            );

        this.productId =
            productId || null;
    }


    /* ==========================================
       TOTAL
    ========================================== */

    getTotal() {

        return (
            this.price *
            this.quantity
        );

    }


    /* ==========================================
       RENDER
    ========================================== */

    render(index) {

        const total =
            this.getTotal();


        // Automatically generated descriptions such as:
        // "Pick n Pay product"
        // "Checkers product"
        // "Woolworths product"
        // are unnecessary because the store is already
        // displayed separately.

        const cleanedDescription =
            this.description &&
            this.store &&
            this.description.trim().toLowerCase() ===
                `${this.store.trim().toLowerCase()} product`
                ? ""
                : this.description;


        return `

            <li
                class="shopping-list-item"
                data-index="${index}"
            >

                <div class="shopping-item-info">

                    ${
                        this.image
                        ?
                        `

                        <img
                            class="shopping-item-image"
                            src="${escapeAttribute(this.image)}"
                            alt="${escapeAttribute(this.title)}"
                            loading="lazy"
                        >

                        `
                        :
                        ""
                    }


                    <div>

                        <h3 class="shopping-item-name">

                            ${escapeHtml(this.title)}

                        </h3>


                        ${
                            cleanedDescription
                            ?
                            `

                            <p class="shopping-item-description">

                                ${escapeHtml(
                                    cleanedDescription
                                )}

                            </p>

                            `
                            :
                            ""
                        }


                        ${
                            this.store
                            ?
                            `

                            <span class="shopping-item-store">

                                ${escapeHtml(this.store)}

                            </span>

                            `
                            :
                            ""
                        }

                    </div>

                </div>


                <div class="shopping-item-details">

                    <span>

                        Qty: ${this.quantity}

                    </span>


                    <span>

                        R${this.price.toFixed(2)}

                    </span>


                    <strong>

                        R${total.toFixed(2)}

                    </strong>

                </div>


                <button
                    type="button"
                    class="remove-shopping-item"
                    data-index="${index}"
                    aria-label="Remove ${escapeAttribute(this.title)}"
                >
                    🗑️
                </button>

            </li>

        `;

    }

}


/* ==========================================
   SECURITY HELPERS
========================================== */

function escapeHtml(value) {

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


function escapeAttribute(value) {

    return escapeHtml(
        value
    )
    .replace(
        /"/g,
        "&quot;"
    );

}