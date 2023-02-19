import { ACCESS_TOKEN, EXPIRES_IN, TOKEN_TYPE } from "../common";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const scopes =
  "user-top-read user-follow-read playlist-read-private user-library-read";
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
const APP_URL = import.meta.env.VITE_APP_URL;

function copyEmail(event) {
  navigator.clipboard.writeText("kogilo7677@mustbeit.com");
}
function copyPassword() {
  navigator.clipboard.writeText("dUfmeh-wibxod-2pazva");
}

const authorizeUser = () => {
  const url = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${REDIRECT_URI}&scope=${scopes}&show_dialog=true`;
  window.open(url, "login", "width=800,height=600");
};
document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("login-to-spotify");
  loginButton.addEventListener("click", authorizeUser);
  document.getElementById("copyEmail").addEventListener("click", copyEmail);
  document
    .getElementById("copyPassword")
    .addEventListener("click", copyPassword);
});

window.addEventListener("load", () => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN);
  if (accessToken) {
    window.location.href = `${APP_URL}/dashboard/dashboard.html`;
  }

  if (window.opener !== null && !window.opener.closed) {
    window.focus();
    if (window.location.href.includes("error")) {
      window.close();
    }
    const { hash } = window.location;
    const searchParams = new URLSearchParams(hash);
    // #access_token=BQAUoJ20wRWWbAqQosLzngs7H2oszNf_AsYKHfLNcbiqp_tLUe7NkOQ7pE8NS0_anvZ0iLBLhb7sUCaVaC9IPpvwJyyNtMrfseXoGidHaKenaec0z5nwuzfpDhHCfgVFdf8Ext6dy9CpeuZdobr5FfByLgb1bFl6npgxNvE8gnTB2hBDcKEdnNIMP8qbd03pJ89ELYxpcJ7K7ZcUGm0gL7ULuJZ9qiaFEgw&token_type=Bearer&expires_in=3600

    const accessToken = searchParams.get("#access_token");
    const tokenType = searchParams.get("token_type");
    const expiresIn = searchParams.get("expires_in");

    if (accessToken) {
      window.close();
      window.opener.setItemsInLocalStorage({
        accessToken,
        tokenType,
        expiresIn,
      });
    } else {
      window.close();
    }
  }
});

window.setItemsInLocalStorage = ({ accessToken, tokenType, expiresIn }) => {
  localStorage.setItem(ACCESS_TOKEN, accessToken);
  localStorage.setItem(TOKEN_TYPE, tokenType);
  localStorage.setItem(EXPIRES_IN, Date.now() + expiresIn * 1000); //converting expiresIn in ms and adding current time to it
  window.location.href = APP_URL;
};
