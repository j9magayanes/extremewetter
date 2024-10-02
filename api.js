console.log(`extreme desktop ${window.innerWidth} ${window.innerHeight}`)
document.addEventListener("DOMContentLoaded", function () {
  const container = document.querySelector(".card");

  function postHeight() {
    window.parent.postMessage(
      {
        provider: "DAVIZ",
        type: "embed-size",
        height: document.body.clientHeight,
      },
      "*"
    );
  }
  new ResizeObserver(postHeight).observe(container);
});


// Initial Zip and City
let zip = "10115";
let city = "Berlin";
// What is the valid lat long for berlin
let lat = 53.4661983935898;
let lon = 9.69158914791978;
const base_url = (zipcode) => {
  return `https://api.bild.de/historicalweatherdata/get_weatherdata_json_object?path=weatherdata/100y&file=plz_${zipcode}`;
 };

const modal = document.getElementById("search-modal");
const searchButton = document.getElementById("search-btn");
const searchInput = document.getElementsByClassName("search-input")[0];
const modalInput = document.getElementsByClassName("modal-input")[0];
const textSearch = document.getElementById("text-search");
const textClose = document.getElementsByClassName("modal-text-close")[0];
const overlay = document.getElementById("overlay");
const info = document.getElementById("info-modal");
const infoButton = document.getElementById("info-btn");
const infoInput = document.getElementsByClassName("info-input")[0];
const temperature = document.getElementById("temperature");
const comparison = document.getElementById("comparison");
const tempImage = document.getElementById("tempImage");

// Get historical max temperatur for today's date
async function getMaxTemp(lat, long) {
  let dateToday = new Date();
  let formattedDate = dateToday.toISOString().split("T")[0];
  //let url = `https://api.brightsky.dev/weather?lat=${lat}&lon=${long}&date=${formattedDate}`;
  console.log(url)
  const urlResponse = await fetch(url);
  console.log(urlResponse)
  //const urlResponse = await fetch('Berlin.json');
  if (!urlResponse.ok) {
    throw new Error(`An error occurred: ${urlResponse.statusText}`);
  }
  const result = await urlResponse.json();

  let maxTemperature = -Infinity;
  let minTemperature = Infinity;
  let sumTemperature = 0;
  let count = 0;

  const currentHour = new Date().getUTCHours();

  for (let i = 0; i < result.weather.length; i++) {
    const weatherObj = result.weather[i];
    const hour = parseInt(weatherObj.timestamp.substr(11, 2));

    const localHour = (hour + 2) % 24;

    if (localHour <= currentHour + 2) {
      const temperature = weatherObj.temperature;
      sumTemperature += temperature;
      count++;
      if (temperature > maxTemperature) {
        maxTemperature = temperature;
      }
      if (temperature < minTemperature) {
        minTemperature = temperature;
      }
    } else {
      break;
    }
  }

  const avgTemperature = count > 0 ? sumTemperature / count : null;

  return { maxTemperature, avgTemperature };
}

// Fetch and display comparison data
(async () => {
  try {
    let avgMaxTemp = await getMaxTemp(lat, lon);
    let difference = parseFloat(
      avgMaxTemp.avgTemperature - avgMaxTemp.maxTemperature
    ).toFixed(2);
    temperature.textContent = Math.abs(difference);
    comparison.textContent = difference > 0 ? " wärmer" : " kälter";
    tempImage.src = `./assets/${difference > 0 ? "increase" : "decrease"}.svg`;
  } catch (error) {
    console.error("Error fetching temperature data:", error);
  }
})();

function extractNumber(input) {
  const match = input.match(/\((\d+)\)/);
  return match ? match[1] : null;
}

