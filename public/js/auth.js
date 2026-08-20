import { auth } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";


console.log("auth.js loaded successfully");


var registerForm =
    document.getElementById("register_form");


if (registerForm) {

    console.log("Registration form found");

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            console.log("Create account button clicked");


            var email =
                document.getElementById(
                    "register_email"
                ).value.trim();


            var password =
                document.getElementById(
                    "register_password"
                ).value;


            var confirmPassword =
                document.getElementById(
                    "register_password_confirm"
                ).value;


            var error =
                document.getElementById(
                    "register_error"
                );


            error.textContent = "";


            if (password !== confirmPassword) {

                error.textContent =
                    "Passwords do not match.";

                return;
            }


            try {

                console.log(
                    "Creating Firebase account..."
                );


                var userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                console.log(
                    "Account created:",
                    userCredential.user.email
                );


                window.location.href =
                    "dashboard.html";


            } catch (err) {

                console.error(
                    "Firebase registration error:",
                    err
                );


                error.textContent =
                    getAuthErrorMessage(err.code);

            }

        }
    );

}


var loginForm =
    document.getElementById("login_form");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            var email =
                document.getElementById(
                    "login_email"
                ).value.trim();


            var password =
                document.getElementById(
                    "login_password"
                ).value;


            var error =
                document.getElementById(
                    "login_error"
                );


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


                window.location.href =
                    "dashboard.html";


            } catch (err) {

                console.error(
                    "Firebase login error:",
                    err
                );


                error.textContent =
                    getAuthErrorMessage(err.code);

            }

        }
    );

}


function getAuthErrorMessage(code) {

    switch (code) {

        case "auth/email-already-in-use":
            return "An account with this email already exists.";

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/weak-password":
            return "Password must be at least 6 characters.";

        case "auth/invalid-credential":
            return "Incorrect email or password.";

        default:
            return "Something went wrong. Check the browser console.";
    }

}