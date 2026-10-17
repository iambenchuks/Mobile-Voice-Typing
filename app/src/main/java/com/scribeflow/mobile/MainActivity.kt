package com.scribeflow.mobile

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
                    Uri.parse("package:$packageName")
                )
                startActivity(intent)
            }
        }

        btnAccessibility.setOnClickListener {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            startActivity(intent)
            Toast.makeText(this, "Enable 'ScribeFlow Mobile' in Accessibility list", Toast.LENGTH_LONG).show()
        }

        btnMic.setOnClickListener {
            micPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }

        seekOpacity.progress = 55
        seekOpacity.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                val opacity = progress / 100f
                textOpacityValue.text = "$progress% (Translucent Watermark)"
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
