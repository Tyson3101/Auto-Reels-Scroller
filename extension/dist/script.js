const errMsg = document.querySelector("#error");
const toggleBtn = document.querySelector(".toggleBtn");
const shortCutInput = document.querySelector("#shortCut");
const amountOfPlaysInput = document.querySelector("#amountOfPlays");
const scrollDirectionInput = document.querySelector("#scrollDirection");
chrome.storage.onChanged.addListener((result) => {
    if (result.applicationIsOn?.newValue == undefined)
        return;
    changeToggleButton(result.applicationIsOn.newValue);
});
chrome.storage.local.get(["applicationIsOn"], (result) => {
    changeToggleButton(result.applicationIsOn);
});
document.onclick = (e) => {
    if (e.target.classList.contains("toggleBtn"))
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0]?.url?.includes("instagram")) {
                chrome.tabs.sendMessage(tabs[0].id, { toggle: true });
            }
            else {
                changeApplicationIsOn();
            }
        });
    if (e.target.id === "shortCutBtn") {
        document.querySelector(".shortCut").classList.toggle("remove");
    }
};
function changeToggleButton(result) {
    if (result) {
        toggleBtn.innerText = "Stop";
        toggleBtn.classList.remove("start");
        toggleBtn.classList.add("stop");
    }
    if (!result) {
        toggleBtn.innerText = "Start";
        toggleBtn.classList.add("start");
        toggleBtn.classList.remove("stop");
    }
}
function changeApplicationIsOn() {
    chrome.storage.local.get(["applicationIsOn"], (result) => {
        if (!result.applicationIsOn == undefined) {
            return chrome.storage.local.set({
                applicationIsOn: false,
            });
        }
        chrome.storage.local.set({ applicationIsOn: !result.applicationIsOn });
    });
}
// Settings
chrome.storage.local.get(["shortCut"], (result) => {
    if (result.shortCut == null) {
        return chrome.storage.local.set({ shortCut: ["Alt", "s"] });
    }
    shortCutInput.value = result.shortCut.join("+");
});
chrome.storage.local.get(["amountOfPlays"], (result) => {
    if (result.amountOfPlays == null) {
        return chrome.storage.local.set({ amountOfPlays: 1 });
    }
    amountOfPlaysInput.value = result.amountOfPlays;
});
chrome.storage.local.get(["scrollDirection"], (result) => {
    if (result.scrollDirection == null) {
        return chrome.storage.local.set({ scrollDirection: "down" });
    }
    scrollDirectionInput.value = result.scrollDirection;
});
shortCutInput.onchange = (e) => {
    let newShortCut = shortCutInput.value.trim().split("+");
    chrome.storage.local.set({ shortCut: newShortCut });
};
amountOfPlaysInput.onchange = (e) => {
    chrome.storage.local.set({ amountOfPlays: amountOfPlaysInput.value });
};
scrollDirectionInput.onchange = (e) => {
    chrome.storage.local.set({ scrollDirection: scrollDirectionInput.value });
};
