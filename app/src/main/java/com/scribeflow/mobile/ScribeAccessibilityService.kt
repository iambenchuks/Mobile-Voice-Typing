package com.scribeflow.mobile

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Rect
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * ScribeAccessibilityService
 *
 * Core engine for ScribeFlow Android:
 * 1. Detects when ANY input field (EditText) in ANY app gets focus.
 * 2. Grabs the field's screen bounds to place the floating watermark pill nearby.
 * 3. Injects transcribed offline speech directly into the active field.
 */
class ScribeAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "ScribeA11yService"
        var instance: ScribeAccessibilityService? = null
            private set
    }

    private var activeEditableNode: AccessibilityNodeInfo? = null

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "ScribeFlow Accessibility Service connected.")

        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_VIEW_FOCUSED or
                    AccessibilityEvent.TYPE_VIEW_TEXT_SELECTION_CHANGED or
                    AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            notificationTimeout = 50
            flags = AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS or
                    AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS
        }
        this.serviceInfo = info

        // Start floating watermark overlay service
        val overlayIntent = Intent(this, FloatingWatermarkService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(overlayIntent)
        } else {
            startService(overlayIntent)
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_FOCUSED,
            AccessibilityEvent.TYPE_VIEW_TEXT_SELECTION_CHANGED -> {
                val source = event.source ?: return

                // Check if the focused view is an editable text field
                if (source.isEditable || source.className?.contains("EditText", ignoreCase = true) == true) {
                    activeEditableNode = source
                    val bounds = Rect()
                    source.getBoundsInScreen(bounds)

                    Log.d(TAG, "Input focused in package: ${event.packageName}, bounds: $bounds")

                    // Notify the floating overlay to appear near this field
                    FloatingWatermarkService.instance?.onInputFieldFocused(
                        packageName = event.packageName?.toString() ?: "",
                        fieldBounds = bounds
                    )
                }
            }
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                // Focus state changed
            }
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "ScribeFlow Accessibility Service interrupted.")
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        activeEditableNode = null
    }

    /**
     * Injects transcribed text directly into the focused input field
     */
    fun injectTranscribedText(newText: String, append: Boolean = true) {
        val node = activeEditableNode ?: run {
            Log.w(TAG, "No active editable node to inject text into. Trying current focus.")
            findFocus(AccessibilityNodeInfo.FOCUS_INPUT)
        }

        if (node == null) {
            Log.e(TAG, "Cannot inject text: No input field in focus.")
            return
        }

        val textToSet: CharSequence = if (append) {
            val existing = node.text?.toString() ?: ""
            if (existing.isNotEmpty() && !existing.endsWith(" ") && !newText.startsWith(" ")) {
                "$existing $newText"
            } else {
                "$existing$newText"
            }
        } else {
            newText
        }

        // Method 1: Primary API - ACTION_SET_TEXT (Instant, seamless)
        val arguments = Bundle().apply {
            putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, textToSet)
        }
        val success = node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)

        // Method 2: Fallback for apps that intercept ACTION_SET_TEXT (e.g., custom webviews)
        if (!success) {
            Log.d(TAG, "ACTION_SET_TEXT rejected, falling back to Clipboard Paste.")
            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = ClipData.newPlainText("ScribeFlow", newText)
            clipboard.setPrimaryClip(clip)
            node.performAction(AccessibilityNodeInfo.ACTION_PASTE)
        }
    }
}
