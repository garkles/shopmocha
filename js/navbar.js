import { auth } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";


const loginLink =
    document.getElementById("login_nav_link");

const registerLink =
    document.getElementById("register_nav_link");

const dashboardLink =
    document.getElementById("dashboard_nav_link");

const signedInNav =
    document.getElementById("signed_in_nav");

const userEmail =
    document.getElementById("nav_user_email");

const logoutButton =
    document.getElementById("logout_button");


onAuthStateChanged(auth, function(user) {

    if (user) {

        console.log(
            "User signed in:",
            user.email
        );


        // Hide authentication links

        if (loginLink) {
            loginLink.style.display = "none";
        }

        if (registerLink) {
            registerLink.style.display = "none";
        }


        // Show dashboard

        if (dashboardLink) {
            dashboardLink.style.display = "inline";
        }


        // Show signed-in information

        if (signedInNav) {
            signedInNav.style.display = "block";
        }


        if (userEmail) {
            userEmail.textContent =
                user.email;
        }


        // Show logout

        if (logoutButton) {
            logoutButton.style.display =
                "inline-block";
        }

    } else {

        console.log(
            "No user signed in"
        );


        // Show authentication links

        if (loginLink) {
            loginLink.style.display =
                "inline";
        }

        if (registerLink) {
            registerLink.style.display =
                "inline";
        }


        // Hide dashboard

        if (dashboardLink) {
            dashboardLink.style.display =
                "none";
        }


        // Hide signed-in information

        if (signedInNav) {
            signedInNav.style.display =
                "none";
        }


        // Hide logout

        if (logoutButton) {
            logoutButton.style.display =
                "none";
        }

    }

});


// ==========================================
// LOGOUT
// ==========================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function() {

            try {

                await signOut(auth);

                window.location.href =
                    "index.html";

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}