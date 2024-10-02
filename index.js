document.addEventListener("DOMContentLoaded", function () {
  const container = document.querySelector(".card");

  function postHeight() {
    console.log("s")
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

// fetch('Berlin.json')
//   .then((res) => res.json())
//   .then((data) => {
//     const myTempChart = tempChart({
//       element: document.querySelector("#tempChart"),
//       data,
//     });

//     document.querySelector("#rerenderBtn").addEventListener("click", () => {
//       // fake new data by changing the last available data point of this year May 7th;
//       const d = data.months
//         .find((d) => d.month === 5)
//         .days.find((d) => d.day === 7);
//       d.maxMaxThisYear = 15 + 20 * Math.random().toFixed(1);
//       myTempChart.update(data);
//     });
//   });
