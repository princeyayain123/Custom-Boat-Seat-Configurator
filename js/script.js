import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

let scene, camera, renderer, model, dirLight, controls;
let pointerXOnPointerDown = 0;
let targetRotation = 0;
let targetRotationOnPointerDown = 0;
let pointerX = 0;
let windowHalfX = window.innerWidth / 2;
let isTransitioning = false;
let transitionStartTime = null;
let transitionDuration = 1000;
let targetPosition = new THREE.Vector3();
let textureName = "quilting_a.001";
let materialName = "Main_Color.002";
let stitchesName = "stitches";
const fadeMaterials = new Map();
const container = document.getElementById("container");
const agreeButton = document.querySelector(".agreementButton");
const materialsList = [];

init();
loadModel();

function init() {
  container.addEventListener("pointerdown", onPointerDown);

  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  // Camera setup
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100);
  camera.position.set(-3, 2, 6);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);


  container.appendChild(renderer.domElement);

  // Orbit controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1, 0);
  controls.minPolarAngle = Math.PI / 4;
  controls.maxPolarAngle = Math.PI / 1.5;
  controls.minDistance = 2.5;
  controls.maxDistance = 6;
  controls.enablePan = false;
  controls.update();

  // Lighting setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  dirLight = new THREE.DirectionalLight(0xffffff, 3);
  dirLight.position.set(0, 1, 1);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  scene.add(dirLight);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x888888, 0.6);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  agreeButton.addEventListener("click", () => {
    renderer.render(scene, camera);
    const canvas = renderer.domElement;
    const imageData = canvas.toDataURL("image/png");
    const imgElement = document.createElement("img");

    imgElement.src = imageData;
    imgElement.alt = "Captured Canvas Image";

    const pictureContainer = document.getElementById("picture");
    pictureContainer.innerHTML = "";
    pictureContainer.appendChild(imgElement);
  });

  $(document).ready(() => {
    onWindowResize(); // Set initial dimensions
    $(window).on("resize", debounce(onWindowResize, 0));
    window.addEventListener("orientationchange", () => {
      onWindowResize(); // Handle orientation change
    });
  });
}

function onWindowResize() {
  const isMobile = window.innerWidth <= 768;
  const isLandscape = window.innerWidth > window.innerHeight && window.innerHeight <= 430;

  let width = 0; 
  let height = 0; 

  if (isLandscape) {
    width = window.innerWidth * 0.5;
    height = window.innerHeight;
  } else if (isMobile) {
    width = window.innerWidth;
    height = window.innerHeight * 0.75;
  } else {
    width = window.innerWidth * 0.8;
    height = window.innerHeight;
  }

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio || 1);


}

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

function onPointerDown(event) {
  if (event.isPrimary === false) return;

  pointerXOnPointerDown = event.clientX - windowHalfX;
  targetRotationOnPointerDown = targetRotation;

  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
}

function loadModel() {
  let totalItems = 0;
  let loadedItems = 0;
  let smoothProgress = 0;

  function updateProgress(targetProgress) {
    if (smoothProgress < targetProgress) {
      smoothProgress++;
      $("#loading-progress").css("width", `${smoothProgress}%`);
      $("#loading-text").text(`${smoothProgress}%`);
      requestAnimationFrame(() => updateProgress(targetProgress));
    }
  }

  const loadingManager = new THREE.LoadingManager(
    () => {
      $("#loading-screen").fadeOut(800, () => {
        $("#loading-screen").remove();
      });
    },
    (itemUrl, itemsLoaded, itemsTotal) => {
      totalItems = itemsTotal;
      loadedItems = itemsLoaded;

      const targetProgress = Math.floor((loadedItems / totalItems) * 100);
      updateProgress(targetProgress);
    },
    (url) => {
      console.error(`Error loading: ${url}`);
    }
  );

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  new RGBELoader().setPath("./assets/hdr/").load("studio.hdr", function (texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;

    scene.environment = envMap; 
    scene.background = new THREE.Color(0xffffff); 

    texture.dispose();
    pmremGenerator.dispose();
  });

  const loader = new GLTFLoader(loadingManager);
  loader.load("./assets/model/merge.glb", (gltf) => {
    model = gltf.scene;
    model.scale.set(2.5, 2.5, 2.5);
    model.position.y = -1;
    scene.add(model);

    model.traverse((object) => {
      if (object.isMesh) {


        object.castShadow = true;
        object.receiveShadow = true;
        if (!materialsList.includes(object.material)) {
          materialsList.push(object.material);
        }
      }
    });

    createGUI();
    animate();
  });
}

