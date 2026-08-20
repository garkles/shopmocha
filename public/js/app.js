// ==========================================
// SHOPMOCHA SHOPPING LIST APP
// ==========================================

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
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


import {
    ShoppingList
} from "./shopping_list.js";


import {
    ShoppingListItem
} from "./shopping_list_item.js";


// ==========================================
// DOM
// ==========================================

const content =
    document.getElementById(
        "content"
    );


const itemCount =
    document.getElementById(
        "item_count"
    );


const totalElement =
    document.getElementById(
        "shopping_list_total"
    );


const listNameElement =
    document.getElementById(
        "current_list_name"
    );


const titleInput =
    document.getElementById(
        "title"
    );


const descriptionInput =
    document.getElementById(
        "description"
    );


const quantityInput =
    document.getElementById(
        "quantity"
    );


const addButton =
    document.getElementById(
        "add_shopping_list_item_button"
    );


const saveButton =
    document.getElementById(
        "save_shopping_list_button"
    );


const renameButton =
    document.getElementById(
        "rename_list_button"
    );


const deleteButton =
    document.getElementById(
        "delete_list_button"
    );


// ==========================================
// STATE
// ==========================================

let currentUser =
    null;


let currentListId =
    null;


let currentListName =
    "New Shopping List";


let shoppingList =
    new ShoppingList();


let isExistingSavedList =
    false;


// ==========================================
// URL LIST ID
// ==========================================

const urlParameters =
    new URLSearchParams(
        window.location.search
    );


const urlListId =
    urlParameters.get(
        "listId"
    );


// ==========================================
// LOCAL STORAGE LIST ID
// ==========================================

// const storedListId =
//     localStorage.getItem(
//         "shopmocha_active_list_id"
//     );


// ==========================================
// AUTH
// ==========================================

onAuthStateChanged(
    auth,
    async function (user) {

        currentUser =
            user;


        if (!user) {

            currentListId =
                null;

            shoppingList =
                new ShoppingList();

            isExistingSavedList =
                false;

            currentListName =
                "New Shopping List";


            updateUI();

            return;

        }


        try {

            // Only load a saved list when the URL
            // explicitly contains ?listId=...
            //
            // Do NOT automatically restore the
            // last-used list from localStorage.

            if (urlListId) {

                const loaded =
                    await loadShoppingList(
                        urlListId
                    );


                if (loaded) {

                    updateUI();

                    return;

                }

            }


            // Normal index.html landing page.
            // Start with a completely new list.

            currentListId =
                null;

            isExistingSavedList =
                false;

            currentListName =
                "New Shopping List";

            shoppingList =
                new ShoppingList();


            updateUI();

        }

        catch (error) {

            console.error(
                "Could not initialise shopping list:",
                error
            );


            currentListId =
                null;

            isExistingSavedList =
                false;

            currentListName =
                "New Shopping List";

            shoppingList =
                new ShoppingList();


            updateUI();

        }

    }
);


// ==========================================
// LOAD SHOPPING LIST
// ==========================================

async function loadShoppingList(
    listId
) {

    if (!currentUser) {

        return false;

    }


    const listReference =
        doc(
            db,
            "shoppingLists",
            listId
        );


    const snapshot =
        await getDoc(
            listReference
        );


    if (!snapshot.exists()) {

        localStorage.removeItem(
            "shopmocha_active_list_id"
        );

        return false;

    }


    const data =
        snapshot.data();


    if (
        data.userId !==
        currentUser.uid
    ) {

        alert(
            "You do not have permission to open this shopping list."
        );

        return false;

    }


    currentListId =
        snapshot.id;


    currentListName =
        data.name ||
        "Shopping List";


    isExistingSavedList =
        true;


    shoppingList =
        new ShoppingList(
            Array.isArray(data.items)
                ? data.items
                : []
        );


    localStorage.setItem(
        "shopmocha_active_list_id",
        currentListId
    );


    return true;

}


// ==========================================
// ADD MANUAL ITEM
// ==========================================

