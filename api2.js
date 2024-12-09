// Initial Zip and City
const zip = "10115";
const city = "Berlin"; // City variable is defined but not used in this context
const lat = 53.4661983935898;
const lon = 9.69158914791978;

const baseUrl = (zipcode) => {
  return `https://api.bild.de/historicalweatherdata/get_weatherdata_json_object?path=weatherdata/100y&file=plz_${zipcode}`;
};

let plzData;

// DOM Elements
const modal = document.getElementById("search-page-container");
const searchBar = document.querySelector(".search");
const searchInput = document.querySelector(".search-input");
const modalInput = document.getElementsByClassName("modal-input")[0];
const overlay = document.getElementById("overlay");
const info = document.getElementById("info-modal");
const infoButton = document.getElementById("info-btn");
const infoContainer = document.querySelector(".info-container");
const temperature = document.getElementById("temperature");
const comparison = document.getElementById("comparison");
const tempImage = document.getElementById("tempImage");
const form = document.getElementById("city-search-form");
const closeBtn = document.querySelector(".close");
const cancelBtn = document.querySelector(".cancel-btn");
const submitBtn = document.querySelector(".search-btn");
const inputField = document.getElementById("city-search-input");
const inputFieldContainer = document.querySelector(".input-field-container");
const suggestionsDiv = document.getElementById("suggestions");
const searchText = document.querySelector(".search-text");
const closeIcon = document.getElementById("close-icon");
const inputLegend = document.querySelector(".input-legend");
let currentFocus = -1;

function reorderBottomLegend() {
  const bottomLegend = document.querySelector('.bottom-legend');
  const bottomContainer = document.getElementById('bottom-legend-container');
  const card = document.querySelector('.card');
  if (window.innerWidth <= 656) {
    if (bottomContainer && bottomLegend && !bottomContainer.nextElementSibling.isSameNode(bottomLegend)) {
      bottomContainer.parentNode.insertBefore(bottomLegend, bottomContainer.nextSibling);
    }
  } else {
    if (card && bottomLegend && !card.firstElementChild.isSameNode(bottomLegend)) {
      card.insertBefore(bottomLegend, card.firstElementChild.nextSibling);
    }
  }
}

function showInfoIcon() {
  const infoContainer = document.querySelector('.info-container');

  if (!infoContainer) return; // Exit if .info-container is not found

  if (window.innerWidth <= 656) {
    infoContainer.classList.remove('hidden'); // Show the info container
  } else {
    infoContainer.classList.add('hidden'); // Hide the info container
  }
}

// Add an event listener to handle screen resize
window.addEventListener('resize', showInfoIcon);

// Run the function initially to set the correct state
showInfoIcon();

// Call the function on initial load and on window resize
window.addEventListener('load', reorderBottomLegend);
window.addEventListener('resize', reorderBottomLegend);
window.addEventListener('load', showInfoIcon);
window.addEventListener('resize', showInfoIcon);


// Fetch Postal Code Data
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const responsePlz = await fetch("./plz.json");
    plzData = await responsePlz.json();
  } catch (error) {
    console.error("Error fetching postal code data:", error);
  }
});

// Setup Search Form Event Listeners
const setupSearchForm = () => {
  form.addEventListener("submit", submitForm);
  closeBtn.addEventListener("click", clearInput);
  cancelBtn.addEventListener("click", closeModal);
  inputField.addEventListener("input", handleInput);

  document.addEventListener("click", (event) => {
    if (!suggestionsDiv.contains(event.target)) {
      clearSuggestions();
    }
  });
};

searchBar.addEventListener("click", function () {
  modal.style.display = "flex";
  searchBar.style.zIndex = '0';
});

// Optionally, add support for touch events
searchBar.addEventListener("touchstart", function () {
  modal.style.display = "flex";
  searchBar.style.zIndex = '0';
});

// Make sure the button is not disabled and is properly visible
searchBar.style.pointerEvents = "auto";
searchBar.style.visibility = "visible";


// Show Info Modal
infoButton.onclick = function () {
  info.style.display = "block";
  overlay.style.display = "block";
};

infoContainer.onclick = function () {
  info.style.display = "block";
  overlay.style.display = "block";
};

// Close Modal on Overlay Click
window.onclick = function (event) {
  if (event.target === overlay) {
    closeInfoOverlay();
  }
};

// Close Modal on Overlay Close Icon
closeIcon.addEventListener("click", () => {
  document.getElementById("overlay").style.display = "none";
  document.getElementById("info-modal").style.display = "none";
});

// Close Info Overlay Function
const closeInfoOverlay = () => {
  info.style.display = "none";
  overlay.style.display = "none";
};

// Close Modal Function
const closeModal = () => {
  modal.style.display = "none";
  searchBar.style.zIndex = '1';
};

// Handle Form Submission
const submitForm = async (event) => {
  event.preventDefault();

  try {
    const inputValue = inputField.value.trim();
    const zipData = await getZipByCityName(inputValue);
    const zip = zipData ? zipData.zip : inputValue;
    const response = await fetch(baseUrl(zip));
    
    if (!response.ok) throw new Error(`Failed to fetch weather data: ${response.status}`);

    const data = await response.json();
    searchInput.textContent=inputValue
    console.log(searchInput.textContent); 
    updateTempChart(data);

  } catch (error) {
    console.error("Error processing form submission:", error);
  }
};

// Fetch Zip Code by City Name
const getZipByCityName = async (input) => {
  try {
    const { uniqueCityZipList } = await getCityData();
    console.log(uniqueCityZipList)
    const result = uniqueCityZipList?.find((item) => item.Name.toLowerCase() === input.toLowerCase());
    return result ? { zip: result.Postleitzahl, name: result.Name } : { name: input, zip: input };
  } catch (error) {
    console.error("Error finding zip by city name:", error);
  }
};

