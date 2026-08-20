// ==========================================
// SHOPPING LIST
// ==========================================

import {
    ShoppingListItem
} from "./shopping_list_item.js";


export class ShoppingList {

    constructor(items = []) {

        this.items = [];


        if (
            Array.isArray(items)
        ) {

            items.forEach(
                item => {

                    if (
                        item instanceof ShoppingListItem
                    ) {

                        this.items.push(
                            item
                        );

                    } else {

                        this.items.push(
                            new ShoppingListItem(
                                item.title ||
                                item.name ||
                                "",
                                item.description ||
                                "",
                                item.quantity ||
                                1,
                                item.price ||
                                0,
                                item.store ||
                                "",
                                item.image ||
                                "",
                                item.productId ||
                                null
                            )
                        );

                    }

                }
            );

        }

    }


    // ==========================================
    // ADD ITEM
    // ==========================================

    addItem(item) {

        if (
            !(item instanceof ShoppingListItem)
        ) {

            throw new Error(
                "addItem requires a ShoppingListItem."
            );

        }


        this.items.push(
            item
        );

    }


    // ==========================================
    // REMOVE ITEM
    // ==========================================

    removeItem(item) {

        if (
            typeof item === "undefined"
        ) {

            if (
                this.items.length > 0
            ) {

                this.items.pop();

            }

            return;

        }


        if (
            typeof item === "number"
        ) {

            if (
                item >= 0 &&
                item < this.items.length
            ) {

                this.items.splice(
                    item,
                    1
                );

            }

            return;

        }


        if (
            !(item instanceof ShoppingListItem)
        ) {

            throw new Error(
                "removeItem requires a ShoppingListItem or index."
            );

        }


        const index =
            this.items.indexOf(
                item
            );


        if (
            index === -1
        ) {

            throw new Error(
                "ShoppingListItem does not exist in this list."
            );

        }


        this.items.splice(
            index,
            1
        );

    }


    // ==========================================
    // TOTAL
    // ==========================================

    getTotal() {

        return this.items.reduce(
            function (
                total,
                item
            ) {

                return (
                    total +
                    (
                        Number(item.price) || 0
                    ) *
                    (
                        Number(item.quantity) || 1
                    )
                );

            },
            0
        );

    }


    // ==========================================
    // RENDER
    // ==========================================

    render() {

        let output =
            "<ul>";


        this.items.forEach(
            function (
                item,
                index
            ) {

                output +=
                    item.render(
                        index
                    );

            }
        );


        output +=
            "</ul>";


        return output;

    }

}