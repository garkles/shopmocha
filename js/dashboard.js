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
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


const savedLists =
    document.getElementById(
        "saved_lists"
    );


// ==========================================
// AUTH
// ==========================================

onAuthStateChanged(
    auth,
    async function (user) {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        const emailElement =
            document.getElementById(
                "dashboard_email"
            );


        if (emailElement) {

            emailElement.textContent =
                user.email;
        }


        await loadSavedLists(
            user.uid
        );

    }
);


// ==========================================
// LOAD SAVED LISTS
// ==========================================

async function loadSavedLists(
    userId
) {

    if (!savedLists) {

        return;

    }


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
                    userId
                )
            );


        const snapshot =
            await getDocs(
                listsQuery
            );


        const lists = [];


        snapshot.forEach(
            function (documentSnapshot) {

                lists.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        // ======================================
        // SORT NEWEST FIRST
        // ======================================

        lists.sort(
            function (a, b) {

                const dateA =
                    a.createdAt
                        ? a.createdAt.toMillis()
                        : 0;


                const dateB =
                    b.createdAt
                        ? b.createdAt.toMillis()
                        : 0;


                return dateB -
                    dateA;

            }
        );


        savedLists.innerHTML =
            "";


        if (
            lists.length === 0
        ) {

            savedLists.innerHTML = `

                <div class="no-lists">

                    <div class="no-lists-icon">
                        🛒
                    </div>

                    <p>
                        You don't have any saved lists yet.
                    </p>

                    <a
                        href="index.html"
                        class="dashboard-button"
                    >
                        Create a List
                    </a>

                </div>

            `;

            return;

        }


        lists.forEach(
            function (list) {

                const createdDate =
                    formatFirestoreDate(
                        list.createdAt
                    );


                const itemCount =
                    Array.isArray(list.items)
                        ? list.items.length
                        : 0;


                const total =
                    calculateListTotal(
                        list.items
                    );


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "saved-list";


                card.innerHTML = `

                    <div class="saved-list-info">

                        <h3>
                            ${escapeHtml(
                                list.name ||
                                "Unnamed Shopping List"
                            )}
                        </h3>


                        <p>
                            Created ${createdDate}
                        </p>


                        <span>
                            ${itemCount}
                            ${
                                itemCount === 1
                                    ? " item"
                                    : " items"
                            }
                        </span>


                        <strong>
                            R${total.toFixed(2)}
                        </strong>

                    </div>


                    <div class="saved-list-actions">

                        <a
                            href="index.html?listId=${encodeURIComponent(
                                list.id
                            )}"
                            class="open-list-button"
                        >
                            Open →
                        </a>


                        <button
                            type="button"
                            class="delete-dashboard-list"
                            data-list-id="${escapeAttribute(
                                list.id
                            )}"
                        >
                            🗑️
                        </button>

                    </div>

                `;


                savedLists.appendChild(
                    card
                );

            }
        );


        document
            .querySelectorAll(
                ".delete-dashboard-list"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        async function () {

                            await deleteDashboardList(
                                button.dataset.listId,
                                userId
                            );

                        }
                    );

                }
            );

    }

    catch (error) {

        console.error(
            "Error loading saved lists:",
            error
        );


        savedLists.innerHTML = `

            <div class="list-error">

                Unable to load your saved lists.

                <br><br>

                ${escapeHtml(
                    error.message
                )}

            </div>

        `;

    }

}


// ==========================================
// DELETE LIST
// ==========================================

async function deleteDashboardList(
    listId,
    userId
) {

    const confirmed =
        confirm(
            "Are you sure you want to permanently delete this list?"
        );


    if (!confirmed) {

        return;

    }


    try {

        await deleteDoc(
            doc(
                db,
                "shoppingLists",
                listId
            )
        );


        const activeList =
            localStorage.getItem(
                "shopmocha_active_list_id"
            );


        if (
            activeList === listId
        ) {

            localStorage.removeItem(
                "shopmocha_active_list_id"
            );

        }


        await loadSavedLists(
            userId
        );

    }

    catch (error) {

        console.error(
            "Dashboard delete error:",
            error
        );


        alert(
            "Could not delete the list.\n\n" +
            error.message
        );

    }

}


// ==========================================
// CALCULATE TOTAL
// ==========================================

function calculateListTotal(
    items
) {

    if (
        !Array.isArray(items)
    ) {

        return 0;

    }


    return items.reduce(
        function (
            total,
            item
        ) {

            const price =
                Number(
                    item.price
                ) || 0;


            const quantity =
                Number(
                    item.quantity
                ) || 1;


            return total +
                price *
                quantity;

        },
        0
    );

}


// ==========================================
// DATE
// ==========================================

function formatFirestoreDate(
    timestamp
) {

    if (
        !timestamp
    ) {

        return "Date unavailable";

    }


    try {

        return timestamp
            .toDate()
            .toLocaleDateString(
                "en-ZA",
                {
                    day:
                        "numeric",

                    month:
                        "long",

                    year:
                        "numeric"
                }
            );

    }

    catch {

        return "Date unavailable";

    }

}


// ==========================================
// SECURITY
// ==========================================

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