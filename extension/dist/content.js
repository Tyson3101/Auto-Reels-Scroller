const VIDEOS_LIST_SELECTOR = "main video";
const COMMENTS_SELECTOR = ".BasePortal span";
const sleep = (milliseconds) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
// -------
let shortCutToggleKeys = ["shift", "s"];
let applicationIsOn = true;
let scrollOnComments = false;
let scrollDirection = "down";
let amountOfPlays = 0;
let amountOfPlaysToSkip = 1;
console.log(`Auto Instagram Reels Scroller is Running
Status: ${applicationIsOn ? "ON" : "OFF"}`);
(function initiate() {
    chrome.storage.sync.get(["applicationIsOn"], (result) => {
        if (result.applicationIsOn == null) {
            return startAutoScrolling();
        }
        if (result.applicationIsOn)
            startAutoScrolling();
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
    chrome.storage.sync.get(["scrollOnComments"], (result) => {
        scrollOnComments = result.scrollOnComments;
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
    const VIDEOS_LIST = Array.from(document.querySelectorAll(VIDEOS_LIST_SELECTOR));
    const currentVideo = getCurrentVideo();
    if (!currentVideo)
        return;
    if (!applicationIsOn) {
        currentVideo?.setAttribute("loop", "true");
        currentVideo.removeEventListener("ended", this);
    }
    amountOfPlays++;
    if (amountOfPlays < amountOfPlaysToSkip)
        return;
    const index = VIDEOS_LIST.findIndex((vid) => vid.src && vid.src === currentVideo.src);
    let nextVideo = VIDEOS_LIST[index + (scrollDirection === "down" ? 1 : -1)];
    if (!scrollOnComments && checkIfCommentsAreOpen()) {
        currentVideo.pause();
        let checkInterval = setInterval(() => {
            if (scrollOnComments || !checkIfCommentsAreOpen()) {
                scrollToNextVideo();
                clearInterval(checkInterval);
            }
        }, 100);
    }
    else {
        scrollToNextVideo();
    }
    function scrollToNextVideo() {
        if (nextVideo) {
            amountOfPlays = 0;
            nextVideo.scrollIntoView({
                behavior: "smooth",
                inline: "center",
                block: "center",
            });
        }
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
    return Array.from(document.querySelectorAll(VIDEOS_LIST_SELECTOR)).find((video) => {
        const videoRect = video.getBoundingClientRect();
        const isVideoInView = videoRect.top >= 0 &&
            videoRect.left >= 0 &&
            videoRect.bottom <=
                (window.innerHeight || document.documentElement.clientHeight) &&
            videoRect.right <=
                (window.innerWidth || document.documentElement.clientWidth);
        return isVideoInView;
    });
}
function checkIfCommentsAreOpen() {
    const comments = document.querySelector(COMMENTS_SELECTOR);
    return !!comments?.innerText?.length;
}
chrome.runtime.onMessage.addListener(({ toggle, changeOfSettings }) => {
    if (toggle) {
        chrome.storage.sync.get(["applicationIsOn"], (result) => {
            if (!result.applicationIsOn)
                startAutoScrolling();
            if (result.applicationIsOn)
                stopAutoScrolling();
        });
    }
    if (changeOfSettings) {
        chrome.storage.sync.get(["shortCut", "amountOfPlays", "scrollDirection", "scrollOnComments"], (result) => {
            console.log({ changeOfSettings, ...result });
            shortCutToggleKeys = result.shortCut;
            amountOfPlaysToSkip = parseInt(result.amountOfPlays);
            scrollDirection = result.scrollDirection;
            scrollOnComments = result.scrollOnComments;
        });
    }
});
(function shortCutListener() {
    // Encapsulate variables
    const pressedKeys = [];
    const debounceDelay = 700;
    function debounce(cb, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                cb(...args);
            }, delay);
        };
    }
    const checkKeys = (keysToCheck) => {
        return new Promise((resolve) => {
            function debounceCB() {
                if (pressedKeys.length === keysToCheck.length) {
                    let match = true;
                    for (let i = 0; i < pressedKeys.length; i++) {
                        if (pressedKeys[i] !== keysToCheck[i]) {
                            match = false;
                            break;
                        }
                    }
                    resolve(match);
                }
                else
                    resolve(false);
            }
            debounce(debounceCB, debounceDelay)();
        });
    };
    document.addEventListener("keydown", async (e) => {
        if (!e.key)
            return;
        pressedKeys.push(e.key.toLowerCase());
        if (await checkKeys(shortCutToggleKeys)) {
            if (applicationIsOn) {
                stopAutoScrolling();
            }
            else {
                startAutoScrolling();
            }
        }
        pressedKeys.length = 0; // Clear the array
    });
})();