// Fill the chart from zip code
textSearch.onclick = async function () {
  let input = modalInput.value;
  if (input) {
    try {
      console.log(input)
      const result = await getZipByCityName(input);
      if (result) {
        const { zip, name: city } = result;
        await getWeatherData(zip);
        modalInput.value = city;
        searchInput.textContent = city;
        modal.style.display = "none";
      } else {
        console.error("No city found for the provided input.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }
};

searchButton.onclick = function () {
  modal.style.display = "block";
};

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

textClose.onclick = function () {
  modal.style.display = "none";
};

infoButton.onclick = function () {
  info.style.display = "block";
  overlay.style.display = "block"; 
};

window.onclick = function (event) {
  if (event.target == overlay) {
    info.style.display = "none";
    overlay.style.display = "none"; 
  }
};



// Get list of all the city and zip
async function getCityData() {
  const response = await fetch("https://api.bild.de/historicalweatherdata/get_weatherdata_json_object?path=weatherdata&file=PLZ");
  const data = await response.json();

  const cityMap = new Map();
  const uniqueCities = new Set();
  const uniqueCityZipList = [];

  data.forEach((i) => {
    cityMap.set(i.Postleitzahl, i.Name);

    if (!uniqueCities.has(i.Name)) {
      uniqueCities.add(i.Name);
      uniqueCityZipList.push({ zip: i.Postleitzahl, city: i.Name });
    }
  });

  return { cityMap, uniqueCityZipList };
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector(".modal-input");
  const suggestionsContainer = document.querySelector(
    ".autocomplete-suggestions"
  );

  async function filterSuggestions(query) {
    const cityMap = (await getCityData()).cityMap;
    const suggestions = [];
    const queryLower = query.toLowerCase();
    const uniqueNames = new Set();
  
    for (const [zip, name] of cityMap.entries()) {
      if (
        name.toLowerCase().includes(queryLower) ||
        zip.toLowerCase().includes(queryLower)
      ) {
        if (!uniqueNames.has(name.toLowerCase())) {
          uniqueNames.add(name.toLowerCase());
          suggestions.push(`${name}`);
        }
      }
    }
    return suggestions;
  }
  
  async function showSuggestions() {
    const query = input.value;
    const filteredSuggestions = await filterSuggestions(query);
    suggestionsContainer.innerHTML = "";

    if (filteredSuggestions.length > 0) {
      filteredSuggestions.forEach((suggestion) => {
        const div = document.createElement("div");
        div.classList.add("option");

        const textSpan = document.createElement("span");
        textSpan.textContent = suggestion;

        const svg = document.createElementNS(
          "",
          "svg"
        );
        svg.setAttribute("width", "20");
        svg.setAttribute("height", "20");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "2");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        svg.innerHTML = ` <path d="M19.6232 17.8646H18.647L18.301 17.5309C19.512 16.1222 20.241 14.2934 20.241 12.3039C20.241 7.86765 16.6451 4.27173 12.2089 4.27173C7.77268 4.27173 4.17676 7.86765 4.17676 12.3039C4.17676 16.7401 7.77268 20.336 12.2089 20.336C14.1984 20.336 16.0272 19.6069 17.436 18.3959L17.7696 18.7419V19.7181L23.9482 25.8844L25.7894 24.0431L19.6232 17.8646ZM12.2089 17.8646C9.13197 17.8646 6.64818 15.3808 6.64818 12.3039C6.64818 9.22694 9.13197 6.74316 12.2089 6.74316C15.2858 6.74316 17.7696 9.22694 17.7696 12.3039C17.7696 15.3808 15.2858 17.8646 12.2089 17.8646Z" fill="#495057"/>`;

        div.appendChild(svg);
        div.appendChild(textSpan);
        div.addEventListener("click", () => {
          input.value = suggestion;
          suggestionsContainer.style.display = "none";
        });
        suggestionsContainer.appendChild(div);
      });
      suggestionsContainer.style.display = "block";
    } else {
      const noResultDiv = document.createElement("div");
      noResultDiv.classList.add("option");
      noResultDiv.textContent = "Invalid ZIP/City";
      noResultDiv.style.color = "#f00";
      suggestionsContainer.appendChild(noResultDiv);
      suggestionsContainer.style.display = "block";
    }
  }

  input.addEventListener("input", showSuggestions);

  document.addEventListener("click", (event) => {
    if (
      !event.target.closest(".option") &&
      !event.target.closest(".modal-input")
    ) {
      suggestionsContainer.style.display = "none";
    }
  });

  input.addEventListener("focus", showSuggestions);
});

// Function to get zip code by city name
async function getZipByCityName(input) {
  try {
    const response = (await getCityData()).uniqueCityZipList;
    console.log(response)
    if (!response) {
      throw new Error(`An error occurred`);
    }
    console.log(input)
    const result = response.find(
      (i) => i.city === input
    );
    return result
      ? { zip: result.zip, name: result.city }
      : { name: input, zip: input };
  } catch (error) {
    console.error("Error fetching the city data:", error);
  }
}

async function getWeatherData(city) {
  try {
    //const response = await fetch(base_url(city));
    const response = await fetch('Berlin.json');
    if (!response.ok) {
      throw new Error(`An error occurred: ${response.statusText}`);
    }
    const data = await response.json();
    const element = document.querySelector("#tempChart");
    if (!element) {
      throw new Error("Chart element not found");
    }

    let myTempChart = tempChart({
      element: element,
      data,
    });

    if (!myTempChart || typeof myTempChart.remove !== "function") {
      throw new Error(
        "tempChart did not return a valid chart instance with a remove method"
      );
    }

    // Make a copy of the data and modify it
    const newData = JSON.parse(JSON.stringify(data));
    const lastDataPoint = newData[newData.length - 1];
    if (lastDataPoint) {
      lastDataPoint.value += 10;
    }

    // Remove old chart
    const oldChart = document.getElementsByClassName("main-svg")[0];
    if (oldChart) oldChart.remove();

    // Recreate chart element
    const newElement = document.createElement("div");
    newElement.id = "tempChart";
    element.parentNode.replaceChild(newElement, element);

    // Create new chart with modified data
    myTempChart = tempChart({
      element: newElement,
      data: newData,
    });

    if (!myTempChart || typeof myTempChart.remove !== "function") {
      throw new Error(
        "tempChart did not return a valid chart instance with a remove method"
      );
    }
  } catch (error) {
    console.error("Error fetching the weather data:", error);
  }
}

// Initial fetch for default city
(async () => {
  try {
     if (typeof zip === "undefined" || typeof base_url !== "function") {
      throw new Error("zip or base_url is not defined");
     }

   //const response = await fetch(base_url(zip));
   const response = await fetch('Berlin.json');
   if (!response.ok) {
     throw new Error(`An error occurred: ${response.statusText}`);
   }

    const data = await response.json();


    const element = document.querySelector("#tempChart");
    if (!element) {
      throw new Error("Chart element not found");
    }

    let myTempChart = tempChart({
      element: element,
      data,
    });
    console.log("Chart created successfully");
  } catch (error) {
    console.error("Error fetching the initial weather data:", error);
  }
})();




/* 
searchButton.onclick = function() {
  modal.style.display = "block";
}

textSearch.onclick = function() {
  convertedCity = modalInput.value;
  getWeatherData(convertedCity);
  modal.style.display = "none";
}

textClose.onclick = function() {
  modal.style.display = "none";
}

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}



const inputValue = document.querySelector('.modal-input');
inputValue.addEventListener('keyup', async (event) => {
  if (event.key === 'Enter') { // Only trigger on Enter key press
    const zipCode = inputValue.value.trim();
    console.log(zipCode);
    try {
      const cityName = await getCityNameByZip(zipCode);
      if (cityName) {
        convertedCity = cityName;
        inputValue.value = convertedCity;
        document.querySelector('.search-input').textContent = convertedCity;
      } else {
        console.error('No city found for the provided zip code.');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
});

// Function to get city name by zip code
async function getCityNameByZip(zipCode) {
  try {
    const response = await fetch("./data/plz.json");
    if (!response.ok) {
      throw new Error(`An error occurred: ${response.statusText}`);
    }
    const data = await response.json();
    const result = data.find(city => city.Postleitzahl === zipCode);
    return result ? result.Name : null;
  } catch (error) {
    console.error('Error fetching the city data:', error);
  }
}

async function getWeatherData(city) {
  try {
    const response = await fetch(`./data/${city}.json`);
    if (!response.ok) {
      throw new Error(`An error occurred: ${response.statusText}`);
    }
    const data = await response.json();
    const element = document.querySelector("#tempChart");

    if (!element) {
      throw new Error("Chart element not found");
    }

    let myTempChart = tempChart({
      element: element,
      data,
    });

    if (!myTempChart || typeof myTempChart.remove !== 'function') {
      throw new Error("tempChart did not return a valid chart instance with a remove method");
    }

    // Make a copy of the data and modify it
    const newData = JSON.parse(JSON.stringify(data)); // Deep copy the data
    const lastDataPoint = newData[newData.length - 1];
    if (lastDataPoint) {
      lastDataPoint.value += 10; // Modify the value for example
    }

    // Remove old chart
    const oldChart = document.getElementsByClassName("main-svg")[0];
    if (oldChart) oldChart.remove();
    
    // Recreate chart element
    const newElement = document.createElement("div");
    newElement.id = "tempChart";
    element.parentNode.replaceChild(newElement, element);

    // Create new chart with modified data
    myTempChart = tempChart({
      element: newElement,
      data: newData,
    });

    if (!myTempChart || typeof myTempChart.remove !== 'function') {
      throw new Error("tempChart did not return a valid chart instance with a remove method");
    }

  } catch (error) {
    console.error('Error fetching the weather data:', error);
  }
}

// // Initial fetch for default city
// (async () => {
//   try {
//     const response = await fetch(`./data/${city}.json`);
//     if (!response.ok) {
//       throw new Error(`An error occurred: ${response.statusText}`);
//     }
//     const data = await response.json();
//     const element = document.querySelector("#tempChart");

//     if (!element) {
//       throw new Error("Chart element not found");
//     }

//     let myTempChart = tempChart({
//       element: element,
//       data,
//     });
//   } catch (error) {
//     console.error('Error fetching the initial weather data:', error);
//   }
// })();
//  */