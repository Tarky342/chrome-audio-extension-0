chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const audioElements = document.querySelectorAll("audio, video");

    if (message.action === "setAudioOutput") {
        if (audioElements.length === 0) {
            console.warn("❌ 音声要素が見つかりません");
            sendResponse({ success: false, message: "音声要素が見つかりません" });
            return;
        }

        let promises = [];
        audioElements.forEach(audio => {
            if (audio.setSinkId) {
                promises.push(
                    audio.setSinkId(message.deviceId)
                        .then(() => console.log("✅ 音声出力デバイス変更成功"))
                        .catch(err => {
                            console.error("❌ Audio output change failed:", err);
                            return { success: false, message: err.message };
                        })
                );
            } else {
                console.warn("⚠️ setSinkId() がサポートされていません");
            }
        });

        Promise.all(promises).then(results => {
            if (results.some(r => r && !r.success)) {
                sendResponse({ success: false, message: "一部のデバイス変更に失敗しました" });
            } else {
                sendResponse({ success: true, message: "デバイス変更成功" });
            }
        });

        return true; // 非同期レスポンスを許可
    }

    if (message.action === "setVolume") {
        if (audioElements.length === 0) {
            console.warn("❌ 音声要素が見つかりません");
            sendResponse({ success: false, message: "音声要素が見つかりません" });
            return;
        }

        if (!window.globalAudioContext) {
            window.globalAudioContext = new AudioContext();
        }

        audioElements.forEach(audio => {
            if (!audio.audioContext) {
                const audioContext = window.globalAudioContext;
                const source = audioContext.createMediaElementSource(audio);
                const gainNode = audioContext.createGain();
                gainNode.gain.value = 1.0;

                source.connect(gainNode).connect(audioContext.destination);

                audio.audioContext = audioContext;
                audio.gainNode = gainNode;
            }

            // 🎯 volume を 0.0 〜 1.0 に制限（標準の音量制御）
            audio.volume = Math.min(1.0, Math.max(0.0, message.volume / 100));

            // 🎯 Web Audio API で 100%以上の増幅
            const volumeMultiplier = message.volume / 100;
            audio.gainNode.gain.value = Math.min(3.0, volumeMultiplier);

            console.log(🔊 音量を ${audio.volume * 100}%, 増幅率 ${audio.gainNode.gain.value} に設定);
        });

        sendResponse({ success: true, message: "音量変更成功" });
    }
});