if (addButton) {

    addButton.addEventListener(
        "click",
        async function () {

            const title =
                titleInput
                    ? titleInput.value.trim()
                    : "";


            const description =
                descriptionInput
                    ? descriptionInput.value.trim()
                    : "";


            let quantity =
                parseInt(
                    quantityInput
                        ? quantityInput.value
                        : "1",
                    10
                );


            if (!title) {

                alert(
                    "Please enter an item."
                );

                if (titleInput) {

                    titleInput.focus();

                }

                return;

            }


            if (
                isNaN(quantity) ||
                quantity < 1
            ) {

                quantity =
                    1;

            }


            const item =
                new ShoppingListItem(
                    title,
                    description,
                    quantity,
                    0,
                    "",
                    "",
                    null
                );


            shoppingList.addItem(
                item
            );


            clearManualInputs();

            updateUI();


            // If this is already a saved list,
            // immediately save the new item.

            if (
                currentListId &&
                currentUser
            ) {

                try {

                    await saveCurrentList();

                }

                catch (error) {

                    console.error(
                        error
                    );

                    alert(
                        "The item was added locally, but could not be saved to Firebase.\n\n" +
                        error.message
                    );

                }

            }

        }
    );

}


// ==========================================
// SAVE LIST
// ==========================================

if (saveButton) {

    saveButton.addEventListener(
        "click",
        async function () {

            await saveCurrentList();

        }
    );

}


// ==========================================
// SAVE CURRENT LIST
// ==========================================

async function saveCurrentList() {

    if (!currentUser) {

        alert(
            "Please sign in before saving a shopping list."
        );

        return;

    }


    try {

        saveButton.disabled =
            true;


        const items =
            shoppingList.items.map(
                function (item) {

                    return {

                        title:
                            item.title,

                        name:
                            item.title,

                        description:
                            item.description,

                        quantity:
                            Number(item.quantity) || 1,

                        price:
                            Number(item.price) || 0,

                        store:
                            item.store || "",

                        image:
                            item.image || "",

                        productId:
                            item.productId || null

                    };

                }
            );


        // ======================================
        // CREATE NEW LIST
        // ======================================

        if (!currentListId) {

            const listReference =
                await addDoc(
                    collection(
                        db,
                        "shoppingLists"
                    ),
                    {

                        userId:
                            currentUser.uid,

                        name:
                            currentListName,

                        items:
                            items,

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()

                    }
                );


            currentListId =
                listReference.id;


            isExistingSavedList =
                true;


            localStorage.setItem(
                "shopmocha_active_list_id",
                currentListId
            );


            // Update URL

            window.history.replaceState(
                {},
                "",
                `index.html?listId=${encodeURIComponent(
                    currentListId
                )}`
            );


            alert(
                "Shopping list saved successfully."
            );

        }

        // ======================================
        // UPDATE EXISTING LIST
        // ======================================

        else {

            const listReference =
                doc(
                    db,
                    "shoppingLists",
                    currentListId
                );


            await updateDoc(
                listReference,
                {

                    items:
                        items,

                    updatedAt:
                        serverTimestamp()

                }
            );


            alert(
                "Shopping list updated successfully."
            );

        }


        updateUI();

    }

    catch (error) {

        console.error(
            "Save shopping list error:",
            error
        );


        alert(
            "Could not save the shopping list.\n\n" +
            error.message
        );

    }

    finally {

        if (saveButton) {

            saveButton.disabled =
                false;

        }

    }

}


// ==========================================
// RENAME LIST
// ==========================================

if (renameButton) {

    renameButton.addEventListener(
        "click",
        async function () {

            if (!currentListId) {

                return;

            }


            const newName =
                prompt(
                    "Enter a new name for this shopping list:",
                    currentListName
                );


            if (
                newName === null
            ) {

                return;

            }


            const trimmedName =
                newName.trim();


            if (!trimmedName) {

                alert(
                    "The list name cannot be empty."
                );

                return;

            }


            try {

                await updateDoc(
                    doc(
                        db,
                        "shoppingLists",
                        currentListId
                    ),
                    {

                        name:
                            trimmedName,

                        updatedAt:
                            serverTimestamp()

                    }
                );


                currentListName =
                    trimmedName;


                updateUI();

            }

            catch (error) {

                console.error(
                    "Rename error:",
                    error
                );


                alert(
                    "Could not rename the list.\n\n" +
                    error.message
                );

            }

        }
    );

}


