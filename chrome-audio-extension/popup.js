document.addEventListener("DOMContentLoaded", async () => {
    const deviceSelect = document.getElementById("audioDevices");
    const applyButton = document.getElementById("applyButton");
    const volumeSlider = document.getElementById("volumeSlider");
    const volumeValue = document.getElementById("volumeValue");
    const volumeReset = document.getElementById("volumeReset");

    async function getActiveTab() {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab;
    }

    async function getAudioDevices() {
        try {
            console.log("🔄 オーディオデバイスの取得を開始...");
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioDevices = devices.filter(device => device.kind === "audiooutput");

            deviceSelect.innerHTML = "";
            if (audioDevices.length === 0) {
                deviceSelect.innerHTML = `<option disabled>オーディオ出力デバイスが見つかりません</option>`;
                return;
            }

            audioDevices.forEach(device => {
                const option = document.createElement("option");
                option.value = device.deviceId;
                option.textContent = device.label || `デバイス ${device.deviceId}`;
                deviceSelect.appendChild(option);
            });

            chrome.storage.local.get(["audioDevice", "volume"], (result) => {
                if (result.audioDevice) {
                    deviceSelect.value = result.audioDevice;
                }
                if (result.volume !== undefined) {
                    volumeSlider.value = result.volume;
                    volumeValue.textContent = `${result.volume}%`;
                }
            });

        } catch (error) {
            console.error("❌ オーディオデバイスの取得に失敗:", error);
        }
    }

    navigator.mediaDevices.addEventListener("devicechange", getAudioDevices);
    getAudioDevices();
    volumeSlider.addEventListener("input", () => {
        volumeValue.textContent = `${volumeSlider.value}%`;
    });
    volumeReset.addEventListener("click", () => {
        volumeSlider.value = 100;
        volumeValue.textContent = "100%";
    });
    applyButton.addEventListener("click", async () => {
        const selectedDevice = deviceSelect.value;
        const volume = volumeSlider.value;
        const tab = await getActiveTab();

        if (tab) {
            // 🔄 設定を保存
            chrome.storage.local.set({ audioDevice: selectedDevice, volume });

            // 🎯 音量変更メッセージを送信
            chrome.tabs.sendMessage(tab.id, { action: "setVolume", volume });

            // 🎯 出力デバイス変更メッセージを送信
            if (selectedDevice) {
                chrome.tabs.sendMessage(tab.id, { action: "setAudioOutput", deviceId: selectedDevice });
            }
        }
    });
});