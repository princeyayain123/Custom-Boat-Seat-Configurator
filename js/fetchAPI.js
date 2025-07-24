async function fetchAPI() {
  try {
    await fetch("https://pompanetteserver.onrender.com/ping");
    console.log("Server is UP!");
  } catch (error) {
    console.error(error);
  }
}

fetchAPI();
