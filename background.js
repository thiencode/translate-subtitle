async function openBilingual() {
    const tracks = document.querySelectorAll("track");
    const en = Array.from(tracks).find((track) => track.srclang === "en");
  
    if (en) {
      en.track.mode = "showing";
      await sleep(500);
  
      const cues = Array.from(en.track.cues);
  
      const endSentence = cues
        .map((cue, index) => (cue.text.endsWith(".") ? index : -1))
        .filter((index) => index !== -1);
  
      const cuesTextList = getTexts(cues);
  
      const translatedText = await getTranslation(cuesTextList);
      const translatedList = translatedText.split(" z~z").slice(0, -1);
  
      for (let i = 0; i < endSentence.length; i++) {
        const start = i === 0 ? 0 : endSentence[i - 1] + 1;
        const end = endSentence[i];
  
        for (let j = start; j <= end; j++) {
          cues[j].text = translatedList[i];
        }
      }
    }
  }
  
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  
  function getTexts(cues) {
    return cues
      .map((cue) => cue.text.replace(/\n/g, " ").replace(/\.([^\.]*)$/, ". z~z $1"))
      .join(" ");
  }
  
  function getTranslation(words) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(["lang"], function (result) {
        const lang = result.lang;
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURI(
          words
        )}`;
  
        fetch(url)
          .then((response) => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error("Translation request failed.");
            }
          })
          .then((data) => {
            const translatedList = data[0];
            let translatedText = "";
            for (let i = 0; i < translatedList.length; i++) {
              translatedText += translatedList[i][0];
            }
            resolve(translatedText);
          })
          .catch((error) => reject(error));
      });
    });
  }
  
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.method == "translate") {
      openBilingual();
    }
  });
  