<?php

namespace App\Services;

class ContentModerationService
{
    /**
     * Curated list of abusive words, slurs, and profanity in English and Roman Urdu.
     */
    protected const BLOCKED_TERMS = [
        // English profanity & slurs
        'fuck', 'fucker', 'fucking', 'motherfucker', 'fck', 'fuk',
        'shit', 'shite', 'bullshit', 'asshole', 'bitch', 'bitches',
        'bastard', 'cunt', 'dick', 'pussy', 'whore', 'slut', 'slutty',
        'nigger', 'nigga', 'faggot', 'retard', 'retarded', 'blowjob',

        // Roman Urdu abusive terms & profanity
        'kutta', 'kutte', 'kutti', 'kamina', 'kaminey', 'harami', 'haramzada', 'haramzade',
        'bhenchod', 'behenchod', 'bhen chod', 'bc', 'madarchod', 'maderchod', 'mc',
        'chutiya', 'chootiya', 'chutya', 'gandu', 'gaandu', 'kanjar', 'khanzeer', 'khinzeer',
        'randi', 'rondi', 'bsdk', 'bhosdike', 'bhosdi', 'loda', 'lauda', 'lora', 'lund',
        'tatte', 'dalla', 'dallay', 'suar', 'suwar', 'kanjri',
    ];

    /**
     * Leetspeak substitution map.
     */
    protected const LEET_MAP = [
        '@' => 'a',
        '4' => 'a',
        '$' => 's',
        '5' => 's',
        '0' => 'o',
        '1' => 'i',
        '!' => 'i',
        '|' => 'i',
        '3' => 'e',
        '7' => 't',
        '8' => 'b',
        '+' => 't',
    ];

    /**
     * Validates complaint title and description against profanity, abusive terms, and spam.
     *
     * @param string $title
     * @param string $description
     * @return array{passed: bool, reason: ?string}
     */
    public function validate(string $title, string $description): array
    {
        $cleanTitle = trim($title);
        $cleanDesc = trim($description);

        // 1. Spam & Gibberish Check: Character length minimums
        if (mb_strlen($cleanTitle) < 5) {
            $reason = 'Title is too short. Please provide a clear and descriptive title (at least 5 characters).';
            return [
                'valid' => false,
                'passed' => false,
                'message' => $reason,
                'reason' => $reason,
            ];
        }

        if (mb_strlen($cleanDesc) < 15) {
            $reason = 'Description is too short. Please provide enough details about the civic problem (at least 15 characters).';
            return [
                'valid' => false,
                'passed' => false,
                'message' => $reason,
                'reason' => $reason,
            ];
        }

        // 2. Real Words Count: Must have at least 3 distinct word tokens (minimum 2 chars each)
        $words = preg_split('/\s+/', $cleanDesc);
        $validWords = array_filter($words, fn($w) => preg_match('/[a-zA-Z0-9]{2,}/', $w));
        if (count($validWords) < 3) {
            $reason = 'Your description contains too few words. Please describe the civic issue clearly and respectfully.';
            return [
                'valid' => false,
                'passed' => false,
                'message' => $reason,
                'reason' => $reason,
            ];
        }

        // 3. Repeated character spam (e.g. 'aaaaaaa', 'xxxxxxx', '.....')
        if (preg_match('/(.)\1{4,}/i', $cleanTitle) || preg_match('/(.)\1{5,}/i', $cleanDesc)) {
            $reason = 'Your text contains excessive repeated characters. Please describe the civic issue clearly and respectfully.';
            return [
                'valid' => false,
                'passed' => false,
                'message' => $reason,
                'reason' => $reason,
            ];
        }

        // 4. Repeated short pattern keyboard mashing (e.g. 'asdasdasdasdasd')
        if ($this->isKeyboardSpam($cleanTitle) || $this->isKeyboardSpam($cleanDesc)) {
            $reason = 'Your text appears to be invalid or gibberish. Please provide an intelligible description of the civic problem.';
            return [
                'valid' => false,
                'passed' => false,
                'message' => $reason,
                'reason' => $reason,
            ];
        }

        // 5. Profanity & Abusive Language Filter (English & Roman Urdu)
        if ($this->containsProfanity($cleanTitle) || $this->containsProfanity($cleanDesc)) {
            $reason = 'Your complaint contains inappropriate language or invalid text. Please describe the civic issue clearly and respectfully.';
            return [
                'valid' => false,
                'passed' => false,
                'message' => $reason,
                'reason' => $reason,
            ];
        }

        return [
            'valid' => true,
            'passed' => true,
            'message' => 'Content moderation validation passed.',
            'reason' => null,
        ];
    }

    /**
     * Checks if a string contains any blocked profanity or abusive term.
     */
    public function containsProfanity(string $text): bool
    {
        // 1. Standard word boundary check on lowercase text
        $lower = strtolower($text);

        // 2. Normalize leetspeak and symbols
        $normalized = strtr($lower, self::LEET_MAP);

        // 3. Collapse repeated characters (e.g. 'fuuuuuck' -> 'fuck', 'shiiit' -> 'shit')
        $collapsed = preg_replace('/(.)\1+/', '$1', $normalized);

        // 4. Strip punctuation/separators between letters (e.g. 'f*ck', 'f.u.c.k', 's_h_i_t')
        $strippedSeparators = preg_replace('/(?<=\w)[^\w\s]+(?=\w)/', '', $lower);
        $strippedNormalized = strtr($strippedSeparators, self::LEET_MAP);
        $strippedCollapsed = preg_replace('/(.)\1+/', '$1', $strippedNormalized);

        // 5. Also stripped of all spaces for spaced out profanity like 'f u c k'
        $squashed = preg_replace('/[^\w]/', '', $normalized);

        foreach (self::BLOCKED_TERMS as $term) {
            $pattern = '/\b' . preg_quote($term, '/') . '\b/i';

            // Check direct match
            if (preg_match($pattern, $lower) || preg_match($pattern, $normalized) || preg_match($pattern, $collapsed)) {
                return true;
            }

            // Check separator-stripped match
            if (preg_match($pattern, $strippedSeparators) || preg_match($pattern, $strippedNormalized) || preg_match($pattern, $strippedCollapsed)) {
                return true;
            }

            // For terms >= 4 chars, check if squashed text contains it (prevents 'f u c k' or 'b i t c h')
            if (strlen($term) >= 4 && str_contains($squashed, $term)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Detects long consonant runs or character diversity < 25% (keyboard smashing).
     */
    protected function isKeyboardSpam(string $text): bool
    {
        $tokens = preg_split('/\s+/', strtolower($text));
        foreach ($tokens as $token) {
            $cleanToken = preg_replace('/[^a-z]/', '', $token);
            $len = strlen($cleanToken);
            if ($len >= 12) {
                // If a 12+ char word has no vowels, it's gibberish like 'asdfghjklqwerty'
                if (!preg_match('/[aeiou]/', $cleanToken)) {
                    return true;
                }
                // Check unique characters ratio
                $uniqueChars = count(count_chars($cleanToken, 1));
                if (($uniqueChars / $len) < 0.25) {
                    return true;
                }
            }
        }
        return false;
    }
}
