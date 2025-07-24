import { PDFDocument } from "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm";
const canvas = document.getElementById("signature-pad");
const ctx = canvas.getContext("2d");

const EMAIL_SERVICE_ID = "service_nwdixv2";
const EMAIL_TEMPLATE_ID = "template_rgt0cup";
const EMAIL_PUBLIC_KEY = "CFWYk5-z-3vUxO-P3";

const UPLOAD_URL = "https://pompanetteserver.onrender.com/upload";
const AUTH_TOKEN = "Bearer pompanette123";

const startPDFApp = () => {
  function init() {
    addEvent();
    drawing();
    generatePDF();
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

    updateStatus("Uploading file to server...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(UPLOAD_URL, {
        method: "POST",
        headers: { Authorization: AUTH_TOKEN },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();

      updateStatus("File uploaded successfully!");
      showSuccess();
      sendEmail();
    } catch (error) {
      console.error("Upload failed:", error);
      updateStatus("Error uploading file.");
      showError();
    }
  }

  function addEvent() {
    emailjs.init(EMAIL_PUBLIC_KEY);
    document.getElementById("clear-signature").addEventListener("click", (event) => {
      event.preventDefault();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    
    document.getElementById("date").value = new Date().toLocaleDateString();
  }

  function drawing() {
    let drawing = false;

    canvas.addEventListener("mousedown", () => (drawing = true));
    canvas.addEventListener("mouseup", () => {
      drawing = false;
      ctx.beginPath();
    });
    canvas.addEventListener("mousemove", draw);

    function draw(event) {
      if (!drawing) return;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "black";
      ctx.lineTo(event.offsetX, event.offsetY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(event.offsetX, event.offsetY);
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

  function generatePDF() {
    document.getElementById("generate-pdf").addEventListener("click", async (event) => {
      event.preventDefault();

      console.log("asd");
      const name = document.getElementById("customer-name").value.trim();
      const streetAddress = document.getElementById("street-address").value.trim();
      const townCity = document.getElementById("town-city").value.trim();
      const country = document.getElementById("country").value.trim();
      const postalZip = document.getElementById("postal-zip").value.trim();
      const contact = document.getElementById("contact-number").value.trim();
      const email = document.getElementById("email-address").value.trim();

      if (!name) {
        showError("Please enter a valid name.", "customer-name");
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
      page.drawText(`Customer Name: ${name}`, { x: 50, y: 700, size: 12 });
      page.drawText(`Street Address: ${streetAddress}`, { x: 50, y: 680, size: 12 });
      page.drawText(`Town/City: ${townCity}`, { x: 50, y: 660, size: 12 });
      page.drawText(`Country: ${country}`, { x: 50, y: 640, size: 12 });
      page.drawText(`Postal/Zip: ${postalZip}`, { x: 50, y: 620, size: 12 });
      page.drawText(`Contact Number: ${contact}`, { x: 50, y: 600, size: 12 });
      page.drawText(`Email Address: ${email}`, { x: 50, y: 580, size: 12 });

      page.drawText(`Main Color: ${mainColor}`, { x: 50, y: 540, size: 12 });
      page.drawText(`Secondary Color: ${secondaryColor}`, { x: 50, y: 520, size: 12 });
      page.drawText(`Arm Rest Color: ${armColor}`, { x: 50, y: 500, size: 12 });
      page.drawText(`Piping Color: ${pipingColor}`, { x: 50, y: 480, size: 12 });
      page.drawText(`Head Rest Color: ${headColor}`, { x: 50, y: 460, size: 12 });
      page.drawText(`Stitch Color: ${stitchColor}`, { x: 50, y: 440, size: 12 });
      page.drawText(`Quilting Stitches Style: ${quiltStyle}`, { x: 50, y: 420, size: 12 });
      page.drawText(`Quilting Stitches Color: ${quiltColor}`, { x: 50, y: 400, size: 12 });
      page.drawText(`Hardware Color: ${hardwareColor}`, { x: 50, y: 380, size: 12 });

      page.drawText(`Date: ${date}`, { x: 50, y: 360, size: 12 });

      const signatureImage = await pdfDoc.embedPng(signatureData);
      page.drawImage(signatureImage, { x: 50, y: 230, width: 150, height: 75 });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      const file = new File([blob], "Pompanette_Boat_Seat_Configuration_Agreement.pdf", { type: "application/pdf" });
      loadingAnimation();
      await uploadPDFToBackend(file);
    });
  }

  function loadingAnimation() {
    const loading = document.getElementById("loading-status");
    const loadingContainer = document.getElementById("loading");
    const loadingicon = document.getElementById("loading-icon");
    const blackOut = document.querySelector(".blackOutX");

    blackOut.click();
    loading.style.display = "flex";
    loadingContainer.classList.add("active");
    loadingicon.classList.remove("d-none");
  }

  function sendEmail() {
    const templateParams = {
      to_email: document.getElementById("email-address").value,
      name: document.getElementById("customer-name").value,
      street_address: document.getElementById("street-address").value,
      city: document.getElementById("town-city").value,
      country: document.getElementById("country").value,
      postal_zip: document.getElementById("postal-zip").value,
      phone_number: document.getElementById("contact-number").value,
      email_address: document.getElementById("email-address").value,
      main_color: document.querySelector(".main-color").textContent,
      secondary_color: document.querySelector(".secondary-color").textContent,
      arm_rest_color: document.querySelector(".arm-color").textContent,
      piping_color: document.querySelector(".piping-color").textContent,
      head_rest_color: document.querySelector(".head-color").textContent,
      stitch_color: document.querySelector(".stitch-color").textContent,
      quilting_style: document.querySelector(".quilt-style").textContent,
      quilting_color: document.querySelector(".quilt-color").textContent,
      hardware_color: document.querySelector(".hardware-color").textContent,
    };

    emailjs.send(EMAIL_SERVICE_ID, EMAIL_TEMPLATE_ID, templateParams).then(
      function (response) {

        document.getElementById("statusMessage").innerText = "Email sent successfully!";
        document.getElementById("statusMessage").className = "success";
      },
      function (error) {
        console.error("FAILED...", error);
        document.getElementById("statusMessage").innerText = "Failed to send email. Please try again.";
        document.getElementById("statusMessage").className = "error";
      }
    );
  }

  init();
};

startPDFApp();
