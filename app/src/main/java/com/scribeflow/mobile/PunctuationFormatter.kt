package com.scribeflow.mobile

/**
 * PunctuationFormatter
 *
 * Turns spoken dictation keywords into clean punctuation marks
 * and ensures smart sentence-case capitalization.
 */
object PunctuationFormatter {

    private val replacements = listOf(
        Regex("(?i)\\bnew paragraph\\b") to "\n\n",
        Regex("(?i)\\bnew line\\b") to "\n",
        Regex("(?i)\\bperiod\\b") to ".",
        Regex("(?i)\\bfull stop\\b") to ".",
        Regex("(?i)\\bcomma\\b") to ",",
        Regex("(?i)\\bquestion mark\\b") to "?",
        Regex("(?i)\\bexclamation mark\\b") to "!",
        Regex("(?i)\\bexclamation point\\b") to "!",
        Regex("(?i)\\bcolon\\b") to ":",
        Regex("(?i)\\bsemicolon\\b") to ";",
        Regex("(?i)\\bopen quote\\b") to " \"",
        Regex("(?i)\\bclose quote\\b") to "\" ",
        Regex("(?i)\\bdash\\b") to " - ",
        Regex("(?i)\\bhyphen\\b") to "-",
        Regex("(?i)\\bsmiley face\\b") to " 😊 "
    )

    fun format(input: String): String {
        var text = input

        for ((regex, rep) to replacements) {
            text = text.replace(regex, rep)
        }

        // Clean spaces before punctuation
        text = text.replace(Regex("\\s+([.,!?:;])"), "$1")
        text = text.replace(Regex("([.,!?:;])(?=[A-Za-z])"), "$1 ")
        text = text.replace(Regex("[ ]{2,}"), " ")

        // Smart capitalization
        return capitalizeSentences(text.trim())
    }

    private fun capitalizeSentences(text: String): String {
        if (text.isEmpty()) return text

        val chars = text.toCharArray()
        var capitalizeNext = true

        for (i in chars.indices) {
            val c = chars[i]
            if (capitalizeNext && Character.isLetter(c)) {
                chars[i] = Character.toUpperCase(c)
                capitalizeNext = false
            } else if (c == '.' || c == '?' || c == '!' || c == '\n') {
                capitalizeNext = true
            }
        }

        return String(chars)
    }
}
