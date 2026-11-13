package org.aibaize.lifesay;

import android.Manifest;
import android.app.AlarmManager;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.CalendarContract;
import android.provider.Settings;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import org.json.*;
import java.util.HashSet;
import java.util.Arrays;

@CapacitorPlugin(name="LifeSayListening", permissions={
    @Permission(alias="calendar", strings={Manifest.permission.READ_CALENDAR})
})
public class ListeningPlugin extends Plugin {
    @PluginMethod public void list(PluginCall call) {
        getActivity().runOnUiThread(()->{
            ListeningAlarms.reschedule(getContext(),true);
            resolvePlans(call);
        });
    }

    private void resolvePlans(PluginCall call) {
        JSONArray plans=ListeningAlarms.plans(getContext());
        long now=System.currentTimeMillis();
        for (int i=0;i<plans.length();i++) {
            JSONObject plan=plans.optJSONObject(i);
            if (plan!=null) {
                try { plan.put("nextAt",ListeningAlarms.next(plan,now)); } catch (JSONException ignored) {}
            }
        }
        JSObject result=new JSObject();
        result.put("plans",plans);
        result.put("exact",ListeningAlarms.permitted(getContext()));
        result.put("registeredAt",ListeningAlarms.registeredAt(getContext()));
        call.resolve(result);
    }

    @PluginMethod public void save(PluginCall call) {
        getActivity().runOnUiThread(()->{
            try {
                JSObject plan=call.getObject("plan");
                if (plan==null) throw new IllegalArgumentException("缺少任务");
                String id=plan.optString("id");
                if (!id.matches("[a-zA-Z0-9_-]{1,80}")) throw new IllegalArgumentException("任务编号无效");
                if (!plan.optString("time").matches("([01][0-9]|2[0-3]):[0-5][0-9]")) throw new IllegalArgumentException("请选择有效时间");
                if (plan.optString("note").length()>80) throw new IllegalArgumentException("备注过长");
                if (plan.has("playCount") && (plan.optInt("playCount",0)<1 || plan.optInt("playCount",0)>10))
                    throw new IllegalArgumentException("播放次数须为1至10次");
                String repeat=plan.optString("repeat");
                if (!Arrays.asList("once","weekly","workday","holiday").contains(repeat)) throw new IllegalArgumentException("请选择重复方式");
                if ("weekly".equals(repeat)) {
                    JSONArray days=plan.optJSONArray("days");
                    if (days==null || days.length()==0) throw new IllegalArgumentException("至少选择一天");
                    for (int i=0;i<days.length();i++) if (days.optInt(i)<1 || days.optInt(i)>7) throw new IllegalArgumentException("星期无效");
                }
                JSONArray programs=ListeningService.readIndex(getContext());
                HashSet<String> available=new HashSet<>();
                for (int i=0;i<programs.length();i++) {
                    JSONObject program=programs.getJSONObject(i);
                    if ("immersion".equals(program.optString("kind"))) available.add(program.getString("scene_id"));
                }
                JSONArray scenes=plan.optJSONArray("scenes");
                if (scenes==null || scenes.length()==0) throw new IllegalArgumentException("至少选择一个场景");
                for (int i=0;i<scenes.length();i++) if (!available.remove(scenes.getString(i))) throw new IllegalArgumentException("场景不支持定时播放");
                JSONArray updated=without(id);
                if (plan.optBoolean("enabled")) {
                    long now=System.currentTimeMillis();
                    long horizon=now+800L*24*60*60*1000;
                    for (int i=0;i<updated.length();i++) {
                        JSONObject existing=updated.optJSONObject(i);
                        if (existing==null || !existing.optBoolean("enabled") ||
                            !plan.optString("time").equals(existing.optString("time"))) continue;
                        long left=ListeningAlarms.next(plan,now), right=ListeningAlarms.next(existing,now);
                        while (left>0 && right>0 && left<=horizon && right<=horizon) {
                            if (left==right) throw new IllegalArgumentException("当前时间已经设置闹钟，保存失败~");
                            if (left<right) left=ListeningAlarms.next(plan,left);
                            else right=ListeningAlarms.next(existing,right);
                        }
                    }
                }
                updated.put(plan);
                ListeningAlarms.store(getContext(),updated);
                ListeningAlarms.reschedule(getContext(),false);
                resolvePlans(call);
            } catch (Exception e) { call.reject(e.getMessage()); }
        });
    }

