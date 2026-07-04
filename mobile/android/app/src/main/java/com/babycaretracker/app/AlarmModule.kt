package com.babycaretracker.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.Calendar

class AlarmModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val context: Context = reactContext

    override fun getName(): String {
        return "AlarmModule"
    }

    companion object {
        private var instance: AlarmModule? = null
        private var pendingAlarm: WritableMap? = null

        fun onAlarmTriggered(title: String?, body: String?) {
            val params = Arguments.createMap().apply {
                putString("title", title)
                putString("body", body)
            }
            val currentInstance = instance
            if (currentInstance != null && currentInstance.reactApplicationContext.hasActiveReactInstance()) {
                try {
                    currentInstance.reactApplicationContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("onAlarmTriggered", params)
                } catch (e: Exception) {
                    pendingAlarm = params
                }
            } else {
                pendingAlarm = params
            }
        }
    }

    init {
        instance = this
    }

    @ReactMethod
    fun checkOverlayPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(context))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${context.packageName}")
            )
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        }
    }

    @ReactMethod
    fun scheduleAlarm(
        id: String,
        type: String,
        value: Double,
        hour: Int,
        minute: Int,
        title: String,
        body: String,
        promise: Promise
    ) {
        try {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, AlarmReceiver::class.java).apply {
                putExtra("id", id)
                putExtra("type", type)
                putExtra("value", value)
                putExtra("hour", hour)
                putExtra("minute", minute)
                putExtra("title", title)
                putExtra("body", body)
            }

            val requestCode = id.hashCode()
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            )

            if (type == "interval") {
                val intervalMs = (value * 1000).toLong()
                val triggerAtMs = System.currentTimeMillis() + intervalMs
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        triggerAtMs,
                        pendingIntent
                    )
                } else {
                    alarmManager.setExact(
                        AlarmManager.RTC_WAKEUP,
                        triggerAtMs,
                        pendingIntent
                    )
                }
            } else {
                val calendar = Calendar.getInstance().apply {
                    set(Calendar.HOUR_OF_DAY, hour)
                    set(Calendar.MINUTE, minute)
                    set(Calendar.SECOND, 0)
                    set(Calendar.MILLISECOND, 0)
                    if (timeInMillis <= System.currentTimeMillis()) {
                        add(Calendar.DAY_OF_YEAR, 1)
                    }
                }
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        calendar.timeInMillis,
                        pendingIntent
                    )
                } else {
                    alarmManager.setExact(
                        AlarmManager.RTC_WAKEUP,
                        calendar.timeInMillis,
                        pendingIntent
                    )
                }
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_SCHEDULING_ALARM", e.message, e)
        }
    }

    @ReactMethod
    fun cancelAlarm(id: String, promise: Promise) {
        try {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, AlarmReceiver::class.java)
            val requestCode = id.hashCode()
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_MUTABLE
            )
            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_CANCELLING_ALARM", e.message, e)
        }
    }

    @ReactMethod
    fun getPendingAlarm(promise: Promise) {
        promise.resolve(pendingAlarm)
        pendingAlarm = null
    }
}