// ==========================================
// DELETE LIST
// ==========================================

if (deleteButton) {

    deleteButton.addEventListener(
        "click",
        async function () {

            if (!currentListId) {

                return;

            }


            const confirmed =
                confirm(
                    `Delete "${currentListName}" permanently?`
                );


            if (!confirmed) {

                return;

            }


            try {

                await deleteDoc(
                    doc(
                        db,
                        "shoppingLists",
                        currentListId
                    )
                );


                localStorage.removeItem(
                    "shopmocha_active_list_id"
                );


                currentListId =
                    null;


                currentListName =
                    "New Shopping List";


                shoppingList =
                    new ShoppingList();


                isExistingSavedList =
                    false;


                window.history.replaceState(
                    {},
                    "",
                    "index.html"
                );


                updateUI();

            }

            catch (error) {

                console.error(
                    "Delete list error:",
                    error
                );


                alert(
                    "Could not delete the shopping list.\n\n" +
                    error.message
                );

            }

        }
    );

}


// ==========================================
// REMOVE ITEM
// ==========================================

if (content) {

    content.addEventListener(
        "click",
        async function (event) {

            const button =
                event.target.closest(
                    ".remove-shopping-item"
                );


            if (!button) {

                return;

            }


            const index =
                parseInt(
                    button.dataset.index,
                    10
                );


            if (
                isNaN(index)
            ) {

                return;

            }


            shoppingList.removeItem(
                index
            );


            updateUI();


            if (
                currentListId &&
                currentUser
            ) {

                try {

                    await saveCurrentList();

                }

                catch (error) {

                    console.error(
                        error
                    );

                }

            }

        }
    );

}


// ==========================================
// RENDER
// ==========================================

function updateUI() {

    if (listNameElement) {

        listNameElement.textContent =
            currentListName;

    }


    if (content) {

        if (
            shoppingList.items.length === 0
        ) {

            content.innerHTML = `

                <div class="shopping-list-empty">

                    <div>
                        🛒
                    </div>

                    <h3>
                        Your shopping list is empty
                    </h3>

                    <p>
                        Add items manually or browse the catalogue.
                    </p>

                </div>

            `;

        }

        else {

            content.innerHTML =
                shoppingList.render();

        }

    }


    if (itemCount) {

        itemCount.textContent =
            shoppingList.items.length;

    }


    if (totalElement) {

        totalElement.textContent =
            `R${shoppingList
                .getTotal()
                .toFixed(2)}`;

    }


    if (renameButton) {

        renameButton.style.display =
            currentListId
                ? "inline-flex"
                : "none";

    }


    if (deleteButton) {

        deleteButton.style.display =
            currentListId
                ? "inline-flex"
                : "none";

    }

}


// ==========================================
// CLEAR INPUTS
// ==========================================

function clearManualInputs() {

    if (titleInput) {

        titleInput.value =
            "";

    }


    if (descriptionInput) {

        descriptionInput.value =
            "";

    }


    if (quantityInput) {

        quantityInput.value =
            "1";

    }

}


// ==========================================
// PENDING CATALOGUE PRODUCT
// ==========================================
//
// This supports older catalogue data if one
// was already stored in localStorage.
//

async function importLegacyPendingProduct() {

    if (!currentUser) {

        return;

    }


    const pending =
        localStorage.getItem(
            "shopmocha_pending_product"
        );


    if (!pending) {

        return;

    }


    try {

        const product =
            JSON.parse(
                pending
            );


        if (
            !product ||
            !product.name
        ) {

            localStorage.removeItem(
                "shopmocha_pending_product"
            );

            return;

        }


        shoppingList.addItem(
            new ShoppingListItem(

                product.name,

                product.description ||
                    "",

                product.quantity ||
                    1,

                product.price ||
                    0,

                product.store ||
                    "",

                product.image ||
                    "",

                product.productId ||
                    null

            )
        );


        localStorage.removeItem(
            "shopmocha_pending_product"
        );


        updateUI();

    }

    catch (error) {

        console.error(
            "Could not import pending product:",
            error
        );

    }

}

// ==========================================
// INITIAL UI
// ==========================================

updateUI();