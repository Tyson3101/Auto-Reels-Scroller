const VIDEOS_LIST_SELECTOR = "main video";

const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
// -------

let shortCutToggleKeys = ["shift", "s"];
let applicationIsOn = true;
let scrollDirection = "down";
let amountOfPlays = 0;
let amountOfPlaysToSkip = 1;

(function initiate() {
  chrome.storage.sync.get(["applicationIsOn"], (result) => {
    if (result.applicationIsOn == null) {
      return startAutoScrolling();
    }
    if (result.applicationIsOn) startAutoScrolling();
  });
  chrome.storage.sync.get(["shortCut"], (result) => {
    shortCutToggleKeys = result.shortCut;
  });
  chrome.storage.sync.get(["amountOfPlays"], (result) => {
    amountOfPlaysToSkip = result.amountOfPlays;
  });
  chrome.storage.sync.get(["scrollDirection"], (result) => {
    scrollDirection = result.scrollDirection;
  });
})();

function startAutoScrolling() {
  if (!applicationIsOn) {
    applicationIsOn = true;
    chrome.storage.sync.set({ applicationIsOn: true });
  }
}

function stopAutoScrolling() {
  applicationIsOn = false;
  getCurrentVideo()?.setAttribute("loop", "true");
  chrome.storage.sync.set({ applicationIsOn: false });
}

async function endVideoEvent() {
  console.log({
    amountOfPlays,
    amountOfPlaysToSkip,
    scrollDirection,
    applicationIsOn,
    currentVideo: getCurrentVideo(),
  });
  const VIDEOS_LIST = Array.from(
    document.querySelectorAll(VIDEOS_LIST_SELECTOR)
  ) as HTMLVideoElement[];

  const currentVideo = getCurrentVideo();
  if (!currentVideo) return;
  if (!applicationIsOn) {
    currentVideo?.setAttribute("loop", "true");
    currentVideo.removeEventListener("ended", this);
  }
  amountOfPlays++;
  if (amountOfPlays < amountOfPlaysToSkip) return;

  const index = VIDEOS_LIST.findIndex(
    (vid) => vid.src && vid.src === currentVideo.src
  );
  let nextVideo = VIDEOS_LIST[index + (scrollDirection === "down" ? 1 : -1)];

  if (nextVideo) {
    amountOfPlays = 0;
    nextVideo.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "center",
    });
  }
}

(function loop() {
  (function addVideoEndEvent() {
    if (applicationIsOn) {
      const currentVideo = getCurrentVideo();
      currentVideo?.removeAttribute("loop");
      currentVideo?.addEventListener("ended", endVideoEvent);
    }
  })();

  sleep(100).then(loop);
})();

// Util
function getCurrentVideo() {
  return Array.from(document.querySelectorAll(VIDEOS_LIST_SELECTOR)).find(
    (video) => {
      const videoRect = video.getBoundingClientRect();

      const isVideoInView =
        videoRect.top >= 0 &&
        videoRect.left >= 0 &&
        videoRect.bottom <=
          (window.innerHeight || document.documentElement.clientHeight) &&
        videoRect.right <=
          (window.innerWidth || document.documentElement.clientWidth);

      return isVideoInView;
    }
  ) as HTMLVideoElement | null;
}

chrome.runtime.onMessage.addListener(({ toggle, changeOfSettings }) => {
  if (toggle) {
    chrome.storage.sync.get(["applicationIsOn"], (result) => {
      if (!result.applicationIsOn) startAutoScrolling();
      if (result.applicationIsOn) stopAutoScrolling();
    });
  }
  if (changeOfSettings) {
    chrome.storage.sync.get(
      ["shortCut", "amountOfPlays", "scrollDirection"],
      (result) => {
        shortCutToggleKeys = result.shortCut;
        amountOfPlaysToSkip = parseInt(result.amountOfPlays);
        scrollDirection = result.scrollDirection;
      }
    );
  }
});

function shortCutListener() {
  let pressedKeys = [];
  // Web Dev Simplifed Debounce
  function debounce(cb: Function, delay: number) {
    let timeout: number;

    return (...args: any) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        cb(...args);
      }, delay);
    };
  }

  const checkKeys = (
    keysToCheck: string[],
    delay: number = 700
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      function debounceCB() {
        if (pressedKeys.length == keysToCheck.length) {
          let match = true;
          for (let i = 0; i < pressedKeys.length; i++) {
            if (pressedKeys[i] != keysToCheck[i]) {
              match = false;
              break;
            }
          }
          resolve(match);
        } else resolve(false);
      }
      debounce(debounceCB, delay)();
    });
  };

  document.addEventListener("keydown", async (e) => {
    if (!e.key) return;
    pressedKeys.push(e.key.toLowerCase());
    // Shortcut for toggle application on/off
    if (await checkKeys(shortCutToggleKeys)) {
      if (applicationIsOn) {
        stopAutoScrolling();
      } else {
        startAutoScrolling();
      }
    }
    pressedKeys = [];
  });
}