// Get City Data
const getCityData = async () => {
  try {
    const response = await  fetch("./plz.json");
    const data = await response.json();

    const uniqueCityZipList = Array.from(new Set(data.map(item => item.Name)))
      .map(name => data.find(item => item.Name === name));

    return { uniqueCityZipList };
  } catch (error) {
    console.error("Error fetching city data:", error);
    return { uniqueCityZipList: [] };
  }
};

// Update Temperature Chart
const updateTempChart = (data) => {
  const element = document.querySelector("#tempChart");
  if (!element) throw new Error("Chart element not found");

  const newData = JSON.parse(JSON.stringify(data));
  const lastDataPoint = newData[newData.length - 1];
  if (lastDataPoint) {
    lastDataPoint.value += 10; 
  }

  const oldChart = document.querySelector(".main-svg");
  if (oldChart) oldChart.remove();

  const newElement = document.createElement("div");
  newElement.id = "tempChart";
  element.parentNode.replaceChild(newElement, element);

  const myTempChart = tempChart({
    element: newElement,
    data: newData,
  });

  if (!myTempChart || typeof myTempChart.remove !== "function") {
    throw new Error("tempChart did not return a valid chart instance with a remove method");
  }
};

// Handle Input Changes
const handleInput = (event) => {
  const inputValue = event.target.value.trim();
  let suggestions = [];

  if (inputValue) {
    if (/^\d+$/.test(inputValue)) {
      suggestions = plzData.filter((item) => item.Postleitzahl.startsWith(inputValue));
    } else {
      suggestions = plzData.filter((item) => item.Name.toLowerCase().startsWith(inputValue.toLowerCase()));
    }
    displaySuggestions(removeDuplicates(suggestions));
  } else {
    clearSuggestions();
  }
};

// Handle Key Down
const handleKeyDown = (event) => {
  const suggestionContainers = document.querySelectorAll(
    ".suggestion-container"
  );
  if (suggestionContainers.length === 0) return;

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();

    if (event.key === "ArrowDown") {
      currentFocus++;
      if (currentFocus >= suggestionContainers.length) currentFocus = 0;
    } else if (event.key === "ArrowUp") {
      currentFocus--;
      if (currentFocus < 0) currentFocus = suggestionContainers.length - 1;
    }

    setActive(suggestionContainers);
  } else if (event.key === "Enter") {
    if (currentFocus > -1) {
      suggestionContainers[currentFocus].click();
      document.getElementById("suggestions").innerHTML = "";
    }
  }
};

// Display Suggestions
const displaySuggestions = (suggestions) => {
  suggestionsDiv.innerHTML = "";
  const warningText = document.querySelector(".input-warning");

  if (suggestions.length > 0) {
    console.log("with suggestions")
    submitBtn.disabled = false;
    warningText.style.display = "none";
    const ul = document.createElement("ul");

    suggestions.forEach((suggestion) => {
      const li = document.createElement("li");
      const container = document.createElement("div");
      const img = document.createElement("img");
      const p = document.createElement("p");

      container.classList.add("suggestion-container");
      img.src = "./assets/magnifying_gray.svg";
      img.classList.add("suggestion-icon");
      p.classList.add("suggestion-element");
      p.textContent = suggestion.Name;
      inputLegend.style.color = "";
      inputFieldContainer.style.borderColor = "";
      container.appendChild(img);
      container.appendChild(p);
      li.appendChild(container);
      ul.appendChild(li);
      inputLegend.style.color = "";
      inputFieldContainer.style.borderColor = "";
      container.setAttribute("tabindex", "-1");
      container.addEventListener("click", () => {
        inputField.value = suggestion.Name;
        clearSuggestions();
      });
    });
    suggestionsDiv.appendChild(ul);
    document.addEventListener("keydown", handleKeyDown);
  } else {
    if (document.getElementById("city-search-input").value.length === 0) {
      warningText.style.display = "none";
      submitBtn.disabled = true;
      inputLegend.style.color = "";
      inputFieldContainer.style.borderColor = "";
    } else {
      inputLegend.style.color = "#DD0000";
      inputFieldContainer.style.borderColor = "#DD0000";
      warningText.style.display = "block";
      submitBtn.disabled = true;

    }
  }
};

// Clear Suggestions
const clearSuggestions = () => {
  suggestionsDiv.innerHTML = "";
};

// Remove Duplicates from Array
const removeDuplicates = (data) => {
  const uniqueNames = new Set();
  return data.filter((item) => {
    const nameLower = item.Name.toLowerCase();
    if (!uniqueNames.has(nameLower)) {
      uniqueNames.add(nameLower);
      return true;
    }
    return false;
  });
};

// Clear Input Field Value
const clearInput = (event) => {
  inputField.value = "";
  const inputField = event.target.previousElementSibling;
  inputLegend.style.color = "";

};

const removeValue = (event) => {
  const inputField = event.target.previousElementSibling;
  inputLegend.style.color = "";
  inputField.value = "";
};

// Initial Fetch for Default City
(async () => {
  try {
    const response = await fetch(baseUrl(zip));
    if (!response.ok) throw new Error(`An error occurred: ${response.statusText}`);

    const data = await response.json();
    updateTempChart(data);
  } catch (error) {
    console.error("Error fetching the initial weather data:", error);
  }
})();

// Close Search Modal
document.getElementById("search-btn").onclick = () => {
  closeModal();
};

// Set up search form event listeners
setupSearchForm();
