import { PDFDocument } from "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm";
const canvas = document.getElementById("signature-pad");
const ctx = canvas.getContext("2d");

const EMAIL_SERVICE_ID = "service_nwdixv2";
const EMAIL_TEMPLATE_ID = "template_rgt0cup";
const EMAIL_PUBLIC_KEY = "CFWYk5-z-3vUxO-P3";

const startPDFApp = () => {
  async function init() {
    emailjs.init(EMAIL_PUBLIC_KEY);
    addEvent();
    drawing();
    generatePDF();
    checkInputs();
    fetchAPI();
  }

  async function fetchAPI() {
    try {
      await fetch("https://pompanetteserver.onrender.com/ping");
    } catch (error) {
      console.error(error);
    }
  }

  async function startSession() {
    const res = await fetch("https://pompanetteserver.onrender.com/start-upload-session", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to start upload session");
  }

  async function uploadPDFToBackend(file) {
    const statusContainer = document.getElementById("loading");
    const statusText = statusContainer.querySelector(".status");
    const loadingStatus = document.getElementById("loading-status");
    const loadingIcon = document.getElementById("loading-icon");
    const closeError = document.getElementById("closes");
    const check = document.getElementById("checks");

    function updateStatus(message) {
      statusText.textContent = message;
    }

    function showError() {
      closeError.classList.add("active");
      loadingIcon.classList.add("d-none");
      setTimeout(() => {
        statusContainer.classList.remove("active");
        setTimeout(() => {
          loadingStatus.style.display = "none";
          closeError.classList.remove("active");
        }, 300);
      }, 3000);
    }

    function showSuccess() {
      check.classList.add("active");
      loadingIcon.classList.add("d-none");
      setTimeout(() => {
        statusContainer.classList.remove("active");
        setTimeout(() => {
          loadingStatus.style.display = "none";
          check.classList.remove("active");
        }, 300);
      }, 3000);
    }

    function emptyInput() {
      document.querySelectorAll("input, textarea").forEach((el) => {
        if (el.type !== "button" && el.type !== "submit" && el.type !== "reset") {
          el.value = "";
        }
      });

      document.querySelectorAll("select").forEach((select) => {
        select.selectedIndex = 0;
      });

      const canvas = document.getElementById("signature-pad");
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      const errorMessage = document.getElementById("errorMessage");
      if (errorMessage) {
        errorMessage.classList.add("displayNone");
      }
    }

    updateStatus("Uploading file to server...");

    try {
      const backendFormData = new FormData();
      backendFormData.append("file", file);

      const response = await fetch("https://pompanetteserver.onrender.com/upload", {
        method: "POST",
        body: backendFormData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      console.log("Uploaded file URL:", data.url);

      // data === URL

      updateStatus("File uploaded successfully!");
      showSuccess();
      sendEmail();
      emptyInput();
    } catch (error) {
      alert(error);
      console.error("Upload failed:", error);
      updateStatus("Error uploading file.");
      showError();
    }
  }

  function addEvent() {
    document.getElementById("clear-signature").addEventListener("click", (event) => {
      event.preventDefault();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    document.getElementById("date").value = new Date().toLocaleDateString();
  }

  function drawing() {
    let drawing = false;

    // Mouse Events
    canvas.addEventListener("mousedown", () => (drawing = true));
    canvas.addEventListener("mouseup", () => {
      drawing = false;
      ctx.beginPath();
    });
    canvas.addEventListener("mousemove", drawMouse);

    // Touch Events
    // canvas.addEventListener("touchstart", (e) => {
    //   e.preventDefault(); // Prevent scrolling while drawing
    //   drawing = true;
    // });

    canvas.addEventListener("touchend", () => {
      drawing = false;
      ctx.beginPath();
    });

    canvas.addEventListener("touchmove", drawTouch);

    function drawMouse(event) {
      if (!drawing) return;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "black";
      ctx.lineTo(event.offsetX, event.offsetY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(event.offsetX, event.offsetY);
    }

    function drawTouch(event) {
      if (!drawing) return;

      const rect = canvas.getBoundingClientRect();
      const touch = event.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "black";
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  }

  function showError(message, fieldId) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.textContent = message;
    errorMessage.classList.remove("displayNone");
    document.getElementById(fieldId).focus();
  }

  function hideError() {
    document.getElementById("errorMessage").classList.add("displayNone");
  }

  function checkInputs() {
    const fname = document.getElementById("first-name").value.trim();
    const lname = document.getElementById("last-name").value.trim();
    const street = document.getElementById("street-address").value.trim();
    const city = document.getElementById("town-city").value.trim();
    const country = document.getElementById("country").value.trim();
    const zip = document.getElementById("postal-zip").value.trim();
    const contact = document.getElementById("contact-number").value.trim();
    const email = document.getElementById("email-address").value.trim();
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    const isValid = fname && lname && street && city && country && zip && contact && gmailRegex.test(email);
    document.querySelector(".inputText").classList.toggle("disable", !isValid);
  }

  // Attach to all input fields
  ["first-name", "last-name", "street-address", "town-city", "country", "postal-zip", "contact-number", "email-address"].forEach((id) => {
    document.getElementById(id).addEventListener("input", checkInputs);
  });

  function generatePDF() {
    document.getElementById("generate-pdf").addEventListener("click", async (event) => {
      const fname = document.getElementById("first-name").value.trim();
      const lname = document.getElementById("last-name").value.trim();
      const streetAddress = document.getElementById("street-address").value.trim();
      const townCity = document.getElementById("town-city").value.trim();
      const country = document.getElementById("country").value.trim();
      const postalZip = document.getElementById("postal-zip").value.trim();
      const contact = document.getElementById("contact-number").value.trim();
      const email = document.getElementById("email-address").value.trim();
      const notes = document.getElementById("notes").value.trim();

      event.preventDefault();

      if (!fname) {
        showError("Please enter a valid first name.", "first-name");
        return;
      }

      if (!lname) {
        showError("Please enter a valid last name.", "last-name");
        return;
      }

      if (!streetAddress) {
        showError("Please enter a valid street address.", "street-address");
        return;
      }

      if (!townCity) {
        showError("Please enter a valid town or city.", "town-city");
        return;
      }

      if (!country) {
        showError("Please enter a valid country.", "country");
        return;
      }

      if (!postalZip) {
        showError("Please enter a valid postal or zip code.", "postal-zip");
        return;
      }

      if (!contact) {
        showError("Please enter a valid contact number.", "contact-number");
        return;
      }

      const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

      if (!email) {
        showError("Email: Please enter an email address.", "email-address");
        return;
      } else if (!gmailRegex.test(email)) {
        showError("Email: Please enter a valid Gmail address (e.g., example@gmail.com).", "email-address");
        return;
      }

      document.querySelector(".inputText").classList.remove("disable");

      hideError();

      const mainColor = document.querySelector(".main-color").textContent;
      const secondaryColor = document.querySelector(".secondary-color").textContent;
      const armColor = document.querySelector(".arm-color").textContent;
      const pipingColor = document.querySelector(".piping-color").textContent;
      const headColor = document.querySelector(".head-color").textContent;
      const stitchColor = document.querySelector(".stitch-color").textContent;
      const quiltStyle = document.querySelector(".quilt-style").textContent;
      const quiltColor = document.querySelector(".quilt-color").textContent;
      const hardwareColor = document.querySelector(".hardware-color").textContent;

      const date = document.getElementById("date").value;
      const signatureData = canvas.toDataURL("image/png");

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);

      page.drawText(`Pompanette Boat Seat Configuration Agreement`, { x: 50, y: 750, size: 16 });
      page.drawText(`Customer Name: ${fname} ${lname}`, { x: 50, y: 700, size: 12 });
      page.drawText(`Street Address: ${streetAddress}`, { x: 50, y: 680, size: 12 });
      page.drawText(`Town/City: ${townCity}`, { x: 50, y: 660, size: 12 });
      page.drawText(`Country: ${country}`, { x: 50, y: 640, size: 12 });
      page.drawText(`Postal/Zip: ${postalZip}`, { x: 50, y: 620, size: 12 });
      page.drawText(`Contact Number: ${contact}`, { x: 50, y: 600, size: 12 });
      page.drawText(`Email Address: ${email}`, { x: 50, y: 580, size: 12 });
      page.drawText(`Notes: ${notes}`, { x: 50, y: 560, size: 12 });

      page.drawText(`Main Color: ${mainColor}`, { x: 50, y: 520, size: 12 });
      page.drawText(`Secondary Color: ${secondaryColor}`, { x: 50, y: 500, size: 12 });
      page.drawText(`Arm Rest Color: ${armColor}`, { x: 50, y: 480, size: 12 });
      page.drawText(`Piping Color: ${pipingColor}`, { x: 50, y: 460, size: 12 });
      page.drawText(`Head Rest Color: ${headColor}`, { x: 50, y: 440, size: 12 });
      page.drawText(`Stitch Style: ${headColor}`, { x: 50, y: 420, size: 12 });
      page.drawText(`Stitch Color: ${stitchColor}`, { x: 50, y: 400, size: 12 });
      page.drawText(`Quilting Stitches Style: ${quiltStyle}`, { x: 50, y: 380, size: 12 });
      page.drawText(`Quilting Stitches Color: ${quiltColor}`, { x: 50, y: 360, size: 12 });
      page.drawText(`Hardware Color: ${hardwareColor}`, { x: 50, y: 340, size: 12 });
      page.drawText(`Date: ${date}`, { x: 50, y: 320, size: 12 });

      const signatureImage = await pdfDoc.embedPng(signatureData);
      page.drawImage(signatureImage, { x: 50, y: 190, width: 150, height: 75 });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      const file = new File([blob], "Pompanette_Boat_Seat_Configuration_Agreement.pdf", { type: "application/pdf" });
      loadingAnimation();

      await startSession();
      await uploadPDFToBackend(file);
    });
  }

  function loadingAnimation() {
    const loading = document.getElementById("loading-status");
    const loadingContainer = document.getElementById("loading");
    const loadingicon = document.getElementById("loading-icon");
    const blackOut = document.querySelector(".blackOutX");

    if (blackOut) blackOut.click();
    loading.style.display = "flex";
    loadingContainer.classList.add("active");
    loadingicon.classList.remove("d-none");
  }

  function sendEmail() {
    const templateParams = {
      to_email: document.getElementById("email-address").value,
      name: document.getElementById("first-name").value + " " + document.getElementById("last-name").value,
      street_address: document.getElementById("street-address").value,
      city: document.getElementById("town-city").value,
      country: document.getElementById("country").value,
      postal_zip: document.getElementById("postal-zip").value,
      phone_number: document.getElementById("contact-number").value,
      email_address: document.getElementById("email-address").value,
      notes: document.getElementById("notes").value,

      main_color: document.querySelector(".main-color").textContent,
      secondary_color: document.querySelector(".secondary-color").textContent,
      arm_rest_color: document.querySelector(".arm-color").textContent,
      piping_color: document.querySelector(".piping-color").textContent,
      head_rest_color: document.querySelector(".head-color").textContent,
      stitch_style: document.querySelector(".stitch-style").textContent,
      stitch_color: document.querySelector(".stitch-color").textContent,
      quilting_style: document.querySelector(".quilt-style").textContent,
      quilting_color: document.querySelector(".quilt-color").textContent,
      hardware_color: document.querySelector(".hardware-color").textContent,
    };

    emailjs.send(EMAIL_SERVICE_ID, EMAIL_TEMPLATE_ID, templateParams).then();
  }

  init();
};

startPDFApp();