function fadeMaterialToRed(material) {
  if (fadeMaterials.has(material)) return;

  const originalColor = material.color.clone();
  material.color.set(0xff0000);

  fadeMaterials.set(material, {
    material: material,
    originalColor: originalColor,
    startTime: performance.now(),
    duration: 400,
  });
}

function onPointerMove(event) {
  if (event.isPrimary === false) return;

  pointerX = event.clientX - windowHalfX;

  targetRotation = targetRotationOnPointerDown + (pointerX - pointerXOnPointerDown) * 0.02;
}

function onPointerUp() {
  if (event.isPrimary === false) return;

  document.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("pointerup", onPointerUp);
}

function createGUI() {
  let currentMaterial = "Main_Color.002";
  function toggleMeshes(meshToShow, meshesToHide) {
    const showMesh = scene.getObjectByName(meshToShow);
    if (showMesh) {
      showMesh.visible = true;
    }


    meshesToHide.forEach((meshName) => {
      const hideMesh = scene.getObjectByName(meshName);
      if (hideMesh) {
        hideMesh.visible = false;
      }
    });
  }

  toggleMeshes("quilting_a", ["quilting_b", "quilting_c", "quilting_d", "quilting_e", "quilting_f"]);


  document.querySelectorAll("#textureHave").forEach((element, index) => {
    element.addEventListener("click", () => {
      const imgElement = element.querySelector("img");
      document.querySelector(".quiltingStyleMaterial").innerHTML = imgElement.alt;
      switch (index) {
        case 0:
          toggleMeshes("quilting_a", ["quilting_b", "quilting_c", "quilting_d", "quilting_e", "quilting_f"]);
          textureName = "quilting_a.001";
          break;
        case 1:
          toggleMeshes("quilting_b", ["quilting_a", "quilting_c", "quilting_d", "quilting_e", "quilting_f"]);
          textureName = "quilting_b.002";
          break;
        case 2:
          toggleMeshes("quilting_c", ["quilting_b", "quilting_a", "quilting_d", "quilting_e", "quilting_f"]);
          textureName = "quilting_c";
          break;
        case 3:
          toggleMeshes("quilting_d", ["quilting_b", "quilting_c", "quilting_a", "quilting_e", "quilting_f"]);
          textureName = "quilting_d";
          break;
        case 4:
          toggleMeshes("quilting_e", ["quilting_b", "quilting_c", "quilting_d", "quilting_a", "quilting_f"]);
          textureName = "quilting_e";
          break;
        case 5:
          toggleMeshes("quilting_f", ["quilting_b", "quilting_c", "quilting_d", "quilting_e", "quilting_a"]);
          textureName = "quilting_f";
          break;
        case 6:
          toggleMeshes("quilting a s 002", ["quilting_f", "quilting_b", "quilting_c", "quilting_d", "quilting_e", "quilting_a"]);
          textureName = "quilting_a_stitches.001";
          document.querySelector(".quiltingStyleMaterial").innerHTML = "None";
          break;
        default:
          console.warn("Invalid index.");
          return;
      }

      const selectedMaterial = materialsList.find((mat) => mat.name === textureName);
      if (selectedMaterial) {
        currentMaterial = selectedMaterial;

        const circles = document.querySelectorAll(".selectedMaterials > div");
        circles.forEach((c, index) => {
          c.classList.remove("active");
          if (index === 1) {
            c.classList.add("active");
          }
        });
      } else {
        console.warn(`Material not found for textureName: ${textureName}`);
      }
    });
  });

  toggleMeshes("Stitch_Single_Armrest001", ["Stitch_Single_Backrest_Back005", "Stitch_Double_Backrest_Front_010", "Stitch_Double_Backrest_Front_012"]);

  document.querySelectorAll("#stitchesHave").forEach((element, index) => {
    element.addEventListener("click", () => {
      const imgElement = element.querySelector("img");
      document.querySelector(".stitchesStyleMaterial").innerHTML = imgElement.alt;
      switch (index) {
        case 0:
          toggleMeshes("Stitch_Single_Armrest001", ["Stitch_Single_Backrest_Back005", "Stitch_Double_Backrest_Front_010", "Stitch_Double_Backrest_Front_012"]);
          break;
        case 1:
          toggleMeshes("Stitch_Single_Backrest_Back005", ["Stitch_Single_Armrest001", "Stitch_Double_Backrest_Front_010", "Stitch_Double_Backrest_Front_012"]);
          break;
        case 2:
          toggleMeshes("Stitch_Double_Backrest_Front_010", ["Stitch_Single_Armrest001", "Stitch_Single_Backrest_Back005", "Stitch_Double_Backrest_Front_012"]);
          break;
        case 3:
          toggleMeshes("Stitch_Double_Backrest_Front_012", ["Stitch_Single_Armrest001", "Stitch_Single_Backrest_Back005", "Stitch_Double_Backrest_Front_010"]);
          break;
        case 4:
          toggleMeshes("", ["Stitch_Double_Backrest_Front_012", "Stitch_Single_Armrest001", "Stitch_Single_Backrest_Back005", "Stitch_Double_Backrest_Front_010"]);
          break;
        default:
          console.warn("Invalid index.");
          return;
      }

      const selectedMaterial = materialsList.find((mat) => mat.name === stitchesName);
      if (selectedMaterial) {
        currentMaterial = selectedMaterial;

        const circles = document.querySelectorAll(".selectedMaterials > div");
        circles.forEach((c, index) => {
          c.classList.remove("active");
          if (index === 1) {
            c.classList.add("active");
          }
        });
      } else {
        console.warn(`Material not found for textureName: ${stitchesName}`);
      }
    });
  });

  const quiltedStitcheName = "quilting_a_stitches.001";

  document.querySelectorAll(".stitch-block").forEach((option) => {
    option.addEventListener("click", () => {
      const colorName = option.querySelector(".color-title").textContent;

      const color = option.getAttribute("data-color");
      const selectedMaterial = materialsList.find((mat) => mat.name === stitchesName);

      if (selectedMaterial) {
        document.querySelector(".stitches\\.002").innerHTML = colorName;
        selectedMaterial.color.set(color);
        selectedMaterial.needsUpdate = true;
      } else {
        console.error(`Material does not support color property.`);
      }
    });
  });

  document.querySelectorAll(".color-block").forEach((option) => {
    option.addEventListener("click", () => {
      const colorName = option.querySelector(".color-title").textContent;

      const color = option.getAttribute("data-color");
      const selectedMaterial = materialsList.find((mat) => mat.name === quiltedStitcheName);

      if (selectedMaterial) {
        document.querySelector(".hardwareColor").innerHTML = colorName;
        selectedMaterial.color.set(color);
        selectedMaterial.needsUpdate = true;
      } else {
        console.error(`Material does not support color property.`);
      }
    });
  });

  document.querySelectorAll(".material-block").forEach((option) => {
    option.addEventListener("click", () => {
      const colorName = option.querySelector(".color-title").textContent;

      const color = option.getAttribute("data-color");
      const selectedMaterial = materialsList[0];

      if (selectedMaterial) {
        document.querySelector(".hardwareColor").innerHTML = colorName;
        selectedMaterial.color.set(color);
        selectedMaterial.needsUpdate = true;
      } else {
        console.error(`Material does not support color property.`);
      }
    });
  });

  function changeColor(color, colorName) {
    if (["quilting_a.001", "quilting_b.002", "quilting_c", "quilting_d", "quilting_e", "quilting_f", "quilting_a_stitches.001"].includes(materialName)) {
      materialName = "quilting_a.001";
    }

    document.getElementById(materialName).innerHTML = colorName;
    currentMaterial.color.set(color);
  }

  document.querySelectorAll(".color-option-wrapper").forEach((element) => {
    element.addEventListener("click", () => {
      const color = element.dataset.color;
      const colorName = element.querySelector(".color-title").textContent;
      if (color) {
        changeColor(color, colorName);
      }
    });
  });

  function createMaterialSelection(materialsList) {
    const circles = document.querySelectorAll(".selectedMaterials > div");

    circles.forEach((circle, circleIndex) => {
      circle.addEventListener("click", () => {
        switch (circleIndex) {
          case 0:
            materialName = "Main_Color.002";
            break;
          case 1:
            materialName = textureName;
            break;
          case 2:
            materialName = "Arm_Side.002";
            break;
          case 3:
            materialName = "Accent_Color.002";
            break;
          case 4:
            materialName = "Headrest.002";
            break;
          // case 5:
          //   materialName = "stitches";
          //   break;
          default:
            materialName = null;
        }

        if (materialName) {
          const selectedMaterial = materialsList.find((mat) => mat.name === materialName);

          if (selectedMaterial) {
            currentMaterial = selectedMaterial;
            fadeMaterialToRed(selectedMaterial);
            circles.forEach((c) => c.classList.remove("active"));
            circle.classList.add("active");
          }
        }
      });
    });

    const defaultMaterial = materialsList.find((mat) => mat.name === "Main_Color.002");
    if (defaultMaterial && circles[0]) {
      currentMaterial = defaultMaterial;
      circles[0].classList.add("active");
    }
  }

  createMaterialSelection(materialsList);
}


