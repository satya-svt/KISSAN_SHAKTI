"""
demo_translation.py
KissanShakti - Telugu to Hindi Translation Demo
Intern 4 - AI Voice (Transcriber) | Anuhya

Simulates what happens after Whisper transcribes a farmer's Telugu speech:
  Telugu transcript → Hindi translation
"""

from deep_translator import GoogleTranslator

# ── Sample Telugu farmer sentences (as Whisper would transcribe them) ─────────
telugu_samples = [
    "నా పొలంలో వరి పంట బాగా పెరిగింది",           # My rice crop has grown well
    "ఈ సీజన్‌లో వర్షాలు సరిగా పడలేదు",             # Rains did not fall properly this season
    "మార్కెట్‌లో గోధుమ ధర పెరిగింది",               # Wheat price has increased in the market
    "నాకు ఎరువుల గురించి సలహా కావాలి",              # I need advice about fertilizers
    "నా భూమికి నీటి సదుపాయం లేదు",                 # My land has no water facility
]

print("=" * 60)
print("  KissanShakti — Telugu → Hindi Translation Demo")
print("  Intern 4 (Anuhya) | AI Voice Transcriber")
print("=" * 60)

translator = GoogleTranslator(source="te", target="hi")

for i, telugu_text in enumerate(telugu_samples, 1):
    hindi_text = translator.translate(telugu_text)
    print(f"\n[{i}] Telugu  : {telugu_text}")
    print(f"    Hindi   : {hindi_text}")

print("\n" + "=" * 60)
print("  Translation pipeline working successfully!")
print("=" * 60)
