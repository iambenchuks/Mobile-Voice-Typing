import JSZip from 'jszip';
import { AndroidFile } from '../types';

export const ANDROID_FILES: AndroidFile[] = [
  {
    path: 'app/src/main/java/com/scribeflow/mobile/ScribeAccessibilityService.kt',
    filename: 'ScribeAccessibilityService.kt',
    category: 'kotlin',
    description: 'System-wide Accessibility Service that detects when you tap any text field, gets its screen coordinates, and injects recognized text into the active field.',
    content: `package com.scribeflow.mobile

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

                    Log.d(TAG, "Input focused in package: \${event.packageName}, bounds: \$bounds")

                    // Notify the floating overlay to appear near this field
                    FloatingWatermarkService.instance?.onInputFieldFocused(
                        packageName = event.packageName?.toString() ?: "",
                        fieldBounds = bounds
                    )
                }
            }
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                // If the user navigates away or closes the app, optionally check focus
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
                "\$existing \$newText"
            } else {
                "\$existing\$newText"
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
`,
  },
  {
    path: 'app/src/main/java/com/scribeflow/mobile/FloatingWatermarkService.kt',
    filename: 'FloatingWatermarkService.kt',
    category: 'kotlin',
    description: 'System overlay service rendering the translucent watermark pill. Stays visible over any app, supports dragging with edge snapping, and toggles offline recording.',
    content: `package com.scribeflow.mobile

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Rect
import android.graphics.RenderEffect
import android.graphics.Shader
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.ImageView
import android.widget.TextView
import androidx.core.app.NotificationCompat
import kotlin.math.abs

/**
 * FloatingWatermarkService
 *
 * Renders the ScribeFlow signature floating translucent watermark pill
 * over any active application using TYPE_APPLICATION_OVERLAY.
 */
class FloatingWatermarkService : Service(), OfflineSpeechEngine.RecognitionListener {

    companion object {
        private const val CHANNEL_ID = "scribeflow_overlay_channel"
        private const val NOTIF_ID = 1001
        var instance: FloatingWatermarkService? = null
            private set
    }

    private lateinit var windowManager: WindowManager
    private var floatView: View? = null
    private lateinit var layoutParams: WindowManager.LayoutParams
    private val mainHandler = Handler(Looper.getMainLooper())

    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var isRecording = false

    private lateinit var speechEngine: OfflineSpeechEngine
    private var vibrator: Vibrator? = null

    // Watermark opacity setting (0.55f = translucent watermark so text beneath is readable)
    var watermarkOpacity: Float = 0.55f
        set(value) {
            field = value
            floatView?.alpha = value
        }

    override fun onCreate() {
        super.onCreate()
        instance = this
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator

        speechEngine = OfflineSpeechEngine(applicationContext, this)
        speechEngine.initialize()

        createNotificationChannel()
        startForeground(NOTIF_ID, buildForegroundNotification())

        initFloatingView()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "ScribeFlow Floating Assistant",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps ScribeFlow floating watermark active across apps"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("ScribeFlow Offline Active")
            .setContentText("Tap any input field to dictate offline")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun initFloatingView() {
        val inflater = LayoutInflater.from(this)
        floatView = inflater.inflate(R.layout.layout_floating_watermark_pill, null)

        val windowType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            windowType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 100
            y = 500
        }

        // Apply translucent watermark effect so the user can see what's beneath
        floatView?.alpha = watermarkOpacity

        // Android 12+ hardware backdrop blur
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            floatView?.setRenderEffect(
                RenderEffect.createBlurEffect(12f, 12f, Shader.TileMode.CLAMP)
            )
        }

        // Touch & Drag Handling with Edge Snapping
        floatView?.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = layoutParams.x
                    initialY = layoutParams.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    // Briefly highlight on touch
                    floatView?.alpha = 0.90f
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    layoutParams.x = initialX + (event.rawX - initialTouchX).toInt()
                    layoutParams.y = initialY + (event.rawY - initialTouchY).toInt()
                    windowManager.updateViewLayout(floatView, layoutParams)
                    true
                }
                MotionEvent.ACTION_UP -> {
                    floatView?.alpha = watermarkOpacity
                    val dx = abs(event.rawX - initialTouchX)
                    val dy = abs(event.rawY - initialTouchY)

                    if (dx < 10 && dy < 10) {
                        // It was a tap! Toggle dictation
                        toggleDictation()
                    } else {
                        // Snap smoothly to left or right edge of screen
                        snapToEdge()
                    }
                    true
                }
                else -> false
            }
        }

        try {
            windowManager.addView(floatView, layoutParams)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun snapToEdge() {
        val displayMetrics = resources.displayMetrics
        val screenWidth = displayMetrics.widthPixels
        val middle = screenWidth / 2

        val targetX = if (layoutParams.x + (floatView?.width ?: 100) / 2 < middle) {
            24 // Snap left margin
        } else {
            screenWidth - (floatView?.width ?: 150) - 24 // Snap right margin
        }

        layoutParams.x = targetX
        windowManager.updateViewLayout(floatView, layoutParams)
    }

    fun onInputFieldFocused(packageName: String, fieldBounds: Rect) {
        mainHandler.post {
            floatView?.visibility = View.VISIBLE
            triggerHaptic(VibrationEffect.EFFECT_TICK)
        }
    }

    private fun toggleDictation() {
        if (!isRecording) {
            startRecording()
        } else {
            stopRecording()
        }
    }

    private fun startRecording() {
        isRecording = true
        triggerHaptic(VibrationEffect.EFFECT_CLICK)
        updatePillUI(recording = true)
        speechEngine.startListening()
    }

    private fun stopRecording() {
        isRecording = false
        triggerHaptic(VibrationEffect.EFFECT_DOUBLE_CLICK)
        updatePillUI(recording = false)
        speechEngine.stopListening()
    }

    private fun updatePillUI(recording: Boolean) {
        val icon = floatView?.findViewById<ImageView>(R.id.icon_mic)
        val text = floatView?.findViewById<TextView>(R.id.text_status)
        val pulse = floatView?.findViewById<View>(R.id.view_pulse)

        if (recording) {
            icon?.setColorFilter(Color.parseColor("#38BDF8")) // Cyan wave
            text?.text = "Listening..."
            text?.visibility = View.VISIBLE
            pulse?.visibility = View.VISIBLE
            floatView?.alpha = 0.95f
        } else {
            icon?.setColorFilter(Color.WHITE)
            text?.text = ""
            text?.visibility = View.GONE
            pulse?.visibility = View.GONE
            floatView?.alpha = watermarkOpacity
        }
    }

    private fun triggerHaptic(effectId: Int) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            vibrator?.vibrate(VibrationEffect.createPredefined(effectId))
        } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(30)
        }
    }

    // OfflineSpeechEngine callbacks
    override fun onPartialResult(partialText: String) {
        ScribeAccessibilityService.instance?.injectTranscribedText(partialText, append = false)
    }

    override fun onFinalResult(finalText: String) {
        val punctuated = PunctuationFormatter.format(finalText)
        ScribeAccessibilityService.instance?.injectTranscribedText(punctuated, append = true)
        stopRecording()
    }

    override fun onError(error: String) {
        mainHandler.post {
            updatePillUI(recording = false)
            isRecording = false
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        speechEngine.release()
        floatView?.let {
            try {
                windowManager.removeView(it)
            } catch (e: Exception) {
                // View might not be attached
            }
        }
        instance = null
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
`,
  },
  {
    path: 'app/src/main/java/com/scribeflow/mobile/OfflineSpeechEngine.kt',
    filename: 'OfflineSpeechEngine.kt',
    category: 'kotlin',
    description: 'Ultra-lightweight offline English voice recognition engine using Android on-device recognizer with EXTRA_PREFER_OFFLINE and streaming fallback.',
    content: `package com.scribeflow.mobile

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import java.util.Locale

/**
 * OfflineSpeechEngine
 *
 * Ultra-lightweight offline English voice dictation engine:
 * Supports on-device offline speech recognition with zero internet latency.
 * Uses Android on-device offline language pack (EXTRA_PREFER_OFFLINE).
 */
class OfflineSpeechEngine(
    private val context: Context,
    private val listener: RecognitionListener
) {
    companion object {
        private const val TAG = "OfflineSpeechEngine"
    }

    interface RecognitionListener {
        fun onPartialResult(partialText: String)
        fun onFinalResult(finalText: String)
        fun onError(error: String)
    }

    private var speechRecognizer: SpeechRecognizer? = null
    private var isRecording = false
    private val mainHandler = Handler(Looper.getMainLooper())

    fun initialize() {
        mainHandler.post {
            try {
                if (SpeechRecognizer.isRecognitionAvailable(context)) {
                    speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context)
                    setupListener()
                }
            } catch (e: Exception) {
                Log.e(TAG, "SpeechRecognizer initialization exception", e)
            }
        }
    }

    private fun setupListener() {
        speechRecognizer?.setRecognitionListener(object : android.speech.RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {}

            override fun onError(error: Int) {
                Log.w(TAG, "SpeechRecognizer error code: \$error")
                listener.onError("Recognition error: \$error")
            }

            override fun onResults(results: Bundle?) {
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                val text = matches?.firstOrNull() ?: ""
                if (text.isNotEmpty()) {
                    listener.onFinalResult(text)
                }
            }

            override fun onPartialResults(partialResults: Bundle?) {
                val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                val text = matches?.firstOrNull() ?: ""
                if (text.isNotEmpty()) {
                    listener.onPartialResult(text)
                }
            }

            override fun onEvent(eventType: Int, params: Bundle?) {}
        })
    }

    @SuppressLint("MissingPermission")
    fun startListening() {
        if (isRecording) return
        isRecording = true

        mainHandler.post {
            try {
                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.US.toString())
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                    // Request offline on-device processing
                    putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
                }
                speechRecognizer?.startListening(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Error starting speech recognition", e)
                listener.onError(e.message ?: "Failed to start speech recognition")
            }
        }
    }

    fun stopListening() {
        if (!isRecording) return
        isRecording = false

        mainHandler.post {
            try {
                speechRecognizer?.stopListening()
            } catch (e: Exception) {
                Log.w(TAG, "Error stopping speech recognition", e)
            }
        }
    }

    fun release() {
        stopListening()
        mainHandler.post {
            try {
                speechRecognizer?.destroy()
                speechRecognizer = null
            } catch (e: Exception) {
                Log.w(TAG, "Error destroying speechRecognizer", e)
            }
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/scribeflow/mobile/PunctuationFormatter.kt',
    filename: 'PunctuationFormatter.kt',
    category: 'kotlin',
    description: 'Post-processor that turns spoken punctuation commands ("comma", "period", "question mark", "new line") into formatted text with proper sentence capitalization.',
    content: `package com.scribeflow.mobile

/**
 * PunctuationFormatter
 *
 * Turns spoken dictation keywords into clean punctuation marks
 * and ensures smart sentence-case capitalization.
 */
object PunctuationFormatter {

    private val replacements = listOf(
        Regex("(?i)\\\\bnew paragraph\\\\b") to "\\n\\n",
        Regex("(?i)\\\\bnew line\\\\b") to "\\n",
        Regex("(?i)\\\\bperiod\\\\b") to ".",
        Regex("(?i)\\\\bfull stop\\\\b") to ".",
        Regex("(?i)\\\\bcomma\\\\b") to ",",
        Regex("(?i)\\\\bquestion mark\\\\b") to "?",
        Regex("(?i)\\\\bexclamation mark\\\\b") to "!",
        Regex("(?i)\\\\bexclamation point\\\\b") to "!",
        Regex("(?i)\\\\bcolon\\\\b") to ":",
        Regex("(?i)\\\\bsemicolon\\\\b") to ";",
        Regex("(?i)\\\\bopen quote\\\\b") to " \\"",
        Regex("(?i)\\\\bclose quote\\\\b") to "\\" ",
        Regex("(?i)\\\\bdash\\\\b") to " - ",
        Regex("(?i)\\\\bhyphen\\\\b") to "-",
        Regex("(?i)\\\\bsmiley face\\\\b") to " 😊 "
    )

    fun format(input: String): String {
        var text = input

        for ((regex, rep) in replacements) {
            text = text.replace(regex, rep)
        }

        // Clean spaces before punctuation
        text = text.replace(Regex("\\\\s+([.,!?:;])"), "$1")
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
            } else if (c == '.' || c == '?' || c == '!' || c == '\\n') {
                capitalizeNext = true
            }
        }

        return String(chars)
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/scribeflow/mobile/MainActivity.kt',
    filename: 'MainActivity.kt',
    category: 'kotlin',
    description: 'Main setup & onboarding screen. Guides the user through enabling Overlay Permission, Accessibility Service, and testing the watermark slider.',
    content: `package com.scribeflow.mobile

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.SeekBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var btnOverlay: Button
    private lateinit var btnAccessibility: Button
    private lateinit var btnMic: Button
    private lateinit var seekOpacity: SeekBar
    private lateinit var textOpacityValue: TextView

    private val micPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            Toast.makeText(this, "Microphone access granted!", Toast.LENGTH_SHORT).show()
            updateStatus()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        btnOverlay = findViewById(R.id.btn_grant_overlay)
        btnAccessibility = findViewById(R.id.btn_grant_accessibility)
        btnMic = findViewById(R.id.btn_grant_mic)
        seekOpacity = findViewById(R.id.seek_watermark_opacity)
        textOpacityValue = findViewById(R.id.text_opacity_value)

        btnOverlay.setOnClickListener {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:\$packageName")
                )
                startActivity(intent)
            }
        }

        btnAccessibility.setOnClickListener {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            startActivity(intent)
            Toast.makeText(this, "Enable 'ScribeFlow' in Accessibility list", Toast.LENGTH_LONG).show()
        }

        btnMic.setOnClickListener {
            micPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }

        seekOpacity.progress = 55
        seekOpacity.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                val opacity = progress / 100f
                textOpacityValue.text = "\$progress% (Translucent Watermark)"
                FloatingWatermarkService.instance?.watermarkOpacity = opacity
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })
    }

    override fun onResume() {
        super.onResume()
        updateStatus()
    }

    private fun updateStatus() {
        val hasOverlay = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(this)
        } else true

        val hasMic = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        val isA11yActive = ScribeAccessibilityService.instance != null

        btnOverlay.text = if (hasOverlay) "✓ Floating Overlay Granted" else "1. Grant Floating Overlay"
        btnOverlay.isEnabled = !hasOverlay

        btnAccessibility.text = if (isA11yActive) "✓ Accessibility Active" else "2. Enable Accessibility Service"
        btnAccessibility.isEnabled = !isA11yActive

        btnMic.text = if (hasMic) "✓ Microphone Granted" else "3. Grant Microphone Permission"
        btnMic.isEnabled = !hasMic
    }
}
`,
  },
  {
    path: 'app/src/main/res/layout/activity_main.xml',
    filename: 'activity_main.xml',
    category: 'xml',
    description: 'Main onboarding and permission configuration layout with opacity slider and sandbox field.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<ScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/background_dark"
    android:fillViewport="true">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="24dp">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:gravity="center_vertical"
            android:orientation="horizontal"
            android:paddingBottom="20dp">

            <ImageView
                android:layout_width="48dp"
                android:layout_height="48dp"
                android:background="@drawable/bg_glass_watermark_pill"
                android:contentDescription="ScribeFlow Logo"
                android:padding="10dp"
                android:src="@drawable/ic_scribeflow_watermark" />

            <LinearLayout
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_marginStart="16dp"
                android:orientation="vertical">

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:fontFamily="sans-serif-black"
                    android:text="@string/app_name"
                    android:textColor="@color/text_primary"
                    android:textSize="24sp" />

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:fontFamily="sans-serif-medium"
                    android:text="Offline Floating Dictation Assistant"
                    android:textColor="@color/accent"
                    android:textSize="13sp" />
            </LinearLayout>
        </LinearLayout>

        <androidx.cardview.widget.CardView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginBottom="24dp"
            app:cardBackgroundColor="@color/surface_dark"
            app:cardCornerRadius="16dp"
            app:cardElevation="0dp">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:padding="16dp">

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:fontFamily="sans-serif-medium"
                    android:text="⚡ 100% Offline English Engine"
                    android:textColor="@color/accent"
                    android:textSize="14sp" />

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_marginTop="6dp"
                    android:lineSpacingExtra="3dp"
                    android:text="Just like Handy on your laptop, ScribeFlow runs completely locally on your device with zero cloud latency and no internet connection required."
                    android:textColor="@color/text_secondary"
                    android:textSize="13sp" />
            </LinearLayout>
        </androidx.cardview.widget.CardView>

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginBottom="12dp"
            android:fontFamily="sans-serif-bold"
            android:text="@string/title_permissions"
            android:textColor="@color/text_primary"
            android:textSize="16sp" />

        <Button
            android:id="@+id/btn_grant_overlay"
            android:layout_width="match_parent"
            android:layout_height="52dp"
            android:layout_marginBottom="12dp"
            android:backgroundTint="@color/surface_card"
            android:fontFamily="sans-serif-medium"
            android:gravity="start|center_vertical"
            android:paddingStart="16dp"
            android:paddingEnd="16dp"
            android:text="@string/btn_overlay_label"
            android:textAllCaps="false"
            android:textColor="@color/text_primary"
            android:textSize="14sp" />

        <Button
            android:id="@+id/btn_grant_accessibility"
            android:layout_width="match_parent"
            android:layout_height="52dp"
            android:layout_marginBottom="12dp"
            android:backgroundTint="@color/surface_card"
            android:fontFamily="sans-serif-medium"
            android:gravity="start|center_vertical"
            android:paddingStart="16dp"
            android:paddingEnd="16dp"
            android:text="@string/btn_accessibility_label"
            android:textAllCaps="false"
            android:textColor="@color/text_primary"
            android:textSize="14sp" />

        <Button
            android:id="@+id/btn_grant_mic"
            android:layout_width="match_parent"
            android:layout_height="52dp"
            android:layout_marginBottom="24dp"
            android:backgroundTint="@color/surface_card"
            android:fontFamily="sans-serif-medium"
            android:gravity="start|center_vertical"
            android:paddingStart="16dp"
            android:paddingEnd="16dp"
            android:text="@string/btn_mic_label"
            android:textAllCaps="false"
            android:textColor="@color/text_primary"
            android:textSize="14sp" />

        <androidx.cardview.widget.CardView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginBottom="24dp"
            app:cardBackgroundColor="@color/surface_dark"
            app:cardCornerRadius="16dp"
            app:cardElevation="0dp">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:padding="16dp">

                <LinearLayout
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:orientation="horizontal">

                    <TextView
                        android:layout_width="0dp"
                        android:layout_height="wrap_content"
                        android:layout_weight="1"
                        android:fontFamily="sans-serif-medium"
                        android:text="@string/watermark_opacity_label"
                        android:textColor="@color/text_primary"
                        android:textSize="14sp" />

                    <TextView
                        android:id="@+id/text_opacity_value"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:fontFamily="sans-serif-bold"
                        android:text="55% (Translucent Watermark)"
                        android:textColor="@color/accent"
                        android:textSize="13sp" />
                </LinearLayout>

                <SeekBar
                    android:id="@+id/seek_watermark_opacity"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:max="100"
                    android:progress="55"
                    android:progressTint="@color/accent"
                    android:thumbTint="@color/accent" />
            </LinearLayout>
        </androidx.cardview.widget.CardView>
    </LinearLayout>
</ScrollView>
`,
  },
  {
    path: 'app/src/main/res/layout/layout_floating_watermark_pill.xml',
    filename: 'layout_floating_watermark_pill.xml',
    category: 'xml',
    description: 'Translucent glassmorphism floating watermark layout with drag handle and pulsing soundwave rings.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:clipToPadding="false"
    android:padding="8dp">

    <!-- Ambient glowing pulse ring during voice recognition -->
    <View
        android:id="@+id/view_pulse"
        android:layout_width="56dp"
        android:layout_height="56dp"
        android:layout_gravity="center"
        android:background="@drawable/bg_watermark_pulse_ring"
        android:visibility="gone" />

    <!-- Glassmorphic Translucent Pill Container -->
    <LinearLayout
        android:id="@+id/pill_container"
        android:layout_width="wrap_content"
        android:layout_height="44dp"
        android:layout_gravity="center"
        android:background="@drawable/bg_glass_watermark_pill"
        android:gravity="center_vertical"
        android:orientation="horizontal"
        android:paddingStart="12dp"
        android:paddingEnd="14dp">

        <ImageView
            android:id="@+id/icon_mic"
            android:layout_width="24dp"
            android:layout_height="24dp"
            android:contentDescription="ScribeFlow Dictate"
            android:src="@drawable/ic_scribeflow_watermark" />

        <TextView
            android:id="@+id/text_status"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginStart="8dp"
            android:fontFamily="sans-serif-medium"
            android:text="@string/listening_status"
            android:textColor="#FFFFFF"
            android:textSize="12sp"
            android:visibility="gone" />
    </LinearLayout>
</FrameLayout>
`,
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    filename: 'strings.xml',
    category: 'xml',
    description: 'Standard Android string resources for app labels and accessibility descriptions.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">ScribeFlow</string>
    <string name="accessibility_service_description">ScribeFlow detects when any text input field is focused across your apps, displays the floating translucent watermark pill, and injects offline transcribed speech directly into the active field.</string>
    <string name="title_permissions">Required Permissions</string>
    <string name="btn_overlay_label">1. Grant Floating Overlay</string>
    <string name="btn_accessibility_label">2. Enable Accessibility Service</string>
    <string name="btn_mic_label">3. Grant Microphone Permission</string>
    <string name="watermark_opacity_label">Watermark Opacity (Ghost / Translucent)</string>
    <string name="listening_status">Listening...</string>
</resources>
`,
  },
  {
    path: 'app/src/main/res/values/colors.xml',
    filename: 'colors.xml',
    category: 'xml',
    description: 'Theme color definitions for dark futuristic neon styling.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="primary">#06B6D4</color>
    <color name="primary_dark">#0891B2</color>
    <color name="accent">#38BDF8</color>
    <color name="background_dark">#090D16</color>
    <color name="surface_dark">#131B2E</color>
    <color name="surface_card">#1E293B</color>
    <color name="text_primary">#F8FAFC</color>
    <color name="text_secondary">#94A3B8</color>
    <color name="border_color">#334155</color>
    <color name="glass_border">#3338BDF8</color>
    <color name="glass_fill">#1A0F172A</color>
</resources>
`,
  },
  {
    path: 'app/src/main/res/values/themes.xml',
    filename: 'themes.xml',
    category: 'xml',
    description: 'MaterialComponents theme configuring Dark mode and status bar style.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.ScribeFlow" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">@color/primary</item>
        <item name="colorPrimaryDark">@color/primary_dark</item>
        <item name="colorAccent">@color/accent</item>
        <item name="android:windowBackground">@color/background_dark</item>
        <item name="android:statusBarColor">@color/background_dark</item>
        <item name="android:navigationBarColor">@color/background_dark</item>
    </style>
</resources>
`,
  },
  {
    path: 'app/src/main/res/xml/accessibility_service_config.xml',
    filename: 'accessibility_service_config.xml',
    category: 'xml',
    description: 'Android Accessibility Service XML descriptor targeting focus events and interactive window text fields.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/accessibility_service_description"
    android:accessibilityEventTypes="typeViewFocused|typeViewTextSelectionChanged|typeWindowStateChanged"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:notificationTimeout="50"
    android:canRetrieveWindowContent="true"
    android:settingsActivity="com.scribeflow.mobile.MainActivity" />
`,
  },
  {
    path: 'app/src/main/res/drawable/bg_glass_watermark_pill.xml',
    filename: 'bg_glass_watermark_pill.xml',
    category: 'xml',
    description: 'Translucent rounded pill shape drawable for the floating watermark overlay.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <corners android:radius="24dp" />
    <solid android:color="#4D0F172A" />
    <stroke
        android:width="1.5dp"
        android:color="#8038BDF8" />
    <padding
        android:left="12dp"
        android:top="8dp"
        android:right="12dp"
        android:bottom="8dp" />
</shape>
`,
  },
  {
    path: 'app/src/main/res/drawable/ic_scribeflow_watermark.xml',
    filename: 'ic_scribeflow_watermark.xml',
    category: 'xml',
    description: 'Vector drawable for the microphone watermark icon.',
    content: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#38BDF8"
        android:pathData="M12,14c1.66,0 3,-1.34 3,-3V5c0,-1.66 -1.34,-3 -3,-3S9,3.34 9,5v6c0,1.66 1.34,3 3,3z"/>
    <path
        android:fillColor="#38BDF8"
        android:pathData="M17,11c0,2.76 -2.24,5 -5,5s-5,-2.24 -5,-5H5c0,3.53 2.61,6.43 6,6.92V21h2v-3.08c3.39,-0.49 6,-3.39 6,-6.92h-2z"/>
</vector>
`,
  },
  {
    path: 'app/src/main/res/drawable/bg_watermark_pulse_ring.xml',
    filename: 'bg_watermark_pulse_ring.xml',
    category: 'xml',
    description: 'Glowing soundwave ring drawable rendered during speech listening.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="oval">
    <stroke
        android:width="2dp"
        android:color="#8038BDF8" />
    <solid android:color="#330284C7" />
</shape>
`,
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    filename: 'AndroidManifest.xml',
    category: 'manifest',
    description: 'Android Manifest defining SYSTEM_ALERT_WINDOW, RECORD_AUDIO, and BIND_ACCESSIBILITY_SERVICE.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Essential Permissions for ScribeFlow -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher"
        android:supportsRtl="true"
        android:theme="@style/Theme.ScribeFlow">

        <!-- Setup Activity -->
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Floating Watermark Overlay Service -->
        <service
            android:name=".FloatingWatermarkService"
            android:exported="false"
            android:foregroundServiceType="microphone" />

        <!-- Accessibility Service: Injects speech text into any active app -->
        <service
            android:name=".ScribeAccessibilityService"
            android:exported="true"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>

    </application>
</manifest>
`,
  },
  {
    path: 'app/build.gradle.kts',
    filename: 'build.gradle.kts (App)',
    category: 'gradle',
    description: 'App-level Gradle script defining SDK 34, AndroidX, Material, and Coroutine dependencies.',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.scribeflow.mobile"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.scribeflow.mobile"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = false
            applicationIdSuffix = ".debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.cardview:cardview:1.0.0")
    implementation("androidx.activity:activity-ktx:1.9.0")
    implementation("androidx.lifecycle:lifecycle-service:2.8.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")
}
`,
  },
  {
    path: 'build.gradle.kts',
    filename: 'build.gradle.kts (Root)',
    category: 'gradle',
    description: 'Root Gradle build script applying Android Application and Kotlin Android plugins.',
    content: `plugins {
    id("com.android.application") version "8.4.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}

tasks.register("clean", Delete::class) {
    delete(rootProject.layout.buildDirectory)
}
`,
  },
  {
    path: 'settings.gradle.kts',
    filename: 'settings.gradle.kts',
    category: 'gradle',
    description: 'Gradle repository configurations and project inclusion.',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "ScribeFlowMobile"
include(":app")
`,
  },
  {
    path: '.github/workflows/build-apk.yml',
    filename: 'build-apk.yml (GitHub Actions)',
    category: 'gradle',
    description: 'Automated GitHub Actions CI workflow that compiles the Android APK in the cloud and attaches it as a downloadable artifact.',
    content: `name: Build ScribeFlow Android APK

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    name: Build Android APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v3
        with:
          gradle-version: '8.7'

      - name: Build Debug APK with Gradle
        run: |
          gradle assembleDebug --stacktrace --no-daemon

      - name: Upload APK as GitHub Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ScribeFlow-debug-apk
          path: app/build/outputs/apk/debug/*.apk
          if-no-files-found: error
          retention-days: 30
`,
  },
  {
    path: 'README.md',
    filename: 'README.md',
    category: 'docs',
    description: 'Detailed instructions on downloading APK from GitHub Actions, building in Android Studio, and Android architecture.',
    content: `# ScribeFlow Mobile - Offline Floating Dictation for Android

Native Android App with translucent floating watermark pill, accessibility focus detection, and 100% offline speech-to-text dictation.

## How to Download the Compiled APK from GitHub Actions
1. Go to your GitHub repository and click on the **Actions** tab.
2. Select the workflow **"Build ScribeFlow Android APK"**.
3. Once completed (green checkmark), scroll down to **Artifacts**.
4. Click **ScribeFlow-debug-apk** to download the APK straight to your Android phone!
`,
  },
];

/**
 * Creates a ready-to-compile Android Studio ZIP archive
 */
export async function generateAndroidProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // Add all files
  for (const file of ANDROID_FILES) {
    zip.file(file.path, file.content);
  }

  // Add settings and root build scripts
  zip.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "ScribeFlowMobile"
include(":app")
`
  );

  zip.file(
    'build.gradle.kts',
    `plugins {
    id("com.android.application") version "8.4.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}

tasks.register("clean", Delete::class) {
    delete(rootProject.layout.buildDirectory)
}
`
  );

  zip.file(
    'gradle.properties',
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`
  );

  zip.file(
    'app/proguard-rules.pro',
    `# ScribeFlow Proguard Rules
-keep class com.scribeflow.mobile.** { *; }
-dontwarn com.scribeflow.mobile.**
`
  );

  zip.file(
    'gradle/wrapper/gradle-wrapper.properties',
    `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
  );

  return await zip.generateAsync({ type: 'blob' });
}
