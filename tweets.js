var mpBtn = '';
var mpPopup = '';
var mpLoad = '';
var noResults = '';
var parser = new DOMParser();

$.get(chrome.runtime.getURL('/magpie-btn.html'), function (data) {
  mpBtn = data;
});

$.get(chrome.runtime.getURL('/popup.html'), function (data) {
  mpPopup = data;
});

$.get(chrome.runtime.getURL('/loading.html'), function (data) {
  mpLoad = data;
});

$.get(chrome.runtime.getURL('/no_results.html'), function (data) {
  noResults = data;
});

$('head').append(`<link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">`);
$('body').append(`<style>
  .tweet-button:hover {
    background: black !important;
  }
</style>`);

var addMagpie = function () {
 //clear all active class
 $('.magpie').remove();

 //add active class to timeline
 $('article').withinviewport({top: -1000}).each(function (index, element) {
   let aTags = $(element).find("a");
   let url = '';
   aTags.each(function (idx, ele) {
     if (ele.getAttribute("aria-label") !== null) {
       url = ele.getAttribute("href");
     }
   });
   let res = url.split("/");
   let currWindow = window.location.href.split("/");
   let id = res.length >= 4 ? res[3] : (currWindow.length >= 5 ? currWindow[5] : "123");

   let domMpBtn = parser.parseFromString(mpBtn, "text/html").documentElement.querySelector(".magpie");
   let domMpPopup = parser.parseFromString(mpPopup, "text/html").documentElement.querySelector(".magpie-popup");
   let domMpLoad = parser.parseFromString(mpLoad, "text/html").documentElement.querySelector(".magpie-load");
   let domNoResults = parser.parseFromString(noResults, "text/html").documentElement.querySelector(".magpie-popup");
   let apiUrl = "https://api.twitter.com/1.1/statuses/show.json?id=" + id;
   domMpBtn.onclick = function () {
     $('.magpie-popup').remove();
     $(element).append(domMpLoad);
     var settings = {
       "url": apiUrl,
       "method": "GET",
       "timeout": 0,
       "headers": {
         "Authorization": `Bearer `,
       },
     };

     $.ajax(settings).done(function (response) {
      // alert(response.text);
      let postSettings = {
        "url": "https://magpie-backend.herokuapp.com/search",
        "method": "POST",
        "contentType": 'application/json',
        "data": JSON.stringify( { "tweet": response.text } ),
      };

      $.ajax(postSettings).done(function (res) {
         $('.magpie-load').remove();
         if (res.length === 0) {
          $(element).append(domNoResults);
         }
         else {
          $(element).append(mpPopup);
          let mpPopupCol = document.getElementById("magpie-popup-col");  
          for (let i = 0; i < res.length; i++) {
            let color = res[i].color === 0 ? "red" : (res[i].color === 1 ? "yellow" : "green");
            let rating = res[i].color === 0 ? "Negative" : (res[i].color === 1 ? "Neutral" : "Positive");
            let newsInfoString = `
            <div class="news-info inline">
            <a class="w-full group" href="${res[i].url}" target="_blank">
              <div class="flex flex-row w-full justify-evenly items-center my-2 group-hover:bg-gray-200">
              <div title="Sentiment Analysis: ${rating}" class="w-1/12 bg-${color}-700 text-center text-white text-md mr-2 text-lg">
                ${res[i].sentimentScore}
              </div>
              <div class="flex flex-col w-9/12">
                <h1 class="font-bold overflow-ellipsis w-full whitespace-nowrap overflow-hidden text-lg">${res[i].title}</h1>
                <p class="w-full whitespace-nowrap overflow-ellipsis overflow-hidden">${res[i].description}</p>
                <div class="text-xs">
                  <p>${res[i].source}</p>
                  <p class="italic">${res[i].timestamp}</p>
                </div>
              </div>
                <div class="w-2/12 ml-2">
                  <img
                    src="${res[i].image}">
                </div>
              </div>
              <div class="flex flex-row justify-end">
                <a class="rounded text-white px-1 tweet-button mb-2" style="background: #55ACEE" href="https://twitter.com/intent/tweet?in_reply_to=${id}&text=${encodeURIComponent=(res[i].url)}">Reply</a>
              </div>
            </div>`;
            let newDoc = parser.parseFromString(newsInfoString, "text/html").documentElement.querySelector(".news-info");
            $(mpPopupCol).append(newDoc);
          } 
        }
         let domMpClose = document.getElementById("magpie-popup-close");
         domMpClose.onclick = function () {
           $('.magpie-popup').remove();
         }
       });
     });
   };
   $(element).append(domMpBtn);
 });
}

$(window).bind("scroll", addMagpie);

setTimeout(addMagpie, 2000);