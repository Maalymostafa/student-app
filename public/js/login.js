const params = new URLSearchParams(window.location.search);
const error = document.querySelector("#login-error");

if (params.get("error") === "invalid" && error) {
  error.hidden = false;
}
