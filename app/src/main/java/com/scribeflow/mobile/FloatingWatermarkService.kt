package com.scribeflow.mobile

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
