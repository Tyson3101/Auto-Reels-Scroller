const errMsg = document.querySelector("#error") as HTMLParagraphElement;
const toggleBtn = document.querySelector(".toggleBtn") as HTMLButtonElement;

const shortCutInput = document.querySelector("#shortCut") as HTMLInputElement;
const amountOfPlaysInput = document.querySelector(
  "#amountOfPlays"
) as HTMLInputElement;
const scrollDirectionInput = document.querySelector(
  "#scrollDirection"
) as HTMLInputElement;
const scrollOnCommentsInput = document.querySelector(
  "#scrollOnComments"
) as HTMLInputElement;

chrome.storage.onChanged.addListener((result) => {
  if (result.applicationIsOn?.newValue == undefined) return;
  changeToggleButton(result.applicationIsOn.newValue);
});

chrome.storage.sync.get(["applicationIsOn"], (result) => {
  changeToggleButton(result.applicationIsOn);
});

document.onclick = (e: Event) => {
  if ((e.target as HTMLButtonElement).classList.contains("toggleBtn"))
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.url?.includes("instagram")) {
        chrome.tabs.sendMessage(tabs[0].id, { toggle: true });
      } else {
        changeApplicationIsOn();
      }
    });
  if ((e.target as HTMLButtonElement).id === "shortCutBtn") {
    document.querySelector(".shortCut").classList.toggle("remove");
  }
};

function changeToggleButton(result: boolean) {
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
  chrome.storage.sync.get(["applicationIsOn"], (result) => {
    if (!result.applicationIsOn == undefined) {
      return chrome.storage.sync.set({
        applicationIsOn: true,
      });
    }
    chrome.storage.sync.set({ applicationIsOn: !result.applicationIsOn });
  });
}

// Settings

chrome.storage.sync.get(["shortCut"], (result) => {
  shortCutInput.value = result.shortCut.join("+");
});

chrome.storage.sync.get(["amountOfPlays"], (result) => {
  amountOfPlaysInput.value = result.amountOfPlays;
});

chrome.storage.sync.get(["scrollDirection"], (result) => {
  scrollDirectionInput.value = result.scrollDirection;
});

chrome.storage.sync.get(["scrollOnComments"], (result) => {
  scrollOnCommentsInput.value = result.scrollOnComments;
});

shortCutInput.onchange = async (e: Event) => {
  let newShortCut = shortCutInput.value.trim().toLowerCase().split("+");
  await chrome.storage.sync.set({ shortCut: newShortCut });
  messageTabOfStorageChange();
};

amountOfPlaysInput.onchange = async (e: Event) => {
  await chrome.storage.sync.set({
    amountOfPlays: parseInt(amountOfPlaysInput.value),
  });
  messageTabOfStorageChange();
};

scrollDirectionInput.onchange = async (e: Event) => {
  await chrome.storage.sync.set({
    scrollDirection: scrollDirectionInput.value,
  });
  messageTabOfStorageChange();
};

scrollOnCommentsInput.onchange = async (e: Event) => {
  await chrome.storage.sync.set({
    scrollOnComments: scrollOnCommentsInput.value === "true",
  });
  messageTabOfStorageChange();
};

function messageTabOfStorageChange() {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs[0]?.url?.includes("instagram")) {
      chrome.tabs.sendMessage(tabs[0].id, { changeOfSettings: true });
    }
  });
}