    private JSONArray without(String id) {
        JSONArray old=ListeningAlarms.plans(getContext()), updated=new JSONArray();
        for (int i=0;i<old.length();i++) {
            JSONObject row=old.optJSONObject(i);
            if (row!=null && !id.equals(row.optString("id"))) updated.put(row);
        }
        return updated;
    }

    @PluginMethod public void remove(PluginCall call) {
        getActivity().runOnUiThread(()->{
            try {
                ListeningAlarms.store(getContext(),without(call.getString("id","")));
                ListeningAlarms.reschedule(getContext(),false);
                resolvePlans(call);
            } catch (Exception e) { call.reject(e.getMessage()); }
        });
    }

    @PluginMethod public void alarmPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT>=31 && !ListeningAlarms.permitted(getContext())) {
            Intent intent=new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                Uri.parse("package:"+getContext().getPackageName()));
            try { getActivity().startActivity(intent); } catch (Exception e) { call.reject("请在系统设置中允许闹钟和提醒"); return; }
        }
        call.resolve();
    }

    @PluginMethod public void calendar(PluginCall call) {
        if (getPermissionState("calendar")!=PermissionState.GRANTED && Boolean.TRUE.equals(call.getBoolean("request"))) {
            requestPermissionForAlias("calendar",call,"calendarPermissionResult");
        } else calendarPermissionResult(call);
    }

    @PluginMethod public void addToCalendar(PluginCall call) {
        Long at=call.getLong("at");
        if (at==null || at<=System.currentTimeMillis()) { call.reject("暂无未来的熏听日期"); return; }
        Intent intent=new Intent(Intent.ACTION_INSERT,CalendarContract.Events.CONTENT_URI)
            .putExtra(CalendarContract.Events.TITLE,call.getString("title","熏听"))
            .putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME,at.longValue())
            .putExtra(CalendarContract.EXTRA_EVENT_END_TIME,at+15*60_000L);
        try { getActivity().startActivity(intent); call.resolve(); }
        catch (Exception e) { call.reject("手机上没有可打开的日历编辑器"); }
    }

    @PermissionCallback private void calendarPermissionResult(PluginCall call) {
        JSObject result=new JSObject();
        boolean granted=getPermissionState("calendar")==PermissionState.GRANTED;
        result.put("granted",granted);
        JSONArray names=new JSONArray();
        if (granted) {
            try (Cursor cursor=getContext().getContentResolver().query(CalendarContract.Calendars.CONTENT_URI,
                new String[]{CalendarContract.Calendars.CALENDAR_DISPLAY_NAME},
                CalendarContract.Calendars.VISIBLE+"=1",null,null)) {
                if (cursor!=null) while(cursor.moveToNext()) names.put(cursor.getString(0));
            } catch (Exception e) { call.reject("手机日历读取失败"); return; }
        }
        result.put("names",names);
        call.resolve(result);
    }

    @PluginMethod public void play(PluginCall call) {
        try {
            Intent intent = ListeningService.playIntent(getContext(),call.getArray("scenes"),
                call.getString("kind","immersion"),
                call.getInt("scene",0),call.getInt("line",0));
            if (Build.VERSION.SDK_INT>=26) getContext().startForegroundService(intent);
            else getContext().startService(intent);
            call.resolve();
        } catch (Exception e) { call.reject("无法启动后台播放"); }
    }

    @PluginMethod public void control(PluginCall call) {
        String action=call.getString("action","");
        if (ListeningService.busy() && ("pause".equals(action)||"resume".equals(action)||"stop".equals(action))) {
            try { getContext().startService(new Intent(getContext(),ListeningService.class).setAction(action)); }
            catch (Exception e) { call.reject("无法控制后台播放"); return; }
        }
        call.resolve();
    }

    @PluginMethod public void status(PluginCall call) {
        try { call.resolve(new JSObject(ListeningService.state().toString())); }
        catch (JSONException e) { call.reject("无法读取播放状态"); }
    }
}
