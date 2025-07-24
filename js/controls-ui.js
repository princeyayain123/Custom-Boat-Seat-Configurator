const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const UIController = {
  selectors: {
    toggleButton: "#toggle-icon",
    iconList: "#icon-list",
    iconX: "#icon-x",
    uiButtons: ".ui button",
    materialsBar: ".selectedMaterials",
    agreeButton: ".agreementButton",
    agreementContainer: ".agreementContainer",
    blackOut: ".blackOut",
    blackOutX: ".blackOutX",
    configurationMaterial: ".configurationMaterial",
    downloadBtn: "#saveAsIcon",
    sections: {
      colors: "#coloring",
      texture: "#quiltings",
      Materials: "#materials",
    },
    colorWrappers: ".color-option-wrapper",
    clearSignature: "#clear-signature",
    steps: ".step",
    progress: "#progress",
    pages: ".page",
    nextButtons: ".next",
    prevButtons: ".prev",
  },

  init() {
    this.cacheElements();
    this.bindEvents();
    this.autoIdColors();
  },

  cacheElements() {
    const s = this.selectors;
    this.elements = {
      button: $(s.toggleButton),
      iconList: $(s.iconList),
      iconX: $(s.iconX),
      buttons: $$(s.uiButtons),
      materialsBar: $(s.materialsBar),
      agreeButton: $(s.agreeButton),
      agreementContainer: $(s.agreementContainer),
      blackOut: $(s.blackOut),
      blackOutX: $(s.blackOutX),
      configurationMaterial: $(s.configurationMaterial),
      downloadBtn: $(s.downloadBtn),
      sections: {
        colors: $(s.sections.colors),
        texture: $(s.sections.texture),
        Materials: $(s.sections.Materials),
      },
      colorWrappers: $$(s.colorWrappers),
      clearSignature: $(s.clearSignature),
      steps: $$(s.steps),
      progress: $(s.progress),
      pages: $$(s.pages),
      nextButtons: $$(s.nextButtons),
      prevButtons: $$(s.prevButtons),
    };
  },

  bindEvents() {
    this.elements.buttons.forEach((btn) => btn.addEventListener("click", () => this.toggleSection(btn)));

    this.elements.agreeButton.addEventListener("click", () => this.showAgreement());
    this.elements.blackOutX.addEventListener("click", () => this.hideAgreement());
    this.elements.button.addEventListener("click", () => this.toggleSidebar());
    this.elements.clearSignature.addEventListener("click", () => console.log("Signature cleared"));
    this.elements.nextButtons.forEach((button) => button.addEventListener("click", () => this.nextStep()));
    this.elements.prevButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.backStep();
      });
    });
  },

  toggleSection(btn) {
    this.elements.buttons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    Object.values(this.elements.sections).forEach((section) => section.classList.remove("active"));

    const target = this.elements.sections[btn.id];
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      this.elements.materialsBar.style.right = "0";
      this.elements.materialsBar.style.bottom = btn.id === "colors" ? "260px" : "160px";
    } else {
      this.elements.materialsBar.style.right = target.classList.contains("coloring") ? "390px" : "300px";
    }

    target.classList.add("active");
  },

  autoIdColors() {
    this.elements.colorWrappers.forEach((wrapper, index) => {
      if (!wrapper.id) wrapper.id = `color${index + 1}`;
    });
  },

  showAgreement() {
    this.elements.agreementContainer.style.display = "block";
    this.elements.blackOut.style.display = "block";
    setTimeout(() => {
      this.elements.agreementContainer.style.top = "50%";
      this.elements.agreementContainer.style.opacity = "1";
      this.elements.blackOut.style.opacity = "1";
    }, 0);

    const mappings = [
      [".Main_Color\\.002", ".main-color"],
      [".quilting_a\\.001", ".secondary-color"],
      [".Arm_Side\\.002", ".arm-color"],
      [".Accent_Color\\.002", ".piping-color"],
      [".Headrest\\.002", ".head-color"],
      [".stitches\\.002", ".stitch-color"],
      [".quiltingStyleMaterial", ".quilt-style"],
      [".quiltingColorMaterial", ".quilt-color"],
      [".hardwareColor", ".hardware-color"],
    ];

    mappings.forEach(([from, to]) => {
      $(to).innerHTML = $(from).textContent;
    });
  },

  hideAgreement() {
    this.elements.agreementContainer.style.top = "45%";
    this.elements.agreementContainer.style.opacity = "0";
    this.elements.blackOut.style.opacity = "0";
    setTimeout(() => {
      this.elements.agreementContainer.style.display = "none";
      this.elements.blackOut.style.display = "none";
    }, 300);
  },

  toggleSidebar() {
    this.elements.iconList.classList.toggle("hidden");
    this.elements.iconX.classList.toggle("hidden");
    this.elements.configurationMaterial.classList.toggle("d-none");
  },

  currentStep: 1,

  nextStep() {
    if (this.currentStep < this.elements.steps.length) {
      this.currentStep++;
      this.updateSteps();
      this.updatePages();
      this.scrollToTop();
    }
  },

  backStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateSteps();
      this.updatePages();
      this.scrollToTop();
    }
  },

  scrollToTop() {
    const container = document.querySelector(".agreementContainer");
    container.scrollTo({ top: 0, behavior: "smooth" });
  },

  updateSteps() {
    this.elements.steps.forEach((step, index) => {
      step.classList.toggle("active", index < this.currentStep);
    });
    this.elements.progress.style.width = `${((this.currentStep - 1) / (this.elements.steps.length - 1)) * 100}%`;
  },

  updatePages() {
    this.elements.pages.forEach((page, index) => {
      page.classList.remove("active");
      if (index === this.currentStep - 1) {
        page.classList.add("active");
      }
    });
  },
};

// Initialize the object
UIController.init();
