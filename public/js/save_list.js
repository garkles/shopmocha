
import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


const saveButton =
    document.getElementById(
        "save_shopping_list_button"
    );


let currentUser = null;


// =========================
// CHECK AUTHENTICATION
// =========================

onAuthStateChanged(
    auth,
    function (user) {

        currentUser = user;

        console.log(
            "Current Firebase user:",
            user
        );

    }
);


// =========================
// SAVE SHOPPING LIST
// =========================

if (saveButton) {

    saveButton.addEventListener(
        "click",
        async function () {

            console.log(
                "Save button clicked"
            );


            // Check user

            if (!currentUser) {

                alert(
                    "Please sign in before saving your shopping list."
                );

                window.location.href =
                    "login.html";

                return;
            }


            // Check shopping list

            if (
                typeof shopping_list === "undefined"
            ) {

                console.error(
                    "shopping_list is not defined."
                );

                alert(
                    "Shopping list could not be found."
                );

                return;
            }


            if (
                !shopping_list.items ||
                shopping_list.items.length === 0
            ) {

                alert(
                    "Your shopping list is empty."
                );

                return;
            }


            // Ask for list name

            const listName =
                prompt(
                    "What would you like to name this shopping list?"
                );


            if (
                !listName ||
                listName.trim() === ""
            ) {

                return;
            }


            // Show saving state

            saveButton.disabled = true;

            saveButton.textContent =
                "Saving...";


            try {

                console.log(
                    "Preparing shopping list..."
                );


                const items =
                    shopping_list.items.map(
                        function (item) {

                            return {

                                name:
                                    item.name,

                                description:
                                    item.description,

                                is_done:
                                    item.is_done

                            };

                        }
                    );


                console.log(
                    "Items being saved:",
                    items
                );


                console.log(
                    "Saving for user:",
                    currentUser.uid
                );


                const documentReference =
                    await addDoc(
                        collection(
                            db,
                            "shoppingLists"
                        ),
                        {

                            userId:
                                currentUser.uid,

                            name:
                                listName.trim(),

                            createdAt:
                                serverTimestamp(),

                            items:
                                items

                        }
                    );


                console.log(
                    "LIST SAVED SUCCESSFULLY:",
                    documentReference.id
                );


                alert(
                    "Shopping list saved successfully!"
                );


                saveButton.disabled = false;

                saveButton.textContent =
                    "💾 Save Shopping List";


            } catch (error) {

                console.error(
                    "FIRESTORE SAVE ERROR:",
                    error
                );


                console.error(
                    "Error code:",
                    error.code
                );


                console.error(
                    "Error message:",
                    error.message
                );


                saveButton.disabled = false;

                saveButton.textContent =
                    "💾 Save Shopping List";


                alert(
                    "Could not save your shopping list.\n\n" +
                    error.message
                );

            }

        }
    );

}

