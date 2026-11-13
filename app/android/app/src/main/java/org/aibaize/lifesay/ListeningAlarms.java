package org.aibaize.lifesay;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.VibrationAttributes;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Calendar;

public class ListeningAlarms extends BroadcastReceiver {
    static final String FIRE = "org.aibaize.lifesay.PLAY_SCHEDULE";
    private static final long LATE_LIMIT = 120_000;
    private static final long VIBRATION_DURATION_MS = 10_000;
    private static final String TAG = "LifeSayAlarm";
    private static final String[] HOLIDAYS = {
        "20260101-20260103", "20260215-20260223", "20260404-20260406",
        "20260501-20260505", "20260619-20260621", "20260925-20260927", "20261001-20261007",
        "20270101-20270103", "20270205-20270213", "20270403-20270405",
        "20270501-20270505", "20270609-20270609", "20270915-20270915", "20271001-20271007"
    };
    // State Council schedules: 2025 notice 7 and 2026 notice 10.
    private static final int[] MAKEUP = {20260104,20260214,20260228,20260509,20260920,20261010,
        20270131,20270214,20270508,20270926,20271009};

    static boolean permitted(Context c) {
        return Build.VERSION.SDK_INT < 31 || c.getSystemService(AlarmManager.class).canScheduleExactAlarms();
    }

    static JSONArray plans(Context c) {
        try { return new JSONArray(c.getSharedPreferences("listening", 0).getString("plans", "[]")); }
        catch (Exception error) { return new JSONArray(); }
    }

    static void store(Context c, JSONArray plans) {
        if (!c.getSharedPreferences("listening", 0).edit().putString("plans", plans.toString()).commit()) {
            throw new IllegalStateException("Unable to save listening plans");
        }
    }

    private static int dayKey(Calendar day) {
        return day.get(Calendar.YEAR)*10000 + (day.get(Calendar.MONTH)+1)*100 + day.get(Calendar.DAY_OF_MONTH);
    }

    static boolean matches(JSONObject plan, Calendar day) {
        int weekday = day.get(Calendar.DAY_OF_WEEK);
        String repeat = plan.optString("repeat");
        if ("weekly".equals(repeat)) {
            JSONArray days = plan.optJSONArray("days");
            if (days == null) return false;
            int iso = (weekday+5)%7 + 1;
            for (int i=0; i<days.length(); i++) if (days.optInt(i) == iso) return true;
            return false;
        }
        int date = dayKey(day);
        if (date < 20260101 || date > 20271231) return false;
        boolean holiday = false;
        for (String range : HOLIDAYS) {
            if (date >= Integer.parseInt(range.substring(0,8)) &&
                date <= Integer.parseInt(range.substring(9))) { holiday = true; break; }
        }
        if ("holiday".equals(repeat)) return holiday;
        if (!"workday".equals(repeat)) return false;
        for (int makeup : MAKEUP) if (date == makeup) return true;
        return !holiday && weekday != Calendar.SATURDAY && weekday != Calendar.SUNDAY;
    }

    static long next(JSONObject plan, long after) {
        if (!plan.optBoolean("enabled")) return 0;
        if ("once".equals(plan.optString("repeat"))) {
            long at = plan.optLong("onceAt");
            return at > after ? at : 0;
        }
        Calendar day = Calendar.getInstance();
        day.setTimeInMillis(after);
        String[] time = plan.optString("time").split(":");
        if (time.length != 2 || !plan.optString("time").matches("([01][0-9]|2[0-3]):[0-5][0-9]")) return 0;
        int hour = Integer.parseInt(time[0]), minute = Integer.parseInt(time[1]);
        for (int i=0; i<370; i++) {
            Calendar at = (Calendar) day.clone();
            at.set(Calendar.HOUR_OF_DAY,hour);
            at.set(Calendar.MINUTE,minute);
            at.set(Calendar.SECOND,0);
            at.set(Calendar.MILLISECOND,0);
            if (at.getTimeInMillis()>after && matches(plan,day)) return at.getTimeInMillis();
            day.add(Calendar.DAY_OF_MONTH,1);
        }
        return 0;
    }

    private static SharedPreferences preferences(Context c) {
        return c.getSharedPreferences("listening",0);
    }

    static long registeredAt(Context c) {
        return permitted(c) ? preferences(c).getLong("registeredAt",0) : 0;
    }

    private static Intent alarmIntent(Context c,long at) {
        return new Intent(c,ListeningAlarms.class).setAction(FIRE)
            .setData(Uri.parse("lifesay://listening/alarm/"+at)).putExtra("at",at);
    }

    private static void cancel(Context c,AlarmManager alarm,Intent intent) {
        PendingIntent pending = PendingIntent.getBroadcast(c,0,intent,
            PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_NO_CREATE);
        if (pending != null) { alarm.cancel(pending); pending.cancel(); }
    }

