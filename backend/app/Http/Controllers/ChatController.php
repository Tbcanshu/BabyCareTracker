<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:500',
            'history' => 'nullable|array|max:10',
            'baby' => 'nullable|array',
        ]);

        $baby = $request->input('baby');
        $apiKey = env('GEMINI_API_KEY');
        
        $babyName = 'your baby';
        if ($baby && isset($baby['name']) && !empty($baby['name'])) {
            $babyName = $baby['name'];
        }

        if (!$apiKey || $apiKey === 'your_gemini_api_key') {
            return response()->json([
                'reply' => $this->getMockResponse($request->message, $babyName),
                'is_mock' => true
            ]);
        }

        // Cache Strategy (Production Optimization)
        // Normalize the message (lowercase, trim, strip punctuation) to match similar queries
        $messageNormalized = preg_replace('/\s+/', ' ', strtolower(trim($request->message)));
        $messageNormalized = preg_replace('/[^a-z0-9\s]/', '', $messageNormalized);

        // Include baby age and gender in cache context to ensure advice is accurate for this cohort
        $babyContext = '';
        if ($baby) {
            if (isset($baby['dob']) && !empty($baby['dob'])) {
                try {
                    $dob = \Carbon\Carbon::parse($baby['dob']);
                    $babyContext .= '_age_' . $dob->diffInMonths(now());
                } catch (\Exception $e) {}
            }
            if (isset($baby['gender']) && !empty($baby['gender'])) {
                $babyContext .= '_' . strtolower($baby['gender']);
            }
        }

        // Include last 3 history messages to prevent cache collisions during active conversations
        $historyContext = '';
        if ($request->history && is_array($request->history)) {
            $lastHistory = array_slice($request->history, -3);
            foreach ($lastHistory as $h) {
                if (isset($h['text'])) {
                    $historyContext .= '_' . preg_replace('/[^a-z0-9]/', '', strtolower($h['text']));
                }
            }
        }

        $cacheKey = 'chat_gemini_' . md5($messageNormalized . $babyContext . $historyContext);

        if (\Illuminate\Support\Facades\Cache::has($cacheKey)) {
            return response()->json([
                'reply' => \Illuminate\Support\Facades\Cache::get($cacheKey),
                'is_mock' => false,
                'is_cached' => true
            ]);
        }

        // Build the prompt instruction
        $systemInstruction = "You are a professional, friendly, and expert pediatric nurse and baby care AI assistant.\n"
            . "Answer the user's questions about babies (typically under 3 years old) with helpful, accurate, compassionate, and actionable advice.\n"
            . "Always prioritize child safety. If the question suggests a medical emergency (e.g. high fever in a newborn, breathing difficulties, swallowing foreign objects, extreme lethargy), urge the parent in bold to seek immediate professional medical care or go to an emergency room, and give them calm instructions on what to do while waiting.\n"
            . "Keep answers concise, easy to read, and formatted with clean bullet points or short paragraphs for busy, tired parents.";

        if ($baby && is_array($baby)) {
            $genderStr = isset($baby['gender']) && !empty($baby['gender']) ? strtolower($baby['gender']) : 'unknown gender';
            
            $ageStr = '';
            if (isset($baby['dob']) && !empty($baby['dob'])) {
                try {
                    $dob = \Carbon\Carbon::parse($baby['dob']);
                    $diff = $dob->diff(now());
                    if ($diff->y > 0) {
                        $ageStr = $diff->y . ' year(s) and ' . $diff->m . ' month(s) old';
                    } elseif ($diff->m > 0) {
                        $ageStr = $diff->m . ' month(s) and ' . $diff->d . ' day(s) old';
                    } else {
                        $ageStr = $diff->d . ' day(s) old';
                    }
                } catch (\Exception $e) {
                    // Ignore parsing issues
                }
            }

            $systemInstruction .= "\n\nThe parent is asking about their baby named '{$babyName}'";
            if ($genderStr !== 'unknown gender') {
                $systemInstruction .= ", who is a {$genderStr}";
            }
            if ($ageStr) {
                $systemInstruction .= " and is {$ageStr}";
            }
            $systemInstruction .= ". Tailor your advice specifically for a baby of this age and gender where appropriate, referencing them by name.";
        }

        // Prepare contents array for Gemini API (retaining history)
        // Trim history to maximum 5 messages to save tokens and prevent context inflation
        $contents = [];
        if ($request->history && is_array($request->history)) {
            $trimmedHistory = array_slice($request->history, -5);
            foreach ($trimmedHistory as $msg) {
                if (isset($msg['sender']) && isset($msg['text'])) {
                    $contents[] = [
                        'role' => $msg['sender'] === 'user' ? 'user' : 'model',
                        'parts' => [
                            ['text' => $msg['text']]
                        ]
                    ];
                }
            }
        }

        // Add the current user message
        $contents[] = [
            'role' => 'user',
            'parts' => [
                ['text' => $request->message]
            ]
        ];

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                'contents' => $contents,
                'systemInstruction' => [
                    'parts' => [
                        ['text' => $systemInstruction]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'maxOutputTokens' => 800,
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
                if ($reply) {
                    // Cache the successful response for 12 hours
                    \Illuminate\Support\Facades\Cache::put($cacheKey, $reply, now()->addHours(12));

                    return response()->json([
                        'reply' => $reply,
                        'is_mock' => false
                    ]);
                }
            }

            Log::error('Gemini API Error: ' . $response->body());
            
            // Fallback to mock on API failure
            return response()->json([
                'reply' => "I encountered an error connecting to my AI core, but as a backup baby helper: \n\n" . $this->getMockResponse($request->message, $babyName),
                'is_mock' => true,
                'error' => 'API call failed'
            ]);

        } catch (\Exception $e) {
            Log::error('Gemini Request Exception: ' . $e->getMessage());
            return response()->json([
                'reply' => "I encountered a connection error, but as a backup baby helper: \n\n" . $this->getMockResponse($request->message, $babyName),
                'is_mock' => true,
                'error' => $e->getMessage()
            ]);
        }
    }

    private function getMockResponse($message, $babyName = 'your baby')
    {
        $messageLower = strtolower($message);

        if (str_contains($messageLower, 'fever') || str_contains($messageLower, 'temperature') || str_contains($messageLower, 'hot')) {
            return "### 🌡️ Managing Baby Fever\n\n"
                . "A fever is generally defined as a rectal/ear temperature of **100.4°F (38°C)** or higher.\n\n"
                . "**Immediate Emergency (See Doctor Immediately):**\n"
                . "- If **{$babyName}** is under **3 months** and has a temperature of 100.4°F (38°C) or higher.\n"
                . "- If the fever exceeds **104°F (40°C)**.\n"
                . "- If accompanied by difficulty breathing, a stiff neck, lethargy, or purple spots on the skin.\n\n"
                . "**General Home Care (For babies >3 months):**\n"
                . "1. **Keep them hydrated:** Offer breastmilk, formula, or small sips of water (if over 6 months).\n"
                . "2. **Dress lightly:** Use lightweight clothing and a thin blanket. Do not bundle them up.\n"
                . "3. **Lukewarm bath:** Sponge them with lukewarm (not cold) water to help cool them down. Avoid cold water or rubbing alcohol.\n"
                . "4. **Medications:** Consult your pediatrician about infant acetaminophen (Tylenol) or ibuprofen (Advil/Motrin - only if over 6 months) dosages based on **{$babyName}**'s weight, not age.\n\n"
                . "*Note: This is a backup response because the GEMINI_API_KEY is not configured in the `.env` file.*";
        }

        if (str_contains($messageLower, 'feed') || str_contains($messageLower, 'milk') || str_contains($messageLower, 'breast') || str_contains($messageLower, 'solid') || str_contains($messageLower, 'eat')) {
            return "### 🍼 Feeding & Nutrition Guidelines\n\n"
                . "Here is general advice on feeding **{$babyName}**:\n\n"
                . "- **0 to 6 Months:** Infant should receive exclusively breastmilk or formula. Feed on demand, typically every 2 to 3 hours (8-12 times per day).\n"
                . "- **Starting Solids (Around 6 Months):** Look for signs of readiness (sitting up, good head control, interest in food). Introduce single-ingredient purees (like iron-fortified baby cereal, pureed banana, avocado, or sweet potato) one at a time.\n"
                . "- **Avoiding Honey:** **Never** give honey to a baby under 12 months due to the risk of infant botulism.\n"
                . "- **Hydration:** Babies under 6 months do not need water. After 6 months, small amounts of water in a cup are fine.\n\n"
                . "**Signs of sufficient feeding:** 6+ wet diapers per day and consistent weight gain.\n\n"
                . "*Note: This is a backup response because the GEMINI_API_KEY is not configured in the `.env` file.*";
        }

        if (str_contains($messageLower, 'sleep') || str_contains($messageLower, 'nap') || str_contains($messageLower, 'awake') || str_contains($messageLower, 'night')) {
            return "### 💤 Safe Sleep Patterns\n\n"
                . "Safe sleep is crucial for **{$babyName}**'s health and development:\n\n"
                . "**Safe Sleep Environment:**\n"
                . "- Always place **{$babyName}** on their **back** to sleep for naps and at night.\n"
                . "- Use a firm, flat sleep surface (crib or bassinet) with a tight-fitting sheet.\n"
                . "- Keep the sleep area completely empty: **no** pillows, blankets, bumper pads, or stuffed animals (reduces SIDS risk).\n"
                . "- Room-share but do not bed-share. Keep the baby's crib near your bed.\n\n"
                . "**Sleep Duration by Age:**\n"
                . "- **Newborns (0-3m):** 14-17 hours total, waking frequently to feed.\n"
                . "- **Infants (4-11m):** 12-15 hours total, starting to sleep longer stretches at night.\n"
                . "- **Toddlers (1-2y):** 11-14 hours total, transitioning to 1 or 2 daytime naps.\n\n"
                . "*Note: This is a backup response because the GEMINI_API_KEY is not configured in the `.env` file.*";
        }

        if (str_contains($messageLower, 'cry') || str_contains($messageLower, 'colic') || str_contains($messageLower, 'soothe') || str_contains($messageLower, 'teething')) {
            return "### 😭 Understanding Crying & Soothing\n\n"
                . "Crying is how **{$babyName}** communicates their needs. If they are crying, go through this checklist:\n\n"
                . "1. **Physical Needs:** Check if they are hungry, need a diaper change, are too hot or cold, or have a clothing tag pinching them.\n"
                . "2. **Comfort & Overtiredness:** Rock, sway, or hold them. Use a white noise machine or a pacifier.\n"
                . "3. **Colic:** If crying lasts for >3 hours a day, >3 days a week, for >3 weeks in a healthy infant, it might be colic. Try gas drops (consult doctor), gentle tummy massages, or the 'colic carry' (holding baby face down on your forearm).\n"
                . "4. **Teething:** Drooling, chewing on objects, and irritability are signs. Provide a cold teething ring or rub their gums with a clean finger.\n\n"
                . "**Important Safety Reminder:** If you feel overwhelmed or angry, place **{$babyName}** safely in their crib, walk to another room, take deep breaths for a few minutes. **Never shake a baby.**\n\n"
                . "*Note: This is a backup response because the GEMINI_API_KEY is not configured in the `.env` file.*";
        }

        if (str_contains($messageLower, 'poop') || str_contains($messageLower, 'stool') || str_contains($messageLower, 'diaper') || str_contains($messageLower, 'constipat')) {
            return "### 💩 Understanding Baby Poop\n\n"
                . "Baby bowel movements can vary widely in color, consistency, and frequency:\n\n"
                . "- **Color Guide:**\n"
                . "  - *Green/Brown/Yellow:* Normal variations based on age, feeding type, and solids.\n"
                . "  - *Red (blood), White (lack of bile), or Black (old blood, after newborn stage):* **Contact your pediatrician immediately.**\n"
                . "- **Consistency:** Breastfed baby poop is soft/mushy or runny (seedy). Formula-fed poop is slightly firmer, like peanut butter.\n"
                . "- **Constipation:** Hard, pellet-like stools that are painful to pass. Wiggle their legs in a bicycle motion or talk to a doctor about offering 1-2 ounces of prune/pear juice (if over 1 month).\n"
                . "- **Diaper Rash:** Keep the diaper area clean and dry. Use a thick barrier ointment containing zinc oxide during diaper changes.\n\n"
                . "*Note: This is a backup response because the GEMINI_API_KEY is not configured in the `.env` file.*";
        }

        return "### 👋 Hello! I am your Baby Care AI Assistant\n\n"
            . "I can help answer questions about **{$babyName}**'s development, feeding patterns, sleep safety, diaper issues, and general care.\n\n"
            . "**Here are some things you can ask me about:**\n"
            . "- *'What should I do if my baby has a fever?'*\n"
            . "- *'How long should a 6-month-old sleep?'*\n"
            . "- *'When should I start introducing solid foods?'*\n"
            . "- *'How do I soothe a crying baby?'*\n"
            . "- *'What color baby poop is concerning?'*\n\n"
            . "**To unlock the full power of Gemini AI:**\n"
            . "Please add your Gemini API key in the backend `.env` file:\n"
            . "```env\n"
            . "GEMINI_API_KEY=your_api_key_here\n"
            . "```\n"
            . "Once updated, you can chat with me about any parenting question!\n\n"
            . "*Disclaimer: I am an AI assistant, not a medical professional. For any urgent concerns, please contact your pediatrician or emergency services.*";
    }
}
