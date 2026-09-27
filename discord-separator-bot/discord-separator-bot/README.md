# Discord Separator Bot

يرسل صورة الفاصل بعد كل رسالة مستخدم داخل القناة المحددة.

## متغيرات Railway

- `DISCORD_TOKEN`: توكن البوت — لا تشاركه مع أي شخص.
- `CHANNEL_ID`: اتركه كما هو للقناة المطلوبة أو غيّره.
- `REACTION_ID`: معرّف الإيموجي الذي سيضعه البوت على كل رسالة.

القيمة الافتراضية لـ `CHANNEL_ID` هي:

`1447978433178239211`

معرّف التفاعل الافتراضي:

`1477117835322069083`

## التشغيل

```text
npm install
npm start
```

يجب تفعيل **Message Content Intent** من Discord Developer Portal، ومنح البوت صلاحية View Channel وSend Messages وAttach Files وRead Message History وAdd Reactions.
