package com.babycaretracker.app

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.NotificationCompat
import java.util.Calendar

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val wakeLock = pm.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
            "BabyCare::AlarmWakeLock"
        )
        wakeLock.acquire(10000) // Acquire for 10 seconds max

        val id = intent.getStringExtra("id") ?: ""
        val type = intent.getStringExtra("type") ?: ""
        val value = intent.getDoubleExtra("value", 0.0)
        val hour = intent.getIntExtra("hour", 0)
        val minute = intent.getIntExtra("minute", 0)
        val title = intent.getStringExtra("title") ?: "⏰ Alarm!"
        val body = intent.getStringExtra("body") ?: "Time to check on your baby!"

        // Reschedule if repeating
        rescheduleNext(context, id, type, value, hour, minute, title, body)

        // Show Full Screen Intent Notification / Overlay
        showAlarm(context, id, title, body)
    }

    private fun showAlarm(context: Context, id: String, title: String, body: String) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = "baby-alarm-native"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Baby Care Alarms",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "For critical baby care alerts and reminders"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 250, 500)
                setBypassDnd(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val requestCode = id.hashCode()
        val fullScreenIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("alarmTriggered", true)
            putExtra("alarmId", id)
            putExtra("alarmTitle", title)
            putExtra("alarmBody", body)
        }

        val fullScreenPendingIntent = PendingIntent.getActivity(
            context,
            requestCode,
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
        )

        // Retrieve package icon
        val iconResId = context.applicationInfo.icon

        val builder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(if (iconResId != 0) iconResId else android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setAutoCancel(true)
            .setOngoing(true)
            .setVibrate(longArrayOf(0, 500, 250, 500))

        notificationManager.notify(requestCode, builder.build())

        // If overlay permission is granted, launch activity directly as well
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(context)) {
            context.startActivity(fullScreenIntent)
        }
    }

    private fun rescheduleNext(
        context: Context,
        id: String,
        type: String,
        value: Double,
        hour: Int,
        minute: Int,
        title: String,
        body: String
    ) {
        if (id.isEmpty() || type.isEmpty()) return

        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val nextIntent = Intent(context, AlarmReceiver::class.java).apply {
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
            nextIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
        )

        if (type == "interval") {
            val intervalMs = (value * 1000).toLong()
            val nextTriggerMs = System.currentTimeMillis() + intervalMs
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextTriggerMs, pendingIntent)
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, nextTriggerMs, pendingIntent)
            }
        } else if (type == "daily") {
            val calendar = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, hour)
                set(Calendar.MINUTE, minute)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
                add(Calendar.DAY_OF_YEAR, 1) // Always next day when rescheduling
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, calendar.timeInMillis, pendingIntent)
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, calendar.timeInMillis, pendingIntent)
            }
        }
    }
}