let targetDistance = controls.getDistance ? controls.getDistance() : camera.position.distanceTo(controls.target);
let zoomLerpSpeed = 0.05; 


function getCameraDistance() {
  return camera.position.distanceTo(controls.target);
}


renderer.domElement.addEventListener("wheel", (event) => {
  event.preventDefault();


  const delta = event.deltaY > 0 ? 1 : -1;

  targetDistance = THREE.MathUtils.clamp(
    targetDistance + delta * 0.5,
    controls.minDistance,
    controls.maxDistance
  );
}, { passive: false });

let targetQuaternion = new THREE.Quaternion();

function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();


  const currentDistance = getCameraDistance();
  if (Math.abs(currentDistance - targetDistance) > 0.01) {
    const direction = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    const newDistance = THREE.MathUtils.lerp(currentDistance, targetDistance, zoomLerpSpeed);
    camera.position.copy(controls.target).add(direction.multiplyScalar(newDistance));
    camera.updateProjectionMatrix();
  }

  for (const [material, fade] of fadeMaterials) {
    const elapsed = currentTime - fade.startTime;
    if (elapsed < fade.duration) {
      const t = elapsed / fade.duration;
      material.color.lerpColors(new THREE.Color(0xff0000), fade.originalColor, t);
    } else {
      material.color.copy(fade.originalColor);
      fadeMaterials.delete(material);
    }
  }

  if (isTransitioning) {
    const elapsedTime = performance.now() - transitionStartTime;
    const t = Math.min(elapsedTime / transitionDuration, 1);

    camera.position.lerpVectors(camera.position, targetPosition, t);
    camera.quaternion.slerp(targetQuaternion, t);

    if (camera.position.distanceTo(targetPosition) < 0.01 && camera.quaternion.angleTo(targetQuaternion) < 0.001) {
      camera.position.copy(targetPosition);
      camera.quaternion.copy(targetQuaternion);
      isTransitioning = false;
      controls.enabled = true;
    }
  }

  controls.update();

  const lightOffset = new THREE.Vector3(0, 1, 1);
  lightOffset.applyQuaternion(camera.quaternion);
  dirLight.position.copy(camera.position.clone().add(lightOffset));
  dirLight.target.position.copy(camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3())));
  dirLight.target.updateMatrixWorld();

  model.rotation.y += (targetRotation - model.rotation.y) * 0.1;
  renderer.render(scene, camera);
}
