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
  chrome.storage.local.get(["applicationIsOn"], (result) => {
    if (result.applicationIsOn == null) {
      return startAutoScrolling();
    }
    if (result.applicationIsOn) startAutoScrolling();
  });
  chrome.storage.local.get(["shortCut"], (result) => {
    if (result.shortCut == null) {
      return chrome.storage.local.set({ shortCut: ["shift", "s"] });
    }
    shortCutToggleKeys = result.shortCut;
  });
  chrome.storage.local.get(["amountOfPlays"], (result) => {
    if (result.amountOfPlays == null) {
      return chrome.storage.local.set({ amountOfPlays: 1 });
    }
    amountOfPlaysToSkip = result.amountOfPlays;
  });
  chrome.storage.local.get(["scrollDirection"], (result) => {
    if (result.scrollDirection == null) {
      return chrome.storage.local.set({ scrollDirection: "down" });
    }
    scrollDirection = result.scrollDirection;
  });
})();

function startAutoScrolling() {
  if (!applicationIsOn) {
    applicationIsOn = true;
    chrome.storage.local.set({ applicationIsOn: true });
  }
}

function stopAutoScrolling() {
  applicationIsOn = false;
  getCurrentVideo()?.setAttribute("loop", "true");
  chrome.storage.local.set({ applicationIsOn: false });
}

async function endVideoEvent() {
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
      console.log({
        isPaused: currentVideo?.paused,
        currentTime: currentVideo?.currentTime,
        src: currentVideo?.src,
      });
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

chrome.runtime.onMessage.addListener(({ toggle }: { toggle: boolean }) => {
  if (toggle) {
    chrome.storage.local.get(["applicationIsOn"], (result) => {
      if (!result.applicationIsOn) startAutoScrolling();
      if (result.applicationIsOn) stopAutoScrolling();
    });
  }
});

chrome.storage.sync.onChanged.addListener((changes) => {
  if (changes.shortCut) {
    shortCutToggleKeys = changes.shortCut.newValue;
  }
  if (changes.amountOfPlays) {
    amountOfPlaysToSkip = changes.amountOfPlays.newValue;
  }
  if (changes.scrollDirection) {
    scrollDirection = changes.scrollDirection.newValue;
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