    static void reschedule(Context c,boolean refresh) {
        AlarmManager alarm = c.getSystemService(AlarmManager.class);
        long previous = preferences(c).getLong("registeredAt",0);
        if (!permitted(c)) {
            preferences(c).edit().remove("registeredAt").apply();
            return;
        }
        long now = System.currentTimeMillis(), first = Long.MAX_VALUE;
        if (refresh && previous>0 && now-previous<=LATE_LIMIT &&
            PendingIntent.getBroadcast(c,0,alarmIntent(c,previous),PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_NO_CREATE)!=null) return;
        JSONArray plans = plans(c);
        for (int i=0; i<plans.length(); i++) {
            JSONObject plan = plans.optJSONObject(i);
            if (plan == null) continue;
            long next = next(plan,now);
            if (next > 0) first = Math.min(first,next);
        }
        // Remove the PendingIntent used by 0.96 (1129) during migration.
        cancel(c,alarm,new Intent(c,ListeningAlarms.class).setAction(FIRE));
        if (previous>0 && previous!=first) cancel(c,alarm,alarmIntent(c,previous));
        if (first == Long.MAX_VALUE) {
            preferences(c).edit().remove("registeredAt").apply();
            return;
        }
        int flags = PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT;
        PendingIntent pending = PendingIntent.getBroadcast(c,0,alarmIntent(c,first),flags);
        PendingIntent show = PendingIntent.getActivity(c,0,new Intent(c,MainActivity.class),flags);
        try {
            alarm.setAlarmClock(new AlarmManager.AlarmClockInfo(first,show),pending);
            preferences(c).edit().putLong("registeredAt",first).apply();
            Log.i(TAG,"Registered alarm at "+first);
        } catch (SecurityException error) {
            preferences(c).edit().remove("registeredAt").apply();
            Log.w(TAG,"Alarm registration was denied",error);
        }
    }

    @Override public void onReceive(Context c, Intent intent) {
        if (!FIRE.equals(intent.getAction())) { reschedule(c,false); return; }
        long at = intent.getLongExtra("at",0), now = System.currentTimeMillis();
        if (at<=0 || at!=preferences(c).getLong("registeredAt",0)) return;
        preferences(c).edit().remove("registeredAt").apply();
        JSONArray plans = plans(c);
        java.util.ArrayList<JSONObject> due = new java.util.ArrayList<>();
        java.util.LinkedHashSet<String> scenes = new java.util.LinkedHashSet<>();
        boolean vibrate = false;
        int playCount = 1;
        for (int i=0; i<plans.length(); i++) {
            JSONObject plan = plans.optJSONObject(i);
            if (plan == null || next(plan,at-1)!=at) continue;
            due.add(plan);
            JSONArray selected=plan.optJSONArray("scenes");
            if (selected!=null) for (int j=0;j<selected.length();j++) scenes.add(selected.optString(j));
            vibrate |= plan.optBoolean("vibrate");
            playCount = Math.max(playCount, Math.max(1, Math.min(10, plan.optInt("playCount",1))));
            if ("once".equals(plan.optString("repeat"))) {
                try { plan.put("enabled",false); } catch (Exception ignored) {}
            }
        }
        String status = "missed";
        if (!scenes.isEmpty() && now-at <= LATE_LIMIT) {
            if (vibrate) vibrateForAlarm(c);
            Intent play = ListeningService.playIntent(c,new JSONArray(scenes),"immersion",0,0)
                .putExtra("scheduledAt",at).putExtra("playCount",playCount);
            try {
                if (Build.VERSION.SDK_INT>=26) c.startForegroundService(play);
                else c.startService(play);
                status="triggered";
                Log.i(TAG,"Playback requested for alarm "+at);
            } catch (IllegalStateException | SecurityException error) {
                status="failed";
                Log.w(TAG,"Scheduled playback start rejected",error);
            }
        }
        for (JSONObject plan : due) {
            try { plan.put("lastAt",at).put("lastStatus",status); } catch (Exception ignored) {}
        }
        store(c,plans);
        reschedule(c,false);
    }

    private static void vibrateForAlarm(Context c) {
        try {
            VibratorManager manager = Build.VERSION.SDK_INT >= 31 ? c.getSystemService(VibratorManager.class) : null;
            Vibrator vibrator = manager != null ? manager.getDefaultVibrator() : c.getSystemService(Vibrator.class);
            if (vibrator == null || !vibrator.hasVibrator()) return;
            if (Build.VERSION.SDK_INT >= 33) {
                vibrator.vibrate(VibrationEffect.createOneShot(VIBRATION_DURATION_MS,VibrationEffect.DEFAULT_AMPLITUDE),
                    VibrationAttributes.createForUsage(VibrationAttributes.USAGE_ALARM));
            } else {
                AudioAttributes alarm = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build();
                if (Build.VERSION.SDK_INT >= 26) {
                    vibrator.vibrate(VibrationEffect.createOneShot(VIBRATION_DURATION_MS,VibrationEffect.DEFAULT_AMPLITUDE),alarm);
                } else {
                    vibrator.vibrate(VIBRATION_DURATION_MS,alarm);
                }
            }
            Log.i(TAG,"Requested 10 seconds of alarm vibration");
        } catch (RuntimeException error) {
            Log.w(TAG,"Unable to start alarm vibration",error);
        }
    }

    static void playbackResult(Context c,long at,String status) {
        if (at<=0) return;
        JSONArray plans=plans(c);
        for (int i=0;i<plans.length();i++) {
            JSONObject plan=plans.optJSONObject(i);
            if (plan!=null && plan.optLong("lastAt")==at) {
                try { plan.put("lastStatus",status); } catch (Exception ignored) {}
            }
        }
        store(c,plans);
    }
}
