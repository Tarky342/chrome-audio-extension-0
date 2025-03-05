chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["content.js"]
        }, () => {
            chrome.storage.local.get(["audioDevice"], (result) => {
                if (result.audioDevice) {
                    chrome.tabs.sendMessage(tabId, {
                        action: "setAudioOutput",
                        deviceId: result.audioDevice
                    });
                }
            });
        });
    }
});