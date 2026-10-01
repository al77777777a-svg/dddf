import os
from io import BytesIO
import requests
from flask import Flask, jsonify, request
app = Flask(__name__)
WEBHOOK_URL = os.environ["DISCORD_WEBHOOK_URL"]
SEPARATOR_URL = os.environ.get(
    "SEPARATOR_URL",
    "https://raw.githubusercontent.com/al77777777a-svg/dddf/main/discord-separator-bot/separator.webp",
)
@app.get("/")
def health():
    return "Discord webhook relay is running"
@app.post("/webhook")
def webhook():
    data = request.get_json(silent=True) or {}
    message = str(data.get("content", data.get("message", ""))).strip()
    if not message:
        return jsonify(error="Send JSON with a content or message field"), 400
    requests.post(WEBHOOK_URL, json={"content": message}, timeout=30).raise_for_status()
    image = requests.get(SEPARATOR_URL, timeout=30)
    image.raise_for_status()
    requests.post(
        WEBHOOK_URL,
        files={"file": ("separator.webp", BytesIO(image.content), "image/webp")},
        timeout=30,
    ).raise_for_status()
    return jsonify(ok=True)
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "10000")))
