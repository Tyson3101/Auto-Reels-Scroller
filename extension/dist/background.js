const allStorageKeys = [
    "applicationIsOn",
    "scrollDirection",
    "amountOfPlays",
    "shortCut",
];
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.tabs.create({ url: "popup/install.html" });
    }
    chrome.storage.sync.get(allStorageKeys, (result) => {
        if (result.applicationIsOn == undefined) {
            chrome.storage.sync.set({ applicationIsOn: true });
        }
        if (result.scrollDirection == undefined) {
            chrome.storage.sync.set({ scrollDirection: "down" });
        }
        if (result.amountOfPlays == undefined) {
            chrome.storage.sync.set({ amountOfPlays: 1 });
        }
        if (result.shortCut == undefined) {
            chrome.storage.sync.set({ shortCut: "shift+s" });
        }
    });
});
chrome.runtime.onUpdateAvailable.addListener(() => {
    chrome.runtime.reload();
});
